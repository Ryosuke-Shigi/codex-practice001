<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use App\Models\ApiCatalogCache;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ApiCatalogCacheRepositoryInterface
{
    // 同期処理が既に使っている単一取得です。本番一覧追加では責務を変えません。
    public function findByApiKey(string $apiKey): ?ApiCatalogCache;

    // APIカタログ同期の保存処理です。一覧表示側からは呼びません。
    public function insert(ApiCatalogItemDTO $item, CarbonInterface $syncedAt): ApiCatalogCache;

    // APIカタログ同期の更新処理です。一覧表示側からは呼びません。
    public function update(ApiCatalogCache $cache, ApiCatalogItemDTO $item, CarbonInterface $syncedAt): ApiCatalogCache;

    /**
     * APIカタログ同期で消えたAPIを非アクティブ扱いにする処理です。
     *
     * @param  array<int, string>  $activeApiKeys
     */
    public function markMissingAsInactive(array $activeApiKeys, CarbonInterface $syncedAt): int;

    /**
     * 本番一覧画面用の読み取り専用ページネーションです。
     *
     * @return LengthAwarePaginator<int, ApiCatalogCache>
     */
    public function paginateActiveList(ApiCatalogListQueryDTO $query): LengthAwarePaginator;

    /**
     * 本番一覧画面の provider 絞り込み候補です。
     *
     * @return array<int, string>
     */
    public function listActiveProviderKeys(): array;
}
