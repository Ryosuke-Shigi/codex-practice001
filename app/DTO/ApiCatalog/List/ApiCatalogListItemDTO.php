<?php

namespace App\DTO\ApiCatalog\List;

use App\Models\ApiCatalogCache;

final readonly class ApiCatalogListItemDTO
{
    public function __construct(
        public int $id,
        public string $title,
        public string $description,
        public string $providerKey,
        public ?string $serviceKey,
        public ?string $preferredVersion,
        public ?string $openapiVersion,
        public bool $isActive,
        public string $googleSearchUrl,
    ) {
    }

    public static function fromModel(ApiCatalogCache $cache): self
    {
        $title = $cache->title ?: $cache->api_key;

        return new self(
            id: (int) $cache->getKey(),
            title: $title,
            description: $cache->description ?? '',
            providerKey: $cache->provider_key,
            serviceKey: $cache->service_key,
            preferredVersion: $cache->preferred_version,
            openapiVersion: $cache->openapi_version,
            isActive: (bool) $cache->is_active,
            googleSearchUrl: self::buildGoogleSearchUrl($title, $cache->api_key),
        );
    }

    /**
     * @return array{
     *     id: int,
     *     title: string,
     *     description: string,
     *     providerKey: string,
     *     serviceKey: string|null,
     *     preferredVersion: string|null,
     *     openapiVersion: string|null,
     *     isActive: bool,
     *     googleSearchUrl: string
     * }
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'providerKey' => $this->providerKey,
            'serviceKey' => $this->serviceKey,
            'preferredVersion' => $this->preferredVersion,
            'openapiVersion' => $this->openapiVersion,
            'isActive' => $this->isActive,
            'googleSearchUrl' => $this->googleSearchUrl,
        ];
    }

    private static function buildGoogleSearchUrl(string $title, string $apiKey): string
    {
        /*
         * Google検索URLは api_catalog_cache に保存しません。
         * 本番詳細でも Model accessor ではなく、表示用 DTO / Responder 境界で生成する想定です。
         */
        $searchTarget = trim($title) !== '' ? $title : $apiKey;

        return 'https://www.google.com/search?q='.rawurlencode($searchTarget.' API');
    }
}
