<?php

namespace App\Actions\ApiCatalog\Commands;

use App\DTO\ApiCatalog\Note\ApiCatalogNoteListItemDTO;
use App\DTO\ApiCatalog\Note\ApiCatalogNoteUpdateDTO;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogNoteRepositoryInterface;

/**
 * APIカタログの保存メモを更新する Command Action です。
 *
 * api_key と note id の組み合わせで対象を確定し、別APIのメモへ届かないようにします。
 * 入力形式は Request、DB更新は Repository に任せ、この Action は更新手順だけを持ちます。
 */
final readonly class UpdateApiCatalogNoteAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $cacheRepository,
        private ApiCatalogNoteRepositoryInterface $noteRepository,
    ) {}

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
