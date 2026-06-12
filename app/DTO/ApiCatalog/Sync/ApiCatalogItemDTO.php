<?php

namespace App\DTO\ApiCatalog\Sync;

use Carbon\CarbonImmutable;

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
