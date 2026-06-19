<?php

namespace App\Repositories\Earthquake;

use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * 気象庁 防災情報XML PULL型の XML を取得する Repository です。
 *
 * この層の責務は HTTP request / response の transport 情報をそろえることだけです。
 * Atom XML の entry 解釈、個別 XML の Report/Body 解析、React props 化、DB 保存、
 * Queue/Scheduler 連携、地図 pin 化は Service 以降へ渡し、ここには混ぜません。
 */
class JmaEarthquakeXmlRepository implements EarthquakeXmlRepositoryInterface
{
    public const FEED_URL = 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml';

    private const DOCUMENT_URL_PREFIX = 'https://www.data.jma.go.jp/developer/xml/data/';

    /*
     * Preview 画面で「どの形式を受け取りに行っているか」を後から追えるように、
     * request header は Repository 内で定数化します。JMA feed は Atom/XML なので、
     * JSON API 用の設定とは分けておきます。
     */
    private const REQUEST_HEADERS = [
        'Accept' => 'application/atom+xml, application/xml;q=0.9, text/xml;q=0.8',
    ];

    public function fetchHighFrequencyFeed(): array
    {
        /*
         * この Repository は外部通信だけを担当します。
         * Atom entry の解釈、表示用の並べ替え、DTO 生成、DB 保存、地図 pin 変換は行いません。
         */
        return $this->fetchXml(self::FEED_URL, '高頻度フィード取得', 'feed');
    }

    public function fetchXmlDocument(string $url): array
    {
        /*
         * Atom entry の link.href から個別 XML を取りに行きます。
         * Preview でも任意 URL fetch にはしないよう、JMA developer XML data 配下だけに限定します。
         */
        if (! str_starts_with($url, self::DOCUMENT_URL_PREFIX)) {
            $fetchedAt = now()->toIso8601String();

            return $this->failureResult(
                endpoint: $url,
                fetchedAt: $fetchedAt,
                responseTimeMs: 0.0,
                statusCode: null,
                errorMessage: '気象庁XML以外のURLは取得できません。',
            );
        }

        return $this->fetchXml($url, '個別XML取得', 'document');
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchXml(string $endpoint, string $action, string $targetId): array
    {
        $startedAt = microtime(true);
        $fetchedAt = now()->toIso8601String();

        try {
            $response = Http::timeout(10)
                ->retry(2, 200, throw: false)
                ->withHeaders(self::REQUEST_HEADERS)
                ->get($endpoint);
        } catch (Throwable) {
            $message = $targetId === 'document'
                ? '気象庁 個別XMLに接続できませんでした。理由：ネットワーク、DNS、TLS、タイムアウトの可能性があります。'
                : '気象庁 高頻度フィードに接続できませんでした。理由：ネットワーク、DNS、TLS、タイムアウトの可能性があります。';
            $result = $this->failureResult(
                endpoint: $endpoint,
                fetchedAt: $fetchedAt,
                responseTimeMs: $this->responseTimeMs($startedAt),
                statusCode: null,
                errorMessage: $message,
            );
            $this->dispatchIntegrationLog(
                action: $action,
                status: 'failed',
                message: $message,
                targetId: $targetId,
                endpoint: $endpoint,
                responseStatus: null,
            );

            return $result;
        }

        /*
         * HTTP 2xx でも本文が空なら Preview としては観察できないため失敗扱いにします。
         * XML の妥当性は Service 側で SimpleXML に読ませて判断し、Repository は
         * 「取得できたか」までを判定します。
         */
        $success = $response->successful() && trim($response->body()) !== '';

        /*
         * body は DB へ保存せず、同一 request 内で Service が XML を読むためだけに渡します。
         * 画面にも raw XML 全文は渡さず、Service が DTO や props 用配列に切り出します。
         */
        $result = [
            'endpoint' => $endpoint,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'success' => $success,
            'status_code' => $response->status(),
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $this->responseTimeMs($startedAt),
            'body' => $response->body(),
            'error_message' => $success ? null : $this->errorMessage($response->status(), $targetId),
        ];

        $this->dispatchIntegrationLog(
            action: $action,
            status: $success ? 'success' : 'failed',
            message: $success
                ? '取得しました。'
                : (string) $result['error_message'],
            targetId: $targetId,
            endpoint: $endpoint,
            responseStatus: $response->status(),
        );

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    private function failureResult(
        string $endpoint,
        string $fetchedAt,
        float $responseTimeMs,
        ?int $statusCode,
        string $errorMessage,
    ): array {
        /*
         * DNS/TLS/timeout など response がない失敗も Controller まで例外を漏らさず、
         * Preview 画面で status/message として確認できる transport result にそろえます。
         */
        return [
            'endpoint' => $endpoint,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'success' => false,
            'status_code' => $statusCode,
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $responseTimeMs,
            'body' => null,
            'error_message' => $errorMessage,
        ];
    }

    private function responseTimeMs(float $startedAt): float
    {
        return round((microtime(true) - $startedAt) * 1000, 2);
    }

    private function errorMessage(int $statusCode, string $targetId): string
    {
        // 画面表示では短い説明だけに留め、upstream body 全文は出しません。
        if ($statusCode < 200 || $statusCode >= 300) {
            $message = $targetId === 'document'
                ? '気象庁 個別XMLの取得先がエラーを返しました。'
                : '気象庁 高頻度フィードの取得先がエラーを返しました。';

            return $message.'理由：'.$this->httpStatusReason($statusCode);
        }

        return $targetId === 'document'
            ? '気象庁 個別XMLの内容が空でした。'
            : '気象庁 高頻度フィードの内容が空でした。';
    }

    private function httpStatusReason(int $statusCode): string
    {
        /*
         * レスポンス本文にはHTMLや長いエラー文が入る可能性があるためログへ保存しません。
         * ここではHTTP statusから安全に推測できる範囲だけを、日本語の短い理由として表示します。
         */
        return match (true) {
            $statusCode === 400 => '取得先がリクエストを受け付けませんでした。',
            in_array($statusCode, [401, 403], true) => '取得先でアクセスが拒否されました。',
            $statusCode === 404 => 'XMLファイルが見つかりません。',
            $statusCode === 408 => '取得先の応答が時間内に返りませんでした。',
            $statusCode === 429 => '取得回数が多く、取得先に制限されました。',
            $statusCode >= 500 => '取得先のサーバー側で障害が発生しています。',
            default => '取得先が正常ではない応答を返しました。',
        };
    }

    private function dispatchIntegrationLog(
        string $action,
        string $status,
        string $message,
        string $targetId,
        string $endpoint,
        ?int $responseStatus,
    ): void {
        event(new ApplicationIntegrationLogged(
            integrationType: 'external_api',
            serviceName: '気象庁XML',
            action: $action,
            status: $status,
            message: $message,
            targetType: 'jma_xml_endpoint',
            targetId: $targetId,
            url: $endpoint,
            method: 'GET',
            responseStatus: $responseStatus,
        ));
    }
}
