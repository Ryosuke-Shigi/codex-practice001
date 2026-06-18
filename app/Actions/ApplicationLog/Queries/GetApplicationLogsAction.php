<?php

namespace App\Actions\ApplicationLog\Queries;

use App\DTO\ApplicationLog\ApplicationErrorLogListItemDTO;
use App\DTO\ApplicationLog\ApplicationIntegrationLogListItemDTO;
use App\DTO\ApplicationLog\ApplicationLogIndexInputDTO;
use App\DTO\ApplicationLog\ApplicationLogsPageDTO;
use App\Models\ApplicationErrorLog;
use App\Models\ApplicationIntegrationLog;
use App\Repositories\ApplicationLog\ApplicationErrorLogRepositoryInterface;
use App\Repositories\ApplicationLog\ApplicationIntegrationLogRepositoryInterface;

/**
 * Project Hub の logs 表示に必要な API / ERROR ログを取得する Query Action です。
 */
final readonly class GetApplicationLogsAction
{
    public function __construct(
        private ApplicationIntegrationLogRepositoryInterface $integrationLogRepository,
        private ApplicationErrorLogRepositoryInterface $errorLogRepository,
    ) {}

    /**
     * API / ERROR を同じ画面用 DTO にまとめます。
     *
     * 表示文言の連結は Responder に残し、ここでは DB モデルを一覧行 DTO へ移すだけにします。
     */
    public function execute(ApplicationLogIndexInputDTO $input): ApplicationLogsPageDTO
    {
        return new ApplicationLogsPageDTO(
            activeTab: $input->activeTab,
            apiLogs: $this->integrationLogRepository
                ->latest($input->limit)
                ->map(fn (ApplicationIntegrationLog $log): ApplicationIntegrationLogListItemDTO => new ApplicationIntegrationLogListItemDTO(
                    id: (int) $log->getKey(),
                    occurredAt: $log->occurred_at ?? $log->created_at ?? now(),
                    status: (string) $log->status,
                    serviceName: $log->service_name,
                    action: (string) $log->action,
                    message: $log->message,
                    responseStatus: $log->response_status,
                ))
                ->all(),
            errorLogs: $this->errorLogRepository
                ->latest($input->limit)
                ->map(fn (ApplicationErrorLog $log): ApplicationErrorLogListItemDTO => new ApplicationErrorLogListItemDTO(
                    id: (int) $log->getKey(),
                    occurredAt: $log->occurred_at ?? $log->created_at ?? now(),
                    level: (string) $log->level,
                    message: (string) $log->message,
                    exceptionClass: $log->exception_class,
                    file: $log->file,
                    line: $log->line,
                    isResolved: $log->resolved_at !== null,
                ))
                ->all(),
        );
    }
}
