<?php

namespace App\DTO\ApplicationLog;

use Carbon\CarbonInterface;

/**
 * API 連携ログ保存用の入力 DTO です。
 *
 * request / response body 全文や認証情報は受け取らず、連携結果を追える最小項目だけを保持します。
 */
final readonly class ApplicationIntegrationLogCreateDTO
{
    public function __construct(
        public string $integrationType,
        public ?string $serviceName,
        public string $action,
        public string $status,
        public ?string $message,
        public ?string $targetType,
        public ?string $targetId,
        public ?string $externalId,
        public ?string $url,
        public ?string $method,
        public ?int $responseStatus,
        public ?int $userId,
        public CarbonInterface $occurredAt,
    ) {}

    /**
     * @return array{
     *     integration_type: string,
     *     service_name: string|null,
     *     action: string,
     *     status: string,
     *     message: string|null,
     *     target_type: string|null,
     *     target_id: string|null,
     *     external_id: string|null,
     *     url: string|null,
     *     method: string|null,
     *     response_status: int|null,
     *     user_id: int|null,
     *     occurred_at: string
     * }
     */
    public function toArray(): array
    {
        return [
            'integration_type' => $this->integrationType,
            'service_name' => $this->serviceName,
            'action' => $this->action,
            'status' => $this->status,
            'message' => $this->message,
            'target_type' => $this->targetType,
            'target_id' => $this->targetId,
            'external_id' => $this->externalId,
            'url' => $this->url,
            'method' => $this->method,
            'response_status' => $this->responseStatus,
            'user_id' => $this->userId,
            'occurred_at' => $this->occurredAt->toDateTimeString(),
        ];
    }
}
