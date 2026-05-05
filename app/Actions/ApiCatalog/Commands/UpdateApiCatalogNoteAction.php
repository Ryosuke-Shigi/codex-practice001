<?php

namespace App\Actions\ApiCatalog\Commands;

use App\DTO\ApiCatalog\Note\ApiCatalogNoteListItemDTO;
use App\DTO\ApiCatalog\Note\ApiCatalogNoteUpdateDTO;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogNoteRepositoryInterface;

final readonly class UpdateApiCatalogNoteAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $cacheRepository,
        private ApiCatalogNoteRepositoryInterface $noteRepository,
    ) {
    }

    public function execute(
        string $apiKey,
        int $noteId,
        ApiCatalogNoteUpdateDTO $dto,
    ): ?ApiCatalogNoteListItemDTO {
        /*
         * note id だけでは更新せず、必ず api_key から引いた cache id とセットで対象を探します。
         * これにより別APIのメモをURL差し替えで更新できないようにします。
         */
        $cache = $this->cacheRepository->findByApiKey($apiKey);

        if ($cache === null) {
            return null;
        }

        $note = $this->noteRepository->findForApiCatalogCache((int) $cache->getKey(), $noteId);

        if ($note === null) {
            return null;
        }

        return ApiCatalogNoteListItemDTO::fromModel(
            $this->noteRepository->update($note, $dto),
        );
    }
}
