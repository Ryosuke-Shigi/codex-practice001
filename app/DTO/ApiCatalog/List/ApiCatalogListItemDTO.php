<?php

namespace App\DTO\ApiCatalog\List;

use App\Models\ApiCatalogCache;

final readonly class ApiCatalogListItemDTO
{
    public function __construct(
        public int $id,
        public string $apiKey,
        public string $title,
        public string $description,
        public string $providerKey,
        public ?string $serviceKey,
        public ?string $preferredVersion,
        public ?string $openapiVersion,
        public bool $isActive,
    ) {
    }

    public static function fromModel(ApiCatalogCache $cache): self
    {
        $title = $cache->title ?: $cache->api_key;

        /*
         * 一覧カードから詳細へ遷移するため、DB id とは別に api_key も props へ渡します。
         * id は React の listKey、api_key は詳細 route の識別子として使い分けます。
         */
        return new self(
            id: (int) $cache->getKey(),
            apiKey: $cache->api_key,
            title: $title,
            description: $cache->description ?? '',
            providerKey: $cache->provider_key,
            serviceKey: $cache->service_key,
            preferredVersion: $cache->preferred_version,
            openapiVersion: $cache->openapi_version,
            isActive: (bool) $cache->is_active,
        );
    }

    /**
     * @return array{
     *     id: int,
     *     apiKey: string,
     *     title: string,
     *     description: string,
     *     providerKey: string,
     *     serviceKey: string|null,
     *     preferredVersion: string|null,
     *     openapiVersion: string|null,
     *     isActive: bool
     * }
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'apiKey' => $this->apiKey,
            'title' => $this->title,
            'description' => $this->description,
            'providerKey' => $this->providerKey,
            'serviceKey' => $this->serviceKey,
            'preferredVersion' => $this->preferredVersion,
            'openapiVersion' => $this->openapiVersion,
            'isActive' => $this->isActive,
        ];
    }
}
