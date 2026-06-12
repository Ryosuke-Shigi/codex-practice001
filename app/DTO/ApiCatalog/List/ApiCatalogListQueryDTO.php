<?php

namespace App\DTO\ApiCatalog\List;

final readonly class ApiCatalogListQueryDTO
{
    public const SORT_UPDATED_DESC = 'updated_desc';

    public const SORT_UPDATED_ASC = 'updated_asc';

    public const SORT_NAME_ASC = 'name_asc';

    public const SORT_NAME_DESC = 'name_desc';

    /*
     * 一覧検索の入力条件だけを運ぶ DTO です。
     * Controller から Repository へ Request を直接渡さないための境界にしています。
     */
    public function __construct(
        public ?string $keyword,
        public ?string $providerKey,
        public ?string $domain,
        public string $sortKey,
        public int $page,
        public int $perPage,
    ) {}
}
