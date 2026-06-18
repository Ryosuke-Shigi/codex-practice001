<?php

namespace App\DTO\ApplicationLog;

/**
 * Project Hub の logs 表示に必要な API / ERROR ログ一覧をまとめる DTO です。
 */
final readonly class ApplicationLogsPageDTO
{
    /**
     * @param  array<int, ApplicationIntegrationLogListItemDTO>  $apiLogs
     * @param  array<int, ApplicationErrorLogListItemDTO>  $errorLogs
     */
    public function __construct(
        public string $activeTab,
        public array $apiLogs,
        public array $errorLogs,
    ) {}
}
