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
                ->has('apiCatalogItems.0.notes', 2)
                ->where('apiCatalogItems.0.notes.0.title', 'Second note')
                ->where('apiCatalogItems.0.notes.0.body', 'Second note contains MultipleMemoNeedle for search.')
            );
    }

    public function test_api_catalog_list_excludes_soft_deleted_notes_from_display_and_keyword_search(): void
    {
        $cache = $this->createApiCatalogCache([
            'api_key' => 'soft-delete-note.example.test',
            'title' => 'Soft Delete Note API',
            'provider_key' => 'soft-delete-note-provider.test',
            'service_key' => 'soft-delete-note-service',
            'description' => 'Plain catalog description',
        ]);

        ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $cache->getKey(),
            'title' => 'Visible note',
            'body' => 'VisibleMemoNeedle should still match.',
        ]);
        $deletedNote = ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $cache->getKey(),
            'title' => 'Deleted note',
            'body' => 'HiddenMemoNeedle should not match.',
        ]);
        $deletedNote->delete();

        $this
            ->get('/api-catalog?keyword=HiddenMemoNeedle')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Index', false)
                ->where('pagination.totalItems', 0)
                ->has('apiCatalogItems', 0)
            );

        $this
            ->get('/api-catalog?keyword=VisibleMemoNeedle')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Index', false)
                ->where('pagination.totalItems', 1)
                ->where('apiCatalogItems.0.apiKey', 'soft-delete-note.example.test')
                ->has('apiCatalogItems.0.notes', 1)
                ->where('apiCatalogItems.0.notes.0.title', 'Visible note')
            );
    }

    public function test_api_catalog_list_pagination_props_show_current_page_and_range(): void
    {
        /*
         * 初期件数が1ページを超えるケースです。
         * Responder へ渡る pagination が「現在ページ」「総ページ数」「表示範囲」を持つことを確認します。
         */
        for ($index = 1; $index <= 8; $index++) {
            $this->createApiCatalogCache([
                'api_key' => sprintf('catalog-%02d.example.test', $index),
                'title' => sprintf('Catalog %02d API', $index),
                'provider_key' => sprintf('catalog-%02d.example.test', $index),
            ]);
        }

        $this
            ->get('/api-catalog?sort=name_asc&page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Index', false)
                ->where('pagination.currentPage', 2)
                ->where('pagination.totalPages', 2)
                ->where('pagination.totalItems', 8)
                ->where('pagination.perPage', 6)
                ->where('pagination.from', 7)
                ->where('pagination.to', 8)
                ->has('apiCatalogItems', 2)
                ->where('apiCatalogItems.0.apiKey', 'catalog-07.example.test')
            );
    }

    public function test_api_catalog_list_search_clamps_current_page_to_filtered_last_page(): void
    {
        /*
         * 検索前に深い page を見ていた状態で検索すると、抽出後には存在しないページを指すことがあります。
         * Action が抽出後 lastPage へ補正し、空ページではなく実在する検索結果を返すことを守ります。
         */
        for ($index = 1; $index <= 8; $index++) {
            $this->createApiCatalogCache([
                'api_key' => sprintf('noise-%02d.example.test', $index),
                'title' => sprintf('Noise %02d API', $index),
                'provider_key' => sprintf('noise-%02d.example.test', $index),
            ]);
        }

        $this->createApiCatalogCache([
            'api_key' => 'needle.example.test',
            'title' => 'OnlyNeedle API',
            'provider_key' => 'needle.example.test',
        ]);

        $this
            ->get('/api-catalog?keyword=OnlyNeedle&page=5')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Index', false)
                ->where('filters.keyword', 'OnlyNeedle')
                ->where('pagination.currentPage', 1)
                ->where('pagination.totalPages', 1)
                ->where('pagination.totalItems', 1)
                ->where('pagination.from', 1)
                ->where('pagination.to', 1)
                ->where('apiCatalogItems.0.apiKey', 'needle.example.test')
            );
    }

    public function test_api_catalog_list_domain_filter_pagination_uses_filtered_count(): void
    {
        /*
         * domain 抽出は provider_key の末尾条件として Repository で適用します。
         * totalPages / totalItems / from / to が抽出前の全件数ではなく、domain 抽出後の件数になることを確認します。
         */
        for ($index = 1; $index <= 7; $index++) {
            $this->createApiCatalogCache([
                'api_key' => sprintf('dev-%02d.example.test', $index),
                'title' => sprintf('Dev %02d API', $index),
                'provider_key' => sprintf('provider-%02d.example.dev', $index),
            ]);
        }

        for ($index = 1; $index <= 3; $index++) {
            $this->createApiCatalogCache([
                'api_key' => sprintf('com-%02d.example.test', $index),
                'title' => sprintf('Com %02d API', $index),
                'provider_key' => sprintf('provider-%02d.example.com', $index),
            ]);
        }

        $this
            ->get('/api-catalog?domain=dev&sort=name_asc&page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Index', false)
                ->where('filters.domain', 'dev')
                ->where('pagination.currentPage', 2)
                ->where('pagination.totalPages', 2)
                ->where('pagination.totalItems', 7)
                ->where('pagination.from', 7)
                ->where('pagination.to', 7)
                ->has('apiCatalogItems', 1)
                ->where('apiCatalogItems.0.apiKey', 'dev-07.example.test')
            );
    }

    public function test_api_catalog_list_empty_search_returns_null_range(): void
    {
        /*
         * 0件時は React 側でページ summary を出さず、empty state だけを表示します。
         * その前提として、サーバー props の from/to は null のまま渡されることを確認します。
         */
        $this->createApiCatalogCache([
            'api_key' => 'visible.example.test',
            'title' => 'Visible API',
            'provider_key' => 'visible.example.test',
        ]);

        $this
            ->get('/api-catalog?keyword=NoSuchApi&page=3')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Index', false)
                ->where('filters.keyword', 'NoSuchApi')
                ->where('pagination.currentPage', 1)
                ->where('pagination.totalPages', 1)
                ->where('pagination.totalItems', 0)
                ->where('pagination.from', null)
                ->where('pagination.to', null)
                ->has('apiCatalogItems', 0)
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
