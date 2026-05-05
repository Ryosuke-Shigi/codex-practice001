<?php

namespace App\Actions\ApiCatalog\Queries;

use App\DTO\ApiCatalog\List\ApiCatalogListItemDTO;
use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\DTO\ApiCatalog\List\ApiCatalogListResultDTO;
use App\Models\ApiCatalogCache;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final readonly class GetApiCatalogListAction
{
    public function __construct(
        private ApiCatalogCacheRepositoryInterface $repository,
    ) {
    }

    public function execute(ApiCatalogListQueryDTO $query): ApiCatalogListResultDTO
    {
        /*
         * Repository では keyword / provider_key を先に適用してから paginate します。
         * そのため total / lastPage は全API件数ではなく、検索結果件数を基準にした値になります。
         */
        $paginator = $this->repository->paginateActiveList($query);
        $paginator = $this->resolveExistingPage($query, $paginator);
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

    /**
     * @param  LengthAwarePaginator<int, ApiCatalogCache>  $paginator
     * @return LengthAwarePaginator<int, ApiCatalogCache>
     */
    private function resolveExistingPage(
        ApiCatalogListQueryDTO $query,
        LengthAwarePaginator $paginator,
    ): LengthAwarePaginator
    {
        $lastPage = max(1, $paginator->lastPage());

        /*
         * Laravel paginator は範囲外 page を指定されても空の現在ページを返せます。
         * UI へそのまま渡すと「検索結果は少ないのに 999 ページ目」のような表示になるため、
         * Action 境界で存在するページだけに丸めます。
         */
        if ($paginator->currentPage() <= $lastPage) {
            return $paginator;
        }

        /*
         * 検索条件を変えた後や直URLで page が大きすぎる場合でも、
         * 存在しないページ番号を画面へ返さないよう、絞り込み後の最終ページで再取得します。
         */
        return $this->repository->paginateActiveList(
            new ApiCatalogListQueryDTO(
                keyword: $query->keyword,
                providerKey: $query->providerKey,
                page: $lastPage,
                perPage: $query->perPage,
            ),
        );
    }
}
