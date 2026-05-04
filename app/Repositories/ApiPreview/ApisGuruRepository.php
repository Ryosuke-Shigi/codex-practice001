<?php

namespace App\Repositories\ApiPreview;

use Illuminate\Support\Facades\Http;
use Throwable;

class ApisGuruRepository
{
    public const LIST_URL = 'https://api.apis.guru/v2/list.json';

    private const REQUEST_HEADERS = [
        'Accept' => 'application/json',
    ];

    private const QUERY_PARAMETERS = [];

    /**
     * preview 専用の外部 API 通信です。DB 保存や本体同期処理はここでは行いません。
     *
     * @return array<string, mixed>
     */
    public function fetchList(): array
    {
        $startedAt = microtime(true);
        $fetchedAt = now()->toIso8601String();

        try {
            $response = Http::timeout(10)
                ->retry(2, 200, throw: false)
                ->withHeaders(self::REQUEST_HEADERS)
                ->get(self::LIST_URL, self::QUERY_PARAMETERS);
        } catch (Throwable $exception) {
            return $this->failureResult(
                fetchedAt: $fetchedAt,
                responseTimeMs: $this->responseTimeMs($startedAt),
                errorMessage: $exception->getMessage(),
            );
        }

        $payload = $response->json();
        $payloadIsArray = is_array($payload);
        $success = $response->successful() && $payloadIsArray;

        return [
            'endpoint' => self::LIST_URL,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'query_parameters' => self::QUERY_PARAMETERS,
            'success' => $success,
            'status_code' => $response->status(),
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $this->responseTimeMs($startedAt),
            'payload' => $payloadIsArray ? $payload : null,
            'body' => $response->body(),
            'error_message' => $success ? null : $this->errorMessage($response->status(), $payloadIsArray),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function failureResult(string $fetchedAt, float $responseTimeMs, string $errorMessage): array
    {
        return [
            'endpoint' => self::LIST_URL,
            'method' => 'GET',
            'request_headers' => self::REQUEST_HEADERS,
            'query_parameters' => self::QUERY_PARAMETERS,
            'success' => false,
            'status_code' => null,
            'fetched_at' => $fetchedAt,
            'response_time_ms' => $responseTimeMs,
            'payload' => null,
            'body' => null,
            'error_message' => $errorMessage,
        ];
    }

    private function responseTimeMs(float $startedAt): float
    {
        return round((microtime(true) - $startedAt) * 1000, 2);
    }

    private function errorMessage(int $statusCode, bool $payloadIsArray): string
    {
        if ($statusCode < 200 || $statusCode >= 300) {
            return sprintf('APIs.guru list.json request failed. Status: %d', $statusCode);
        }

        if (! $payloadIsArray) {
            return 'APIs.guru list.json response was not a JSON object.';
        }

        return 'APIs.guru list.json response could not be previewed.';
    }
}
