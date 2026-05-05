<?php

namespace App\Actions\ApiCatalog\Queries;

use App\DTO\ApiCatalog\Detail\ApiCatalogDetailDTO;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;

final readonly class GetApiCatalogDetailAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $repository,
    ) {
    }

    public function execute(string $apiKey): ?ApiCatalogDetailDTO
    {
        /*
         * 詳細画面は api_catalog_cache の単一読み取りだけを行います。
         * Query Action は取得手順をまとめる層なので、表示配列への整形は DTO / Responder へ渡します。
         */
        $cache = $this->repository->findByApiKey($apiKey);

        if ($cache === null) {
            return null;
        }

        return ApiCatalogDetailDTO::fromModel($cache);
    }
}
