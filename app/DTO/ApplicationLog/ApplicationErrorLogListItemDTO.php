<?php

namespace App\DTO\ApplicationLog;

use Carbon\CarbonInterface;

/**
 * ERROR ログ一覧の1行分を表す DTO です。
 */
final readonly class ApplicationErrorLogListItemDTO
{
    public function __construct(
        public int $id,
        public CarbonInterface $occurredAt,
        public string $level,
        public string $message,
        public ?string $exceptionClass,
        public ?string $file,
        public ?int $line,
        public bool $isResolved,
    ) {}
}
