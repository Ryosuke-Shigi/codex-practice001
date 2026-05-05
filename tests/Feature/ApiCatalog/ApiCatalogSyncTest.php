<?php

namespace Tests\Feature\ApiCatalog;

use App\Jobs\ApiCatalog\SyncApiCatalogJob;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ApiCatalogSyncTest extends TestCase
{
    public function test_api_catalog_sync_route_dispatches_sync_job_on_sync_connection_and_returns_to_current_list(): void
    {
        /*
         * 手動更新は queue worker がなくても動くよう sync connection でJobを実行します。
         * Queue fake では実処理を止め、HTTP入口が正しいJobを起動することだけを確認します。
         * return_url には一覧状態を含め、検索・並び替え・ページ番号がPOST後も残ることを守ります。
         */
        Queue::fake();

        $response = $this
            ->from('/api-catalog?keyword=github&sort=name_desc&page=2')
            ->post('/api-catalog/sync', [
                'return_url' => '/api-catalog?keyword=github&sort=name_desc&page=2',
            ]);

        $response->assertRedirect('/api-catalog?keyword=github&sort=name_desc&page=2');
        Queue::assertPushed(
            SyncApiCatalogJob::class,
            fn (SyncApiCatalogJob $job): bool => $job->connection === 'sync',
        );
    }

    public function test_api_catalog_sync_route_does_not_redirect_outside_api_catalog_list(): void
    {
        /*
         * return_url はユーザー入力と同じ扱いなので、外部URLへは戻しません。
         * 更新操作の導線を本番一覧へ閉じ込めるため、異常値は /api-catalog に丸めます。
         */
        Queue::fake();

        $response = $this->post('/api-catalog/sync', [
            'return_url' => 'https://example.com/not-allowed',
        ]);

        $response->assertRedirect('/api-catalog');
        Queue::assertPushed(SyncApiCatalogJob::class);
    }
}
