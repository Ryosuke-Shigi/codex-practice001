<?php

namespace App\Events\ApplicationLog;

use Carbon\CarbonInterface;
use Illuminate\Foundation\Events\Dispatchable;
use Throwable;

/**
 * アプリ内で ERROR ログとして確認すべき事実が発生したことを表す Event です。
 *
 * DB保存や通知などの副作用は持ちません。
 */
final class ApplicationErrorOccurred
{
    use Dispatchable;

    public readonly string $level;

    public readonly string $message;

    public readonly ?string $errorCode;

    public readonly ?string $exceptionClass;

    public readonly ?string $file;

    public readonly ?int $line;

    public readonly ?string $url;

    public readonly ?string $method;

    public readonly ?int $userId;

    public readonly CarbonInterface $occurredAt;

    /**
     * @param  Throwable|null  $exception  例外オブジェクトは保持せず、class / file / line だけを抽出します。
     */
    public function __construct(
        string $level,
        string $message,
        ?string $errorCode = null,
        ?Throwable $exception = null,
        ?string $file = null,
        ?int $line = null,
        ?string $url = null,
        ?string $method = null,
        ?int $userId = null,
        ?CarbonInterface $occurredAt = null,
    ) {
        $this->level = $level;
        $this->message = $message;
        $this->errorCode = $errorCode;
        // stack trace や例外インスタンス自体はログDBへ渡さない契約です。
        $this->exceptionClass = $exception === null ? null : $exception::class;
        $this->file = $file ?? $exception?->getFile();
        $this->line = $line ?? $exception?->getLine();
        $this->url = $url;
        $this->method = $method;
        $this->userId = $userId;
        $this->occurredAt = $occurredAt ?? now();
    }
}
