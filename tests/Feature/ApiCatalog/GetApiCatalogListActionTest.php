<?php

namespace Tests\Feature\ApiCatalog;

use App\Actions\ApiCatalog\Queries\GetApiCatalogListAction;
use App\DTO\ApiCatalog\List\ApiCatalogListQueryDTO;
use App\Models\ApiCatalogCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GetApiCatalogListActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_execute_clamps_page_to_filtered_last_page(): void
    {
        /*
         * Repository の paginator は、範囲外 page を要求されても空ページを返せます。
         * API一覧画面では検索後や直URLで page が大きすぎる場合に空一覧へ飛ばしたくないため、
         * Action が「存在する最終ページで再取得する」ユースケース手順を担当します。
         */
        for ($index = 1; $index <= 8; $index++) {
            $this->createApiCatalogCache([
                'api_key' => sprintf('catalog-%02d.example.test', $index),
                'title' => sprintf('Catalog %02d API', $index),
                'provider_key' => sprintf('catalog-%02d.example.test', $index),
            ]);
        }

        $result = app(GetApiCatalogListAction::class)->execute(new ApiCatalogListQueryDTO(
            keyword: null,
            providerKey: null,
            domain: null,
            sortKey: ApiCatalogListQueryDTO::SORT_NAME_ASC,
            page: 99,
            perPage: 3,
        ));

        $this->assertSame(3, $result->pagination['currentPage']);
        $this->assertSame(3, $result->pagination['totalPages']);
        $this->assertSame(8, $result->pagination['totalItems']);
        $this->assertSame(7, $result->pagination['from']);
        $this->assertSame(8, $result->pagination['to']);
        $this->assertSame(['catalog-07.example.test', 'catalog-08.example.test'], $this->apiKeys($result->items));
    }

    public function test_execute_returns_list_result_dto_sections(): void
    {
        /*
         * Action は Repository から取得したページ、provider候補、domain候補をまとめて
         * ApiCatalogListResultDTO へ詰めます。Inertia props への最終整形は Responder の責務なので、
         * ここでは ResultDTO が持つ sections の中身だけを確認します。
         */
        $this->createApiCatalogCache([
            'api_key' => 'github.com:rest',
            'title' => 'GitHub API',
            'description' => 'GitHub catalog entry',
            'provider_key' => 'github.com',
            'service_key' => 'rest',
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
        $this->createApiCatalogCache([
            'api_key' => 'inactive.example.test',
            'title' => 'Inactive API',
            'provider_key' => 'inactive.example.net',
            'is_active' => false,
        ]);

        $result = app(GetApiCatalogListAction::class)->execute(new ApiCatalogListQueryDTO(
            keyword: 'GitHub',
            providerKey: null,
            domain: null,
            sortKey: ApiCatalogListQueryDTO::SORT_NAME_ASC,
            page: 1,
            perPage: 6,
        ));

        $this->assertSame([
            'keyword' => 'GitHub',
            'providerKey' => null,
            'domain' => null,
            'sortKey' => ApiCatalogListQueryDTO::SORT_NAME_ASC,
        ], $result->filters);
        $this->assertSame(['github.com', 'shopify.dev', 'stripe.com'], $result->providers);
        $this->assertSame(['com', 'dev'], $result->domains);
        $this->assertSame(['github.com:rest'], $this->apiKeys($result->items));
        $this->assertSame([
            'currentPage' => 1,
            'totalPages' => 1,
            'totalItems' => 1,
            'perPage' => 6,
            'from' => 1,
            'to' => 1,
        ], $result->pagination);
    }

    /**
     * Action テストでは ApiCatalogListItemDTO の配列が返るため、
     * DTO境界を保ったまま apiKey だけを比較します。
     *
     * @param  array<int, \App\DTO\ApiCatalog\List\ApiCatalogListItemDTO>  $items
     * @return array<int, string>
     */
    private function apiKeys(array $items): array
    {
        return array_map(
            fn ($item): string => $item->apiKey,
            $items,
        );
    }

    /**
     * Action が Repository から読むための最小カタログデータを用意します。
     * Action 自身に保存ロジックがないことを保つため、DB投入はテストヘルパー側に閉じています。
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
            'payload_hash' => hash('sha256', uniqid('get-api-catalog-list-action-test-', true)),
            'is_active' => true,
            'synced_at' => now(),
        ], $overrides));
    }
}
