<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Note\ApiCatalogNoteCreateDTO;
use App\DTO\ApiCatalog\Note\ApiCatalogNoteUpdateDTO;
use App\Models\ApiCatalogNote;

interface ApiCatalogNoteRepositoryInterface
{
    /**
     * @return array<int, ApiCatalogNote>
     */
    public function listByApiCatalogCacheId(int $apiCatalogCacheId): array;

    public function create(int $apiCatalogCacheId, ApiCatalogNoteCreateDTO $dto): ApiCatalogNote;

    public function update(ApiCatalogNote $note, ApiCatalogNoteUpdateDTO $dto): ApiCatalogNote;

    public function delete(ApiCatalogNote $note): void;

    public function findForApiCatalogCache(int $apiCatalogCacheId, int $noteId): ?ApiCatalogNote;
}
