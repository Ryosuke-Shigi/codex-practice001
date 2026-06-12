<?php

namespace App\DTO\ApiCatalog\Detail;

use App\DTO\ApiCatalog\Note\ApiCatalogNoteListItemDTO;
use App\Models\ApiCatalogCache;
use App\Models\ApiCatalogNote;

final readonly class ApiCatalogDetailDTO
{
    /**
     * @param  array<int, ApiCatalogNoteListItemDTO>  $notes
     */
    public function __construct(
        public int $id,
        public string $apiKey,
        public string $title,
        public string $description,
        public string $providerKey,
        public ?string $serviceKey,
        public ?string $preferredVersion,
        public ?string $openapiVersion,
        public ?string $openapiJsonUrl,
        public ?string $openapiYamlUrl,
        public ?string $sourceLatestUpdatedAt,
        public bool $isActive,
        public array $notes,
    ) {}

    /**
     * @param  array<int, ApiCatalogNote>  $notes
     */
    public static function fromModel(ApiCatalogCache $cache, array $notes = []): self
    {
        /*
         * 詳細画面で使う表示用元データだけを Model から DTO に写します。
         * OpenAPI 本文、paths、schemas などの重い定義は今回の導線修正では読み込みません。
         */
        $title = $cache->title ?: $cache->api_key;

        return new self(
            id: (int) $cache->getKey(),
            apiKey: $cache->api_key,
            title: $title,
            description: $cache->description ?? '',
            providerKey: $cache->provider_key,
            serviceKey: $cache->service_key,
            preferredVersion: $cache->preferred_version,
            openapiVersion: $cache->openapi_version,
            openapiJsonUrl: $cache->openapi_json_url,
            openapiYamlUrl: $cache->openapi_yaml_url,
            sourceLatestUpdatedAt: $cache->source_latest_updated_at?->toDateString(),
            isActive: (bool) $cache->is_active,
            notes: array_map(
                fn (ApiCatalogNote $note): ApiCatalogNoteListItemDTO => ApiCatalogNoteListItemDTO::fromModel($note),
                $notes,
            ),
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
     *     openapiJsonUrl: string|null,
     *     openapiYamlUrl: string|null,
     *     sourceLatestUpdatedAt: string|null,
     *     isActive: bool,
     *     notes: array<int, array{id: int, title: string|null, body: string, createdAt: string|null, updatedAt: string|null}>
     * }
     */
    public function toArray(): array
    {
        /*
         * React 側では DB カラム名ではなく camelCase props として扱います。
         * 画面都合の名前変換はここに閉じ込め、Component に DB 境界を漏らしません。
         */
        return [
            'id' => $this->id,
            'apiKey' => $this->apiKey,
            'title' => $this->title,
            'description' => $this->description,
            'providerKey' => $this->providerKey,
            'serviceKey' => $this->serviceKey,
            'preferredVersion' => $this->preferredVersion,
            'openapiVersion' => $this->openapiVersion,
            'openapiJsonUrl' => $this->openapiJsonUrl,
            'openapiYamlUrl' => $this->openapiYamlUrl,
            'sourceLatestUpdatedAt' => $this->sourceLatestUpdatedAt,
            'isActive' => $this->isActive,
            'notes' => array_map(
                fn (ApiCatalogNoteListItemDTO $note): array => $note->toArray(),
                $this->notes,
            ),
        ];
    }
}
