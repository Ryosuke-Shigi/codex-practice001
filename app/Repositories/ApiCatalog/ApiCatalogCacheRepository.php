<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use App\Models\ApiCatalogCache;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

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
     * @return LengthAwarePaginator<int, ApiCatalogCache>
     */
    public function paginateActiveList(ApiCatalogListQueryDTO $query): LengthAwarePaginator
    {
        $builder = ApiCatalogCache::query()
            ->where('is_active', true);

        if ($query->keyword !== null) {
            $keyword = '%'.$query->keyword.'%';

            $builder->where(function ($searchBuilder) use ($keyword) {
                $searchBuilder
                    ->where('title', 'like', $keyword)
                    ->orWhere('description', 'like', $keyword)
                    ->orWhere('provider_key', 'like', $keyword)
                    ->orWhere('service_key', 'like', $keyword);
            });
        }

        if ($query->providerKey !== null) {
            $builder->where('provider_key', $query->providerKey);
        }

        $this->applyListSort($builder, $query->sortKey);

        return $builder
            ->paginate($query->perPage, ['*'], 'page', $query->page)
            ->withQueryString();
    }

    /**
     * @return array<int, string>
     */
    public function listActiveProviderKeys(): array
    {
        return ApiCatalogCache::query()
            ->where('is_active', true)
            ->whereNotNull('provider_key')
            ->distinct()
            ->orderBy('provider_key')
            ->pluck('provider_key')
            ->values()
            ->all();
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

    /**
     * @param  Builder<ApiCatalogCache>  $builder
     */
    private function applyListSort(Builder $builder, string $sortKey): void
    {
        /*
         * Repository は「取得順」というDB取得条件だけを担当します。
         * sortKey は DTO で許可済みに正規化済みなので、ここでは固定の orderBy へ写像します。
         */
        match ($sortKey) {
            ApiCatalogListQueryDTO::SORT_UPDATED_ASC => $builder
                ->orderByRaw('source_latest_updated_at IS NULL')
                ->orderBy('source_latest_updated_at')
                ->orderByRaw("COALESCE(NULLIF(title, ''), api_key)")
                ->orderBy('id'),
            ApiCatalogListQueryDTO::SORT_NAME_ASC => $builder
                ->orderByRaw("COALESCE(NULLIF(title, ''), api_key)")
                ->orderBy('id'),
            ApiCatalogListQueryDTO::SORT_NAME_DESC => $builder
                ->orderByRaw("COALESCE(NULLIF(title, ''), api_key) DESC")
                ->orderBy('id'),
            ApiCatalogListQueryDTO::SORT_UPDATED_DESC => $builder
                ->orderByRaw('source_latest_updated_at IS NULL')
                ->orderByDesc('source_latest_updated_at')
                ->orderByRaw("COALESCE(NULLIF(title, ''), api_key)")
                ->orderBy('id'),
            default => $builder
                ->orderByRaw('source_latest_updated_at IS NULL')
                ->orderByDesc('source_latest_updated_at')
                ->orderByRaw("COALESCE(NULLIF(title, ''), api_key)")
                ->orderBy('id'),
        };
    }
}
