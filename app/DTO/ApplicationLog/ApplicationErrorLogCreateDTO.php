<?php

namespace App\DTO\ApplicationLog;

use Carbon\CarbonInterface;

/**
 * ERROR ログ保存用の入力 DTO です。
 *
 * 保存してよい最小限の項目だけを持ち、stack trace や request payload は受け取りません。
 */
final readonly class ApplicationErrorLogCreateDTO
{
    public function __construct(
        public string $level,
        public ?string $errorCode,
        public string $message,
        public ?string $exceptionClass,
        public ?string $file,
        public ?int $line,
        public ?string $url,
        public ?string $method,
        public ?int $userId,
        public CarbonInterface $occurredAt,
    ) {}

    /**
     * @return array{
     *     level: string,
     *     error_code: string|null,
     *     message: string,
     *     exception_class: string|null,
     *     file: string|null,
     *     line: int|null,
     *     url: string|null,
     *     method: string|null,
     *     user_id: int|null,
     *     occurred_at: string
     * }
     */
    public function toArray(): array
    {
        return [
            'level' => $this->level,
            'error_code' => $this->errorCode,
            'message' => $this->message,
            'exception_class' => $this->exceptionClass,
            'file' => $this->file,
            'line' => $this->line,
            'url' => $this->url,
            'method' => $this->method,
            'user_id' => $this->userId,
            'occurred_at' => $this->occurredAt->toDateTimeString(),
        ];
    }
}
