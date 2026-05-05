<?php

namespace App\DTO\ApiCatalog\List;

final readonly class ApiCatalogListResultDTO
{
    /**
     * Responder で Inertia props にそのまま分割できるよう、
     * filters / providers / domains / items / pagination を別々に保持します。
     *
     * @param  array{keyword: string|null, providerKey: string|null, domain: string|null, sortKey: string}  $filters
     * @param  array<int, string>  $providers
     * @param  array<int, string>  $domains
     * @param  array<int, ApiCatalogListItemDTO>  $items
     * @param  array{currentPage: int, totalPages: int, totalItems: int, perPage: int, from: int|null, to: int|null}  $pagination
     */
    public function __construct(
        public array $filters,
        public array $providers,
        public array $domains,
        public array $items,
        public array $pagination,
    ) {
    }

    /**
     * @return array{
     *     filters: array{keyword: string|null, providerKey: string|null, domain: string|null, sortKey: string},
     *     providers: array<int, string>,
     *     domains: array<int, string>,
     *     apiCatalogItems: array<int, array<string, mixed>>,
     *     pagination: array{currentPage: int, totalPages: int, totalItems: int, perPage: int, from: int|null, to: int|null}
     * }
     */
    public function toArray(): array
    {
        /*
         * providers/domains は将来の部分更新では毎回更新しない想定です。
         * 検索・ページ送り時の主更新対象は filters / apiCatalogItems / pagination にします。
         */
        return [
            'filters' => $this->filters,
            'providers' => $this->providers,
            'domains' => $this->domains,
            'apiCatalogItems' => array_map(
                fn (ApiCatalogListItemDTO $item): array => $item->toArray(),
                $this->items,
            ),
            'pagination' => $this->pagination,
        ];
    }
}
