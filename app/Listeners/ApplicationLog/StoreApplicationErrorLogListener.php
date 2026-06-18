<?php

namespace App\Listeners\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationErrorLogCreateDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Repositories\ApplicationLog\ApplicationErrorLogRepositoryInterface;
use App\Services\ApplicationLog\ApplicationLogSanitizerService;

/**
 * ApplicationErrorOccurred を受け取り、Repository 経由で ERROR ログを保存する Listener です。
 */
final readonly class StoreApplicationErrorLogListener
{
    public function __construct(
        private ApplicationErrorLogRepositoryInterface $repository,
        private ApplicationLogSanitizerService $sanitizer,
    ) {}

    /**
     * Event 由来値は呼び出し元を信頼せず、DBへ渡す直前に必ず整形します。
     */
    public function handle(ApplicationErrorOccurred $event): void
    {
        $this->repository->create(new ApplicationErrorLogCreateDTO(
            level: $this->sanitizer->normalizeLevel($event->level),
            errorCode: $this->sanitizer->sanitizeMessage($event->errorCode, 120),
            message: $this->sanitizer->sanitizeRequiredMessage($event->message),
            exceptionClass: $this->sanitizer->sanitizeMessage($event->exceptionClass, 255),
            file: $this->sanitizer->sanitizeFile($event->file),
            line: $event->line,
            url: $this->sanitizer->sanitizeUrl($event->url),
            method: $this->sanitizer->normalizeMethod($event->method),
            userId: $event->userId,
            occurredAt: $event->occurredAt,
        ));
    }
}
