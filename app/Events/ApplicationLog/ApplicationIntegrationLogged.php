<?php

namespace App\Events\ApplicationLog;

use Carbon\CarbonInterface;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * アプリ内で外部 API 連携結果が発生したことを表す Event です。
 *
 * request / response body の保存や DB 登録などの副作用は持ちません。
 */
final class ApplicationIntegrationLogged
{
    use Dispatchable;

    public readonly CarbonInterface $occurredAt;

    /**
     * @param  string|null  $message  API の request / response body ではなく、人が読む短い結果要約を渡します。
     */
    public function __construct(
        public readonly string $integrationType,
        public readonly ?string $serviceName,
        public readonly string $action,
        public readonly string $status,
        public readonly ?string $message = null,
        public readonly ?string $targetType = null,
        public readonly ?string $targetId = null,
        public readonly ?string $externalId = null,
        public readonly ?string $url = null,
        public readonly ?string $method = null,
        public readonly ?int $responseStatus = null,
        public readonly ?int $userId = null,
        ?CarbonInterface $occurredAt = null,
    ) {
        $this->occurredAt = $occurredAt ?? now();
    }
}
