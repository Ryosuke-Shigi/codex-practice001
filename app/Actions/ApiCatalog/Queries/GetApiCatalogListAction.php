<?php

namespace App\Actions\ApiCatalog\Queries;

use App\DTO\ApiCatalog\List\ApiCatalogListItemDTO;
use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\DTO\ApiCatalog\List\ApiCatalogListResultDTO;
use App\Models\ApiCatalogCache;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;

final readonly class GetApiCatalogListAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $repository,
    ) {
    }

    public function execute(ApiCatalogListQueryDTO $query): ApiCatalogListResultDTO
    {
        $paginator = $this->repository->paginateActiveList($query);
        $providers = $this->repository->listActiveProviderKeys();

        /*
         * Action はユースケースの手順だけを扱います。
         * Inertia props の整形は Responder、DB 検索条件は Repository に閉じ込めます。
         */
        $items = array_map(
            fn (ApiCatalogCache $cache): ApiCatalogListItemDTO => ApiCatalogListItemDTO::fromModel($cache),
            $paginator->items(),
        );

        return new ApiCatalogListResultDTO(
            filters: [
                'keyword' => $query->keyword,
                'providerKey' => $query->providerKey,
            ],
            providers: $providers,
            items: $items,
            pagination: [
                'currentPage' => $paginator->currentPage(),
                'totalPages' => $paginator->lastPage(),
                'totalItems' => $paginator->total(),
                'perPage' => $paginator->perPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        );
    }
}
