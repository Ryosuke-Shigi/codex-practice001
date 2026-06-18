<?php

namespace App\Listeners\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationIntegrationLogCreateDTO;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use App\Repositories\ApplicationLog\ApplicationIntegrationLogRepositoryInterface;
use App\Services\ApplicationLog\ApplicationLogSanitizerService;

/**
 * ApplicationIntegrationLogged を受け取り、Repository 経由で API 連携ログを保存する Listener です。
 */
final readonly class StoreApplicationIntegrationLogListener
{
    public function __construct(
        private ApplicationIntegrationLogRepositoryInterface $repository,
        private ApplicationLogSanitizerService $sanitizer,
    ) {}

    /**
     * API 連携ログは結果確認用の要約だけを保存し、payload 保存の入口にはしません。
     */
    public function handle(ApplicationIntegrationLogged $event): void
    {
        $this->repository->create(new ApplicationIntegrationLogCreateDTO(
            integrationType: $this->sanitizer->sanitizeRequiredMessage($event->integrationType, 80),
            serviceName: $this->sanitizer->sanitizeMessage($event->serviceName, 255),
            action: $this->sanitizer->sanitizeRequiredMessage($event->action, 255),
            status: $this->sanitizer->normalizeStatus($event->status),
            message: $this->sanitizer->sanitizeMessage($event->message),
            targetType: $this->sanitizer->sanitizeMessage($event->targetType, 255),
            targetId: $this->sanitizer->sanitizeMessage($event->targetId, 255),
            externalId: $this->sanitizer->sanitizeMessage($event->externalId, 255),
            url: $this->sanitizer->sanitizeUrl($event->url),
            method: $this->sanitizer->normalizeMethod($event->method),
            responseStatus: $event->responseStatus,
            userId: $event->userId,
            occurredAt: $event->occurredAt,
        ));
    }
}
