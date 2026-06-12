<?php

namespace App\DTO\ApiPreview;

final readonly class ApiPreviewResultDTO
{
    /*
     * API Preview 画面専用 DTO です。
     * 本体同期処理・保存処理には使わず、本体へ移す場合は改めて DTO を切り直します。
     * ここでの目的は「DTO 設計前のレスポンス観察」であり、ドメインモデルの確定ではありません。
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
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        /*
         * React Page の既存 props 名に合わせて snake_case で返します。
         * PHP 内部の constructor property は camelCase、Inertia props は画面側に合わせる役割分担です。
         */
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
