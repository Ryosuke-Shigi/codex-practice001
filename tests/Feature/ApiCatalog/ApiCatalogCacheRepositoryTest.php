<?php

namespace Tests\Feature\ApiCatalog;

use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogItemDTO;
use App\Models\ApiCatalogCache;
use App\Models\ApiCatalogNote;
use App\Repositories\ApiCatalog\ApiCatalogCacheRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiCatalogCacheRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_insert_and_update_persist_sync_item_values_and_reactivate_cache(): void
    {
        /*
         * 同期Serviceは insert/update/skip の判断まで、Repository はDB反映だけを担当します。
         * ここでは ApiCatalogItemDTO から api_catalog_cache の保存値へ正しく写ることを確認します。
         */
        $repository = $this->repository();
        $syncedAt = CarbonImmutable::parse('2026-05-23 12:34:56', 'UTC');
        $sourceLatestUpdatedAt = CarbonImmutable::parse('2026-05-20 01:02:03', 'UTC');

        $inserted = $repository->insert($this->item(
            apiKey: 'github.com:rest',
            providerKey: 'github.com',
            serviceKey: 'rest',
            title: 'GitHub REST API',
            payloadHash: 'insert-payload-hash',
            sourceLatestUpdatedAt: $sourceLatestUpdatedAt,
        ), $syncedAt);

        $this->assertDatabaseHas('api_catalog_cache', [
            'id' => $inserted->getKey(),
            'api_key' => 'github.com:rest',
            'provider_key' => 'github.com',
            'service_key' => 'rest',
            'title' => 'GitHub REST API',
            'description' => 'Catalog description.',
            'preferred_version' => 'v1',
            'openapi_json_url' => 'https://example.test/openapi.json',
            'openapi_yaml_url' => 'https://example.test/openapi.yaml',
            'openapi_version' => '3.0.0',
            'source_latest_updated_at' => '2026-05-20 01:02:03',
            'payload_hash' => 'insert-payload-hash',
            'is_active' => true,
            'synced_at' => '2026-05-23 12:34:56',
        ]);

        $inserted->forceFill(['is_active' => false])->save();

        $updated = $repository->update($inserted, $this->item(
            apiKey: 'github.com:rest',
            providerKey: 'github.com',
            serviceKey: 'rest',
            title: 'GitHub REST API Updated',
            payloadHash: 'updated-payload-hash',
            sourceLatestUpdatedAt: CarbonImmutable::parse('2026-05-21 02:03:04', 'UTC'),
        ), CarbonImmutable::parse('2026-05-24 00:00:01', 'UTC'));

        $this->assertTrue($updated->is_active);
        $this->assertDatabaseHas('api_catalog_cache', [
            'id' => $inserted->getKey(),
            'title' => 'GitHub REST API Updated',
            'source_latest_updated_at' => '2026-05-21 02:03:04',
            'payload_hash' => 'updated-payload-hash',
            'is_active' => true,
            'synced_at' => '2026-05-24 00:00:01',
        ]);
        $this->assertDatabaseCount('api_catalog_cache', 1);
    }

    public function test_mark_missing_as_inactive_only_updates_active_rows_absent_from_current_feed(): void
    {
        /*
         * 非アクティブ化は「今回のAPIs.guru listに存在しない既存active行」だけに限定します。
         * 既に inactive の行や今回も存在する行は、同期時刻も含めて更新対象にしません。
         */
        $this->createApiCatalogCache([
            'api_key' => 'keep.example.test',
            'is_active' => true,
            'synced_at' => '2026-05-01 00:00:00',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'missing.example.test',
            'is_active' => true,
            'synced_at' => '2026-05-01 00:00:00',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'already-inactive.example.test',
            'is_active' => false,
            'synced_at' => '2026-05-01 00:00:00',
        ]);

        $updatedCount = $this->repository()->markMissingAsInactive(
            ['keep.example.test', 'keep.example.test'],
            CarbonImmutable::parse('2026-05-24 10:00:00', 'UTC'),
        );

        $this->assertSame(1, $updatedCount);
        $this->assertDatabaseHas('api_catalog_cache', [
            'api_key' => 'keep.example.test',
            'is_active' => true,
            'synced_at' => '2026-05-01 00:00:00',
        ]);
        $this->assertDatabaseHas('api_catalog_cache', [
            'api_key' => 'missing.example.test',
            'is_active' => false,
            'synced_at' => '2026-05-24 10:00:00',
        ]);
        $this->assertDatabaseHas('api_catalog_cache', [
            'api_key' => 'already-inactive.example.test',
            'is_active' => false,
            'synced_at' => '2026-05-01 00:00:00',
        ]);
    }

    public function test_mark_missing_as_inactive_does_not_touch_rows_when_current_feed_is_empty(): void
    {
        $this->createApiCatalogCache([
            'api_key' => 'active.example.test',
            'is_active' => true,
            'synced_at' => '2026-05-01 00:00:00',
        ]);

        $updatedCount = $this->repository()->markMissingAsInactive(
            [],
            CarbonImmutable::parse('2026-05-24 10:00:00', 'UTC'),
        );

        $this->assertSame(0, $updatedCount);
        $this->assertDatabaseHas('api_catalog_cache', [
            'api_key' => 'active.example.test',
            'is_active' => true,
            'synced_at' => '2026-05-01 00:00:00',
        ]);
    }

    public function test_paginate_active_list_keyword_matches_catalog_fields_and_saved_note_body(): void
    {
        /*
         * Repository は「DBからどの行を取得するか」だけを担当します。
         * keyword の対象カラムをここで固定し、Action / Responder / React 側が
         * 検索対象の判断を持たなくて済むようにします。
         */
        $this->createApiCatalogCache([
            'api_key' => 'title-match.example.test',
            'title' => 'TitleNeedle API',
            'provider_key' => 'title-provider.example.test',
            'service_key' => 'title-service',
            'description' => 'Plain description',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'description-match.example.test',
            'title' => 'Description Target API',
            'provider_key' => 'description-provider.example.test',
            'service_key' => 'description-service',
            'description' => 'DescriptionNeedle is present here.',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'provider-match.example.test',
            'title' => 'Provider Target API',
            'provider_key' => 'ProviderNeedle.example.test',
            'service_key' => 'provider-service',
            'description' => 'Plain description',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'service-match.example.test',
            'title' => 'Service Target API',
            'provider_key' => 'service-provider.example.test',
            'service_key' => 'ServiceNeedle',
            'description' => 'Plain description',
        ]);
        $noteMatchedCache = $this->createApiCatalogCache([
            'api_key' => 'note-match.example.test',
            'title' => 'Note Target API',
            'provider_key' => 'note-provider.example.test',
            'service_key' => 'note-service',
            'description' => 'Plain description',
        ]);
        ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $noteMatchedCache->getKey(),
            'title' => 'Saved memo',
            'body' => 'MemoNeedle exists only in the saved note body.',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'noise.example.test',
            'title' => 'Noise API',
            'provider_key' => 'noise-provider.example.test',
            'service_key' => 'noise-service',
            'description' => 'Plain description',
        ]);

        $cases = [
            'title' => ['TitleNeedle', ['title-match.example.test']],
            'description' => ['DescriptionNeedle', ['description-match.example.test']],
            'provider_key' => ['ProviderNeedle', ['provider-match.example.test']],
            'service_key' => ['ServiceNeedle', ['service-match.example.test']],
            'saved_api_notes.body' => ['MemoNeedle', ['note-match.example.test']],
        ];

        /*
         * saved_api_notes.body は whereHas の対象なので、API本体フィールドに一致しなくても
         * 保存メモ本文だけで一覧に出ることを確認します。JOINではなく whereHas の仕様として、
         * 一致したメモ件数ぶんAPI行が重複しないことも total=1 で押さえます。
         */
        foreach ($cases as [$keyword, $expectedApiKeys]) {
            $paginator = $this->repository()->paginateActiveList($this->query(keyword: $keyword));

            $this->assertSame($expectedApiKeys, $this->apiKeys($paginator->items()));
            $this->assertSame(1, $paginator->total());
        }
    }

    public function test_paginate_active_list_domain_matches_provider_key_suffix(): void
    {
        /*
         * domain は api_catalog_cache の物理カラムではありません。
         * 画面上の domain 絞り込みは provider_key の末尾一致として Repository のDB条件に閉じます。
         */
        $this->createApiCatalogCache([
            'api_key' => 'github.com:rest',
            'title' => 'GitHub API',
            'provider_key' => 'github.com',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'stripe.com:rest',
            'title' => 'Stripe API',
            'provider_key' => 'stripe.com',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'shopify.dev:rest',
            'title' => 'Shopify API',
            'provider_key' => 'shopify.dev',
        ]);

        $paginator = $this->repository()->paginateActiveList($this->query(
            domain: 'com',
            sortKey: ApiCatalogListQueryDTO::SORT_NAME_ASC,
        ));

        $this->assertSame(['github.com:rest', 'stripe.com:rest'], $this->apiKeys($paginator->items()));
        $this->assertSame(2, $paginator->total());
    }

    public function test_paginate_active_list_provider_key_filter_uses_exact_match(): void
    {
        /*
         * provider_key フィルタは domain と違い、完全一致の絞り込みです。
         * github.com を指定したときに api.github.com まで含める判断はしない、という仕様を固定します。
         */
        $this->createApiCatalogCache([
            'api_key' => 'github.com:rest',
            'title' => 'GitHub API',
            'provider_key' => 'github.com',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'api.github.com:rest',
            'title' => 'GitHub API Host',
            'provider_key' => 'api.github.com',
        ]);

        $paginator = $this->repository()->paginateActiveList($this->query(providerKey: 'github.com'));

        $this->assertSame(['github.com:rest'], $this->apiKeys($paginator->items()));
        $this->assertSame(1, $paginator->total());
    }

    public function test_paginate_active_list_excludes_inactive_apis(): void
    {
        /*
         * API同期で消えたカタログは is_active=false として残りますが、一覧には出しません。
         * 非アクティブ判定をModelやActionへ寄せず、一覧Repositoryの取得条件として固定します。
         */
        $this->createApiCatalogCache([
            'api_key' => 'active.example.test',
            'title' => 'Active API',
            'provider_key' => 'active.example.test',
            'is_active' => true,
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'inactive.example.test',
            'title' => 'Inactive API',
            'provider_key' => 'inactive.example.test',
            'is_active' => false,
        ]);

        $paginator = $this->repository()->paginateActiveList($this->query(sortKey: ApiCatalogListQueryDTO::SORT_NAME_ASC));

        $this->assertSame(['active.example.test'], $this->apiKeys($paginator->items()));
        $this->assertSame(1, $paginator->total());
    }

    public function test_paginate_active_list_sorts_by_updated_at_and_keeps_null_dates_last(): void
    {
        /*
         * updated_* sort は source_latest_updated_at を主キーにしつつ、
         * null の行を昇順/降順どちらでも後ろへ回す既存仕様を守ります。
         * 同日・同値時の補助順は Repository 実装の COALESCE(title, api_key) に任せます。
         */
        $this->createApiCatalogCache([
            'api_key' => 'old-zulu.example.test',
            'title' => 'Zulu API',
            'source_latest_updated_at' => '2026-05-01 00:00:00',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'new-alpha.example.test',
            'title' => 'Alpha API',
            'source_latest_updated_at' => '2026-05-03 00:00:00',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'middle-fallback.example.test',
            'title' => null,
            'source_latest_updated_at' => '2026-05-02 00:00:00',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'null-beta.example.test',
            'title' => 'Beta API',
            'source_latest_updated_at' => null,
        ]);

        $updatedDesc = $this->repository()->paginateActiveList($this->query(
            sortKey: ApiCatalogListQueryDTO::SORT_UPDATED_DESC,
            perPage: 10,
        ));
        $updatedAsc = $this->repository()->paginateActiveList($this->query(
            sortKey: ApiCatalogListQueryDTO::SORT_UPDATED_ASC,
            perPage: 10,
        ));

        $this->assertSame([
            'new-alpha.example.test',
            'middle-fallback.example.test',
            'old-zulu.example.test',
            'null-beta.example.test',
        ], $this->apiKeys($updatedDesc->items()));
        $this->assertSame([
            'old-zulu.example.test',
            'middle-fallback.example.test',
            'new-alpha.example.test',
            'null-beta.example.test',
        ], $this->apiKeys($updatedAsc->items()));
    }

    public function test_paginate_active_list_sorts_by_title_or_api_key_fallback(): void
    {
        /*
         * name_* sort は画面表示名に近い title を優先し、title が空の場合だけ api_key を使います。
         * DTO / Component 側で並び替え直すのではなく、Repository のDB取得順として固定します。
         */
        $this->createApiCatalogCache([
            'api_key' => 'old-zulu.example.test',
            'title' => 'zulu api',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'new-alpha.example.test',
            'title' => 'alpha api',
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'middle-fallback.example.test',
            'title' => null,
        ]);
        $this->createApiCatalogCache([
            'api_key' => 'null-beta.example.test',
            'title' => 'beta api',
        ]);

        $nameAsc = $this->repository()->paginateActiveList($this->query(
            sortKey: ApiCatalogListQueryDTO::SORT_NAME_ASC,
            perPage: 10,
        ));
        $nameDesc = $this->repository()->paginateActiveList($this->query(
            sortKey: ApiCatalogListQueryDTO::SORT_NAME_DESC,
            perPage: 10,
        ));

        $this->assertSame([
            'new-alpha.example.test',
            'null-beta.example.test',
            'middle-fallback.example.test',
            'old-zulu.example.test',
        ], $this->apiKeys($nameAsc->items()));
        $this->assertSame([
            'old-zulu.example.test',
            'middle-fallback.example.test',
            'null-beta.example.test',
            'new-alpha.example.test',
        ], $this->apiKeys($nameDesc->items()));
    }

    private function repository(): ApiCatalogCacheRepositoryInterface
    {
        return app(ApiCatalogCacheRepositoryInterface::class);
    }

    private function query(
        ?string $keyword = null,
        ?string $providerKey = null,
        ?string $domain = null,
        string $sortKey = ApiCatalogListQueryDTO::SORT_UPDATED_DESC,
        int $page = 1,
        int $perPage = 6,
    ): ApiCatalogListQueryDTO {
        /*
         * Repository テストでは Request 正規化ではなく DB 条件そのものを見たいので、
         * ApiCatalogListQueryDTO を直接組み立てます。
         */
        return new ApiCatalogListQueryDTO(
            keyword: $keyword,
            providerKey: $providerKey,
            domain: $domain,
            sortKey: $sortKey,
            page: $page,
            perPage: $perPage,
        );
    }

    private function item(
        string $apiKey,
        string $providerKey,
        ?string $serviceKey,
        string $title,
        string $payloadHash,
        ?CarbonImmutable $sourceLatestUpdatedAt = null,
    ): ApiCatalogItemDTO {
        return new ApiCatalogItemDTO(
            apiKey: $apiKey,
            providerKey: $providerKey,
            serviceKey: $serviceKey,
            title: $title,
            description: 'Catalog description.',
            preferredVersion: 'v1',
            openapiJsonUrl: 'https://example.test/openapi.json',
            openapiYamlUrl: 'https://example.test/openapi.yaml',
            openapiVersion: '3.0.0',
            sourceLatestUpdatedAt: $sourceLatestUpdatedAt,
            payloadHash: $payloadHash,
        );
    }

    /**
     * Paginator の Eloquent Model 配列から、比較に必要な api_key だけを取り出します。
     * 取得順の仕様を読みやすくするため、assert ではDB idではなく業務識別子を使います。
     *
     * @param  array<int, ApiCatalogCache>  $items
     * @return array<int, string>
     */
    private function apiKeys(array $items): array
    {
        return array_map(
            fn (ApiCatalogCache $cache): string => $cache->api_key,
            $items,
        );
    }

    /**
     * API一覧Repositoryの取得条件を固定するための最小レコードを作ります。
     * 保存処理そのものは同期Repositoryの責務なので、このテストでは一覧条件に必要なカラムだけを上書きします。
     *
     * @param  array<string, mixed>  $overrides
     */
    private function createApiCatalogCache(array $overrides = []): ApiCatalogCache
    {
        return ApiCatalogCache::query()->create(array_merge([
            'api_key' => 'example.test',
            'provider_key' => 'example.test',
            'service_key' => null,
            'title' => 'Example API',
            'description' => 'Example description',
            'preferred_version' => 'v1',
            'openapi_json_url' => null,
            'openapi_yaml_url' => null,
            'openapi_version' => '3.0.0',
            'source_latest_updated_at' => null,
            'payload_hash' => hash('sha256', uniqid('api-catalog-cache-repository-test-', true)),
            'is_active' => true,
            'synced_at' => now(),
        ], $overrides));
    }
}
