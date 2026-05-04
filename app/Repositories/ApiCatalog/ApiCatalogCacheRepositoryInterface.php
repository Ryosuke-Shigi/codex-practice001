<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use App\Models\ApiCatalogCache;
use Carbon\CarbonInterface;

interface ApiCatalogCacheRepositoryInterface
{
    public function findByApiKey(string $apiKey): ?ApiCatalogCache;

    public function insert(ApiCatalogItemDTO $item, CarbonInterface $syncedAt): ApiCatalogCache;

    public function update(ApiCatalogCache $cache, ApiCatalogItemDTO $item, CarbonInterface $syncedAt): ApiCatalogCache;

    /**
     * @param  array<int, string>  $activeApiKeys
     */
    public function markMissingAsInactive(array $activeApiKeys, CarbonInterface $syncedAt): int;
}
