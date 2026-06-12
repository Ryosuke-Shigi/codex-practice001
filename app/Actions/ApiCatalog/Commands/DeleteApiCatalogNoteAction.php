<?php

namespace App\Actions\ApiCatalog\Commands;

use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogNoteRepositoryInterface;

final readonly class DeleteApiCatalogNoteAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $cacheRepository,
        private ApiCatalogNoteRepositoryInterface $noteRepository,
    ) {}

    public function execute(string $apiKey, int $noteId): bool
    {
        /*
         * 削除も更新と同じく、対象APIに属する note だけを削除対象にします。
         * Model の SoftDeletes により deleted_at が入ります。
         */
        $cache = $this->cacheRepository->findByApiKey($apiKey);

        if ($cache === null) {
            return false;
        }

        $note = $this->noteRepository->findForApiCatalogCache((int) $cache->getKey(), $noteId);

        if ($note === null) {
            return false;
        }

        $this->noteRepository->delete($note);

        return true;
    }
}
