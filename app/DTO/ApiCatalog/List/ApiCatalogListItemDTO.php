<?php

namespace App\DTO\ApiCatalog\List;

use App\DTO\ApiCatalog\Note\ApiCatalogNoteListItemDTO;
use App\Models\ApiCatalogCache;
use App\Models\ApiCatalogNote;

final readonly class ApiCatalogListItemDTO
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
        public bool $isActive,
        public array $notes,
    ) {
    }

    public static function fromModel(ApiCatalogCache $cache): self
    {
        $title = $cache->title ?: $cache->api_key;
        /*
         * 一覧 DTO は「カードに表示する保存メモ」を運ぶだけで、ここから追加クエリは発行しません。
         * Repository がページング済みのAPIに対して eager load した notes だけを採用することで、
         * 検索結果件数やページングを壊さず、表示用の本文だけを安全に props へ載せます。
         */
        $notes = $cache->relationLoaded('notes')
            ? $cache->notes
                ->map(fn (ApiCatalogNote $note): ApiCatalogNoteListItemDTO => ApiCatalogNoteListItemDTO::fromModel($note))
                ->values()
                ->all()
            : [];

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
            notes: $notes,
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
     *     isActive: bool,
     *     notes: array<int, array{id: int, title: string|null, body: string, createdAt: string|null, updatedAt: string|null}>
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
            'notes' => array_map(
                fn (ApiCatalogNoteListItemDTO $note): array => $note->toArray(),
                $this->notes,
            ),
        ];
    }
}
