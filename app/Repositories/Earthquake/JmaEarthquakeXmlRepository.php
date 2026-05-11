<?php

namespace App\Repositories\Earthquake;

use Illuminate\Support\Facades\Http;
use Throwable;

/*
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
        return $this->fetchXml(self::FEED_URL);
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
                errorMessage: 'JMA earthquake XML document URL is not allowed.',
            );
        }

        return $this->fetchXml($url);
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchXml(string $endpoint): array
    {
        $startedAt = microtime(true);
        $fetchedAt = now()->toIso8601String();

        try {
            $response = Http::timeout(10)
                ->retry(2, 200, throw: false)
                ->withHeaders(self::REQUEST_HEADERS)
                ->get($endpoint);
        } catch (Throwable $exception) {
            return $this->failureResult(
                endpoint: $endpoint,
                fetchedAt: $fetchedAt,
                responseTimeMs: $this->responseTimeMs($startedAt),
                statusCode: null,
                errorMessage: $exception->getMessage(),
            );
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
        return [
            'endpoint' => $endpoint,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'success' => $success,
            'status_code' => $response->status(),
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $this->responseTimeMs($startedAt),
            'body' => $response->body(),
            'error_message' => $success ? null : $this->errorMessage($response->status()),
        ];
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
    ): array
    {
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

    private function errorMessage(int $statusCode): string
    {
        // 画面表示では HTTP status と短い説明だけに留め、upstream body 全文は出しません。
        if ($statusCode < 200 || $statusCode >= 300) {
            return sprintf('JMA earthquake XML feed request failed. Status: %d', $statusCode);
        }

        return 'JMA earthquake XML feed response was empty.';
    }
}
