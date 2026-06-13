<?php

namespace App\DTO\ApiCatalog\Sync;

use Carbon\CarbonImmutable;

/**
 * APIs.guru から取得した1件分のカタログ同期データを運ぶ DTO です。
 *
 * Repository / Service 間のデータ境界であり、payloadHash による差分判断の材料だけを保持します。
 * DB保存や Inertia props 生成は持たせません。
 */
final readonly class ApiCatalogItemDTO
{
    public function __construct(
        public string $apiKey,
        public string $providerKey,
        public ?string $serviceKey,
        public ?string $title,
        public ?string $description,
        public ?string $preferredVersion,
        public ?string $openapiJsonUrl,
        public ?string $openapiYamlUrl,
        public ?string $openapiVersion,
        public ?CarbonImmutable $sourceLatestUpdatedAt,
        public string $payloadHash,
    ) {}
}
