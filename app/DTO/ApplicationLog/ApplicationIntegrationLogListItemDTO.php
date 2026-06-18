<?php

namespace App\DTO\ApplicationLog;

use Carbon\CarbonInterface;

/**
 * API 連携ログ一覧の1行分を表す DTO です。
 */
final readonly class ApplicationIntegrationLogListItemDTO
{
    public function __construct(
        public int $id,
        public CarbonInterface $occurredAt,
        public string $status,
        public ?string $serviceName,
        public string $action,
        public ?string $message,
        public ?int $responseStatus,
    ) {}
}
