<?php

namespace App\Repositories\Earthquake;

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
                errorMessage: 'JMA earthquake XML document URL is not allowed.',
            );
        }

        $startedAt = microtime(true);
        $fetchedAt = now()->toIso8601String();

        try {
            $response = Http::timeout(10)
                ->retry(2, 200, throw: false)
                ->withHeaders(self::REQUEST_HEADERS)
                ->get($url);
        } catch (Throwable $exception) {
            return $this->failureResult(
                endpoint: $url,
                fetchedAt: $fetchedAt,
                responseTimeMs: $this->responseTimeMs($startedAt),
                statusCode: null,
                errorMessage: $exception->getMessage(),
            );
        }

        $success = $response->successful() && trim($response->body()) !== '';

        return [
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
            return sprintf('JMA earthquake XML document request failed. Status: %d', $statusCode);
        }

        return 'JMA earthquake XML document response was empty.';
    }
}
