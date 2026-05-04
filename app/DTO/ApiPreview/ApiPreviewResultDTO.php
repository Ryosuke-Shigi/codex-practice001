<?php

namespace App\DTO\ApiPreview;

final readonly class ApiPreviewResultDTO
{
    /*
     * API preview 画面に渡す結果 props の共通形です。
     * 実 API 取得、成功モック、エラーモックの表示構造をここで揃えます。
     */
    /**
     * @param  array<string, string|int|float|bool|null>  $requestHeaders
     * @param  array<string, string|int|float|bool|null>  $queryParameters
     * @param  array<int, array<string, mixed>>|null  $responsePreview
     */
    public function __construct(
        public string $apiName,
        public string $endpoint,
        public string $method,
        public bool $success,
        public ?int $statusCode,
        public ?string $fetchedAt,
        public ?int $totalCount,
        public ?float $responseTimeMs,
        public ?string $errorMessage,
        public array $requestHeaders,
        public array $queryParameters,
        public ?array $responsePreview,
        public string $rawPayloadPreview,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'api_name' => $this->apiName,
            'endpoint' => $this->endpoint,
            'method' => $this->method,
            'success' => $this->success,
            'status_code' => $this->statusCode,
            'fetched_at' => $this->fetchedAt,
            'total_count' => $this->totalCount,
            'response_time_ms' => $this->responseTimeMs,
            'error_message' => $this->errorMessage,
            'request_headers' => $this->requestHeaders,
            'query_parameters' => $this->queryParameters,
            'items' => $this->responsePreview,
            'raw_payload_preview' => $this->rawPayloadPreview,
        ];
    }
}
