<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use App\Models\ApiCatalogCache;
use Carbon\CarbonInterface;

class ApiCatalogCacheRepository implements ApiCatalogCacheRepositoryInterface
{
    public function findByApiKey(string $apiKey): ?ApiCatalogCache
    {
        return ApiCatalogCache::query()
            ->where('api_key', $apiKey)
            ->first();
    }

    public function insert(ApiCatalogItemDTO $item, CarbonInterface $syncedAt): ApiCatalogCache
    {
        return ApiCatalogCache::query()->create($this->attributesFromItem($item, $syncedAt));
    }

    public function update(ApiCatalogCache $cache, ApiCatalogItemDTO $item, CarbonInterface $syncedAt): ApiCatalogCache
    {
        $cache->fill($this->attributesFromItem($item, $syncedAt));
        $cache->save();

        return $cache->refresh();
    }

    /**
     * @param  array<int, string>  $activeApiKeys
     */
    public function markMissingAsInactive(array $activeApiKeys, CarbonInterface $syncedAt): int
    {
        if ($activeApiKeys === []) {
            return 0;
        }

        return ApiCatalogCache::query()
            ->where('is_active', true)
            ->whereNotIn('api_key', array_values(array_unique($activeApiKeys)))
            ->update([
                'is_active' => false,
                'synced_at' => $syncedAt->toDateTimeString(),
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesFromItem(ApiCatalogItemDTO $item, CarbonInterface $syncedAt): array
    {
        return [
            'api_key' => $item->apiKey,
            'provider_key' => $item->providerKey,
            'service_key' => $item->serviceKey,
            'title' => $item->title,
            'description' => $item->description,
            'preferred_version' => $item->preferredVersion,
            'openapi_json_url' => $item->openapiJsonUrl,
            'openapi_yaml_url' => $item->openapiYamlUrl,
            'openapi_version' => $item->openapiVersion,
            'source_latest_updated_at' => $item->sourceLatestUpdatedAt?->toDateTimeString(),
            'payload_hash' => $item->payloadHash,
            'is_active' => true,
            'synced_at' => $syncedAt->toDateTimeString(),
        ];
    }
}
