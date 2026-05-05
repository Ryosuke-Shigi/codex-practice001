<?php

namespace Tests\Feature\ApiCatalog;

use App\Models\ApiCatalogCache;
use App\Models\ApiCatalogNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApiCatalogNoteTest extends TestCase
{
    /*
     * このテストは saved_api_notes のCRUDと詳細表示propsを検証するため RefreshDatabase を使います。
     * phpunit.xml で DB_CONNECTION=sqlite / DB_DATABASE=:memory: に固定し、
     * 開発用MySQLの api_catalog_cache を絶対に migrate し直さない前提にしています。
     */
    use RefreshDatabase;

    public function test_api_catalog_detail_includes_saved_notes(): void
    {
        $cache = $this->createApiCatalogCache(['api_key' => 'github.com:rest']);
        ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $cache->getKey(),
            'title' => 'First note',
            'body' => 'Older body',
        ]);
        ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $cache->getKey(),
            'title' => 'Second note',
            'body' => 'Newer body',
        ]);

        $response = $this->get('/api-catalog/'.rawurlencode($cache->api_key));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApiCatalog/Detail', false)
                ->where('apiCatalogItem.apiKey', 'github.com:rest')
                ->has('apiCatalogItem.notes', 2)
                ->where('apiCatalogItem.notes.0.title', 'Second note')
                ->where('apiCatalogItem.notes.0.body', 'Newer body')
            );
    }

    public function test_api_catalog_note_can_be_stored_updated_and_deleted(): void
    {
        $cache = $this->createApiCatalogCache(['api_key' => 'github.com:rest']);
        $detailUrl = '/api-catalog/'.rawurlencode($cache->api_key)
            .'?return_url='.rawurlencode('/api-catalog?domain=com');

        $storeResponse = $this
            ->from($detailUrl)
            ->post('/api-catalog/'.rawurlencode($cache->api_key).'/notes', [
                'title' => '  Research title  ',
                'body' => '  Research body  ',
            ]);

        $storeResponse->assertRedirect($detailUrl);
        $this->assertDatabaseHas('saved_api_notes', [
            'api_catalog_cache_id' => $cache->getKey(),
            'title' => 'Research title',
            'body' => 'Research body',
        ]);

        $note = ApiCatalogNote::query()->firstOrFail();

        $updateResponse = $this
            ->from($detailUrl)
            ->patch('/api-catalog/'.rawurlencode($cache->api_key).'/notes/'.$note->getKey(), [
                'title' => null,
                'body' => 'Updated body',
            ]);

        $updateResponse->assertRedirect($detailUrl);
        $this->assertDatabaseHas('saved_api_notes', [
            'id' => $note->getKey(),
            'title' => null,
            'body' => 'Updated body',
        ]);

        $deleteResponse = $this
            ->from($detailUrl)
            ->delete('/api-catalog/'.rawurlencode($cache->api_key).'/notes/'.$note->getKey());

        $deleteResponse->assertRedirect($detailUrl);
        $this->assertDatabaseMissing('saved_api_notes', [
            'id' => $note->getKey(),
        ]);
    }

    public function test_api_catalog_note_update_and_delete_require_matching_api(): void
    {
        /*
         * URL上の note id だけを信じると、別APIのメモを更新/削除できてしまいます。
         * Action/Repository が api_catalog_cache_id と note id の組み合わせで所有確認することを守ります。
         */
        $ownerCache = $this->createApiCatalogCache(['api_key' => 'owner.example.com']);
        $otherCache = $this->createApiCatalogCache(['api_key' => 'other.example.com']);
        $note = ApiCatalogNote::query()->create([
            'api_catalog_cache_id' => $ownerCache->getKey(),
            'title' => 'Owner note',
            'body' => 'Owner body',
        ]);

        $this
            ->patch('/api-catalog/'.rawurlencode($otherCache->api_key).'/notes/'.$note->getKey(), [
                'title' => 'Wrong owner',
                'body' => 'Should not update',
            ])
            ->assertNotFound();

        $this
            ->delete('/api-catalog/'.rawurlencode($otherCache->api_key).'/notes/'.$note->getKey())
            ->assertNotFound();

        $this->assertDatabaseHas('saved_api_notes', [
            'id' => $note->getKey(),
            'api_catalog_cache_id' => $ownerCache->getKey(),
            'title' => 'Owner note',
            'body' => 'Owner body',
        ]);
    }

    public function test_api_catalog_note_body_is_required(): void
    {
        $cache = $this->createApiCatalogCache(['api_key' => 'github.com:rest']);

        $response = $this
            ->from('/api-catalog/'.rawurlencode($cache->api_key))
            ->post('/api-catalog/'.rawurlencode($cache->api_key).'/notes', [
                'title' => 'No body',
                'body' => '',
            ]);

        $response->assertSessionHasErrors('body');
        $this->assertDatabaseCount('saved_api_notes', 0);
    }

    public function test_mock_detail_does_not_persist_notes(): void
    {
        /*
         * MockDetail は表示確認専用です。
         * ApiCatalogNotesPanel は共通利用しますが isPersistable=false なので、DB書き込みrouteを呼びません。
         */
        $response = $this->get('/api-catalog/mock/github.com');

        $response->assertOk();
        $this->assertDatabaseCount('saved_api_notes', 0);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createApiCatalogCache(array $overrides = []): ApiCatalogCache
    {
        /*
         * APIカタログ同期本体を通さず、詳細/メモのFeature testに必要な最小行だけを用意します。
         * payload_hash は api_catalog_cache の必須保存境界なので固定値を上書き可能にします。
         */
        return ApiCatalogCache::query()->create(array_merge([
            'api_key' => 'example.com',
            'provider_key' => 'example.com',
            'service_key' => null,
            'title' => 'Example API',
            'description' => 'Example description',
            'preferred_version' => 'v1',
            'openapi_json_url' => null,
            'openapi_yaml_url' => null,
            'openapi_version' => '3.0.0',
            'source_latest_updated_at' => null,
            'payload_hash' => hash('sha256', uniqid('api-catalog-note-test-', true)),
            'is_active' => true,
            'synced_at' => now(),
        ], $overrides));
    }
}
