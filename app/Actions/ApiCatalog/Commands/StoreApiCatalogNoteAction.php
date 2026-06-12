<?php

namespace App\Actions\ApiCatalog\Commands;

use App\DTO\ApiCatalog\Note\ApiCatalogNoteCreateDTO;
use App\DTO\ApiCatalog\Note\ApiCatalogNoteListItemDTO;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogNoteRepositoryInterface;

final readonly class StoreApiCatalogNoteAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $cacheRepository,
        private ApiCatalogNoteRepositoryInterface $noteRepository,
    ) {}

    public function execute(string $apiKey, ApiCatalogNoteCreateDTO $dto): ?ApiCatalogNoteListItemDTO
    {
        /*
         * Action は「api_key から対象APIを特定し、そのAPIにメモを追加する」手順だけを担当します。
         * 保存そのものは saved_api_notes 専用Repositoryへ渡します。
         */
        $cache = $this->cacheRepository->findByApiKey($apiKey);

        if ($cache === null) {
            return null;
        }

        $note = $this->noteRepository->create((int) $cache->getKey(), $dto);

        return ApiCatalogNoteListItemDTO::fromModel($note);
    }
}
