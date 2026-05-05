<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Note\ApiCatalogNoteCreateDTO;
use App\DTO\ApiCatalog\Note\ApiCatalogNoteUpdateDTO;
use App\Models\ApiCatalogNote;

class ApiCatalogNoteRepository implements ApiCatalogNoteRepositoryInterface
{
    /**
     * @return array<int, ApiCatalogNote>
     */
    public function listByApiCatalogCacheId(int $apiCatalogCacheId): array
    {
        return ApiCatalogNote::query()
            ->where('api_catalog_cache_id', $apiCatalogCacheId)
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get()
            ->all();
    }

    public function create(int $apiCatalogCacheId, ApiCatalogNoteCreateDTO $dto): ApiCatalogNote
    {
        return ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $apiCatalogCacheId,
            'title' => $dto->title,
            'body' => $dto->body,
        ]);
    }

    public function update(ApiCatalogNote $note, ApiCatalogNoteUpdateDTO $dto): ApiCatalogNote
    {
        $note->fill([
            'title' => $dto->title,
            'body' => $dto->body,
        ]);
        $note->save();

        return $note->refresh();
    }

    public function delete(ApiCatalogNote $note): void
    {
        $note->delete();
    }

    public function findForApiCatalogCache(int $apiCatalogCacheId, int $noteId): ?ApiCatalogNote
    {
        /*
         * 更新・削除対象が詳細画面のAPIに属することをRepository境界で保証します。
         * Controller は note id を受け取るだけで、所有判定はここに閉じ込めます。
         */
        return ApiCatalogNote::query()
            ->where('api_catalog_cache_id', $apiCatalogCacheId)
            ->whereKey($noteId)
            ->first();
    }
}
