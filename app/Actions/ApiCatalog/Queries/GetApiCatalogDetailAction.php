<?php

namespace App\Actions\ApiCatalog\Queries;

use App\DTO\ApiCatalog\Detail\ApiCatalogDetailDTO;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use App\Repositories\ApiCatalog\ApiCatalogNoteRepositoryInterface;

/**
 * APIカタログ詳細画面の表示データを取得する Query Action です。
 *
 * api_key で cache と保存メモを読み取り、DetailDTO へまとめます。
 * 詳細画面向けの配列化や戻り先URLの判断は Controller / Responder 側へ残します。
 */
final readonly class GetApiCatalogDetailAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $repository,
        private ApiCatalogNoteRepositoryInterface $noteRepository,
    ) {}

    public function execute(string $apiKey): ?ApiCatalogDetailDTO
    {
        /*
         * 詳細画面は api_catalog_cache と、そのAPIに紐づく saved_api_notes を読み取ります。
         * Query Action は取得手順だけをまとめ、表示配列への整形は DTO / Responder へ渡します。
         */
        $cache = $this->repository->findByApiKey($apiKey);

        if ($cache === null) {
            return null;
        }

        $notes = $this->noteRepository->listByApiCatalogCacheId((int) $cache->getKey());

        return ApiCatalogDetailDTO::fromModel($cache, $notes);
    }
}
