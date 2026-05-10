<?php

namespace Tests\Feature\ApiCatalog;

use App\Models\ApiCatalogCache;
use App\Models\ApiCatalogNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApiCatalogListSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_catalog_list_keyword_search_matches_catalog_fields_and_saved_note_body(): void
    {
        /*
         * 一覧検索の対象は Repository の DB 条件に閉じます。
         * 画面は検索済み props を受け取るだけなので、HTTP 経由で props の結果を確認します。
         */
        $this->createApiCatalogCache([
            'api_key' => 'name.example.test',
            'title' => 'LedgerNameNeedle API',
            'provider_key' => 'name-provider.test',
            'service_key' => 'name-service',
            'description' => 'Plain catalog description',
        ]);

        $this->createApiCatalogCache([
            'api_key' => 'provider.example.test',
            'title' => 'Provider Target API',
            'provider_key' => 'ProviderNeedle.example.test',
            'service_key' => 'provider-service',
            'description' => 'Plain catalog description',
        ]);

        $this->createApiCatalogCache([
            'api_key' => 'description.example.test',
            'title' => 'Description Target API',
            'provider_key' => 'description-provider.test',
            'service_key' => 'description-service',
            'description' => 'This entry contains DescriptionNeedle only here.',
        ]);

        $this->createApiCatalogCache([
            'api_key' => 'domain.example.test',
            'title' => 'Domain Target API',
            'provider_key' => 'domain-provider.test',
            'service_key' => 'DomainNeedleService',
            'description' => 'Plain catalog description',
        ]);

        $noteMatchedCache = $this->createApiCatalogCache([
            'api_key' => 'note.example.test',
            'title' => 'Note Target API',
            'provider_key' => 'note-provider.test',
            'service_key' => 'note-service',
            'description' => 'Plain catalog description',
        ]);
        ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $noteMatchedCache->getKey(),
            'title' => 'Saved note',
            'body' => 'This saved memo body contains MemoNeedle only in the note.',
        ]);

        /*
         * domain は api_catalog_cache に専用カラムを持たないため、現行の keyword 検索では
         * provider/service 側の文字列を検索対象として扱います。
         * 保存メモ本文の case は、API本体フィールドに一致しなくても notes.body だけで一覧に出ることを確認します。
         */
        $cases = [
            'name field' => ['LedgerNameNeedle', 'name.example.test'],
            'provider field' => ['ProviderNeedle', 'provider.example.test'],
            'description field' => ['DescriptionNeedle', 'description.example.test'],
            'domain/service field' => ['DomainNeedleService', 'domain.example.test'],
            'saved note body' => ['MemoNeedle', 'note.example.test'],
        ];

        foreach ($cases as [$keyword, $expectedApiKey]) {
            $this
                ->get('/api-catalog?keyword='.rawurlencode($keyword))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('ApiCatalog/Index', false)
                    ->where('pagination.totalItems', 1)
                    ->where('apiCatalogItems.0.apiKey', $expectedApiKey)
                );
        }
    }

    public function test_api_catalog_list_keyword_search_matches_any_saved_note_body_once(): void
    {
        /*
         * saved_api_notes は1つのAPIに複数件作れます。
         * Repository 側を whereHas で実装しているため、どれか1件の本文に一致すれば表示され、
         * notes の件数ぶん apiCatalogItems が重複しないことを totalItems=1 で守ります。
         */
        $cache = $this->createApiCatalogCache([
            'api_key' => 'multi-note.example.test',
            'title' => 'Multi Note API',
            'provider_key' => 'multi-note-provider.test',
            'service_key' => 'multi-note-service',
            'description' => 'Plain catalog description',
        ]);

        ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $cache->getKey(),
            'title' => 'First note',
            'body' => 'No target keyword here.',
        ]);
        ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $cache->getKey(),
            'title' => 'Second note',
            'body' => 'Second note contains MultipleMemoNeedle for search.',
        ]);

        $this->createApiCatalogCache([
            'api_key' => 'no-note.example.test',
            'title' => 'No Note API',
            'provider_key' => 'no-note-provider.test',
            'service_key' => 'no-note-service',
            'description' => 'Plain catalog description',
        ]);

        $this
            ->get('/api-catalog?keyword=MultipleMemoNeedle')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Index', false)
                ->where('pagination.totalItems', 1)
                ->where('apiCatalogItems.0.apiKey', 'multi-note.example.test')
            );
    }

    /**
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
            'payload_hash' => hash('sha256', uniqid('api-catalog-list-search-test-', true)),
            'is_active' => true,
            'synced_at' => now(),
        ], $overrides));
    }
}
