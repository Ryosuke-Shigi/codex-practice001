<?php

namespace App\Repositories\Earthquake;

use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use Illuminate\Support\Facades\Http;
use Throwable;

class JmaEarthquakeDetailXmlRepository implements EarthquakeDetailXmlRepositoryInterface
{
    private const DOCUMENT_URL_PREFIX = 'https://www.data.jma.go.jp/developer/xml/data/';

    private const REQUEST_HEADERS = [
        'Accept' => 'application/xml, text/xml;q=0.9',
    ];

    public function fetch(string $url): array
    {
        /*
         * この Repository は個別 XML 電文の外部取得だけを担当します。
         * Report / Head / Body の解釈、DTO生成、DB保存の判断は Service / Repository の別境界へ渡します。
         *
         * feed entry テーブルに保存された xml_url を入力にしますが、任意URL fetch にはしません。
         * JMA developer XML data 配下だけに限定し、Preview画面から外部任意URLへアクセスする
         * 経路にならないようにします。
         */
        if (! str_starts_with($url, self::DOCUMENT_URL_PREFIX)) {
            return $this->failureResult(
                endpoint: $url,
                fetchedAt: now()->toIso8601String(),
                responseTimeMs: 0.0,
                statusCode: null,
                errorMessage: '気象庁XML以外のURLは取得できません。',
            );
        }

        $startedAt = microtime(true);
        $fetchedAt = now()->toIso8601String();

        try {
            $response = Http::timeout(10)
                ->retry(2, 200, throw: false)
                ->withHeaders(self::REQUEST_HEADERS)
                ->get($url);
        } catch (Throwable) {
            $message = '気象庁 個別XMLに接続できませんでした。理由：ネットワーク、DNS、TLS、タイムアウトの可能性があります。';
            $result = $this->failureResult(
                endpoint: $url,
                fetchedAt: $fetchedAt,
                responseTimeMs: $this->responseTimeMs($startedAt),
                statusCode: null,
                errorMessage: $message,
            );
            $this->dispatchIntegrationLog(
                status: 'failed',
                message: $message,
                endpoint: $url,
                responseStatus: null,
            );

            return $result;
        }

        $success = $response->successful() && trim($response->body()) !== '';

        $result = [
            'endpoint' => $url,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'success' => $success,
            'status_code' => $response->status(),
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $this->responseTimeMs($startedAt),
            'body' => $response->body(),
            'error_message' => $success ? null : $this->errorMessage($response->status()),
        ];

        $this->dispatchIntegrationLog(
            status: $success ? 'success' : 'failed',
            message: $success
                ? '取得しました。'
                : (string) $result['error_message'],
            endpoint: $url,
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

    private function errorMessage(int $statusCode): string
    {
        if ($statusCode < 200 || $statusCode >= 300) {
            return '気象庁 個別XMLの取得先がエラーを返しました。理由：'.$this->httpStatusReason($statusCode);
        }

        return '気象庁 個別XMLの内容が空でした。';
    }

    private function httpStatusReason(int $statusCode): string
    {
        /*
         * 個別XMLの取得失敗では、本文全文より「なぜ追加できなかったか」が重要です。
         * レスポンス本文は保存せず、HTTP statusから説明できる範囲に絞って理由を作ります。
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
        string $status,
        string $message,
        string $endpoint,
        ?int $responseStatus,
    ): void {
        event(new ApplicationIntegrationLogged(
            integrationType: 'external_api',
            serviceName: '気象庁XML',
            action: '個別XML取得',
            status: $status,
            message: $message,
            targetType: 'jma_xml_endpoint',
            targetId: 'document',
            url: $endpoint,
            method: 'GET',
            responseStatus: $responseStatus,
        ));
    }
}
