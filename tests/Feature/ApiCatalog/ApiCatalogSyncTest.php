<?php

namespace Tests\Feature\ApiCatalog;

use App\Actions\ApiCatalog\Commands\StartApiCatalogSyncAction;
use App\Actions\ApiCatalog\Queries\GetApiCatalogSyncStatusAction;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Jobs\ApiCatalog\SyncApiCatalogJob;
use App\Models\ApiCatalogSyncRun;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ApiCatalogSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_api_catalog_sync_action_dispatches_sync_job(): void
    {
        Queue::fake();

        $status = app(StartApiCatalogSyncAction::class)->execute();

        $this->assertSame(ApiCatalogSyncStatusDTO::STATUS_QUEUED, $status->status);
        $this->assertTrue($status->isRunning());
        $this->assertDatabaseHas('api_catalog_sync_runs', [
            'id' => $status->id,
            'status' => ApiCatalogSyncStatusDTO::STATUS_QUEUED,
        ]);

        Queue::assertPushed(
            SyncApiCatalogJob::class,
            fn (SyncApiCatalogJob $job) => $job->syncRunId === $status->id,
        );
    }

    public function test_start_api_catalog_sync_action_keeps_dispatching_when_status_storage_is_not_ready(): void
    {
        Queue::fake();
        $this->app->instance(ApiCatalogSyncStatusRepositoryInterface::class, new class implements ApiCatalogSyncStatusRepositoryInterface
        {
            public function isStorageReady(): bool
            {
                return false;
            }

            public function createQueued(): ApiCatalogSyncRun
            {
                throw new \RuntimeException('Storage should not be used.');
            }

            public function markRunning(int $syncRunId, CarbonInterface $startedAt): void
            {
                //
            }

            public function markCompleted(
                int $syncRunId,
                ApiCatalogSyncResultDTO $result,
                CarbonInterface $finishedAt,
            ): void {
                //
            }

            public function markFailed(
                int $syncRunId,
                string $errorMessage,
                CarbonInterface $finishedAt,
                int $failedCount,
            ): void {
                //
            }

            public function findStatusById(int $syncRunId): ?ApiCatalogSyncStatusDTO
            {
                return null;
            }

            public function findLatestStatus(): ?ApiCatalogSyncStatusDTO
            {
                return null;
            }
        });

        $status = app(StartApiCatalogSyncAction::class)->execute();

        $this->assertNull($status);
        Queue::assertPushed(
            SyncApiCatalogJob::class,
            fn (SyncApiCatalogJob $job) => $job->syncRunId === null,
        );
    }

    public function test_api_catalog_sync_route_dispatches_sync_job_and_returns_to_current_list(): void
    {
        /*
         * 手動更新は同期処理本体をHTTPリクエスト内で実行せず、JobをQueueへ投入します。
         * Queue fake では実処理を止め、HTTP入口が正しいJobを積むことだけを確認します。
         * return_url には一覧状態を含め、検索・並び替え・ページ番号がPOST後も残ることを守ります。
         *
         * connection === 'sync' は期待しません。
         * Queue 接続先は環境設定に委ね、このルートの責務は Job 投入までに限定します。
         */
        Queue::fake();

        $response = $this
            ->from('/api-catalog?keyword=github&sort=name_desc&page=2')
            ->post('/api-catalog/sync', [
                'return_url' => '/api-catalog?keyword=github&sort=name_desc&page=2',
            ]);

        $response->assertRedirect('/api-catalog?keyword=github&sort=name_desc&page=2');
        Queue::assertPushed(SyncApiCatalogJob::class);
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

    public function test_api_catalog_sync_route_returns_json_status_for_polling_start(): void
    {
        Queue::fake();

        $response = $this->postJson('/api-catalog/sync', [
            'return_url' => '/api-catalog',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('syncStatus.status', ApiCatalogSyncStatusDTO::STATUS_QUEUED)
            ->assertJsonPath('syncStatus.isRunning', true)
            ->assertJsonPath('syncStatus.result.insertedCount', 0)
            ->assertJsonPath('syncStatus.result.updatedCount', 0)
            ->assertJsonPath('syncStatus.result.skippedCount', 0)
            ->assertJsonPath('syncStatus.result.failedCount', 0);

        Queue::assertPushed(SyncApiCatalogJob::class);
    }

    public function test_get_api_catalog_sync_status_query_returns_current_status(): void
    {
        $repository = app(ApiCatalogSyncStatusRepositoryInterface::class);
        $syncRun = $repository->createQueued();

        $status = app(GetApiCatalogSyncStatusAction::class)->execute((int) $syncRun->getKey());

        $this->assertNotNull($status);
        $this->assertSame((int) $syncRun->getKey(), $status->id);
        $this->assertSame(ApiCatalogSyncStatusDTO::STATUS_QUEUED, $status->status);
        $this->assertTrue($status->isRunning());
    }

    public function test_old_running_sync_status_is_reported_as_stale(): void
    {
        $repository = app(ApiCatalogSyncStatusRepositoryInterface::class);
        $syncRun = $repository->createQueued();
        $repository->markRunning((int) $syncRun->getKey(), now()->subMinutes(30));
        ApiCatalogSyncRun::query()
            ->whereKey($syncRun->getKey())
            ->update(['updated_at' => now()->subMinutes(30)]);

        $status = app(GetApiCatalogSyncStatusAction::class)->execute((int) $syncRun->getKey());

        $this->assertNotNull($status);
        $this->assertSame(ApiCatalogSyncStatusDTO::STATUS_RUNNING, $status->status);
        $this->assertFalse($status->isRunning());
        $this->assertTrue($status->isStale());

        $this
            ->getJson('/api-catalog/sync/status?sync_id='.$syncRun->getKey())
            ->assertOk()
            ->assertJsonPath('syncStatus.isRunning', false)
            ->assertJsonPath('syncStatus.isStale', true);
    }

    public function test_completed_api_catalog_sync_status_returns_result_counts(): void
    {
        $repository = app(ApiCatalogSyncStatusRepositoryInterface::class);
        $syncRun = $repository->createQueued();

        $repository->markCompleted(
            (int) $syncRun->getKey(),
            new ApiCatalogSyncResultDTO(
                totalCount: 20,
                insertedCount: 3,
                updatedCount: 4,
                skippedCount: 12,
                inactiveCount: 1,
                failedCount: 2,
            ),
            now(),
        );

        $status = app(GetApiCatalogSyncStatusAction::class)->execute((int) $syncRun->getKey());

        $this->assertNotNull($status);
        $this->assertSame(ApiCatalogSyncStatusDTO::STATUS_COMPLETED, $status->status);
        $this->assertFalse($status->isRunning());
        $this->assertSame(3, $status->result->insertedCount);
        $this->assertSame(4, $status->result->updatedCount);
        $this->assertSame(12, $status->result->skippedCount);
        $this->assertSame(2, $status->result->failedCount);
    }

    public function test_failed_api_catalog_sync_status_returns_failed_state(): void
    {
        $repository = app(ApiCatalogSyncStatusRepositoryInterface::class);
        $syncRun = $repository->createQueued();

        $repository->markFailed((int) $syncRun->getKey(), 'APIs.guru unavailable.', now(), 1);

        $status = app(GetApiCatalogSyncStatusAction::class)->execute((int) $syncRun->getKey());

        $this->assertNotNull($status);
        $this->assertSame(ApiCatalogSyncStatusDTO::STATUS_FAILED, $status->status);
        $this->assertFalse($status->isRunning());
        $this->assertSame(1, $status->result->failedCount);
        $this->assertSame('APIs.guru unavailable.', $status->errorMessage);
    }

    public function test_sync_job_failed_hook_marks_sync_status_as_failed(): void
    {
        $repository = app(ApiCatalogSyncStatusRepositoryInterface::class);
        $syncRun = $repository->createQueued();
        $job = new SyncApiCatalogJob((int) $syncRun->getKey());

        $job->failed(new \RuntimeException('Worker timeout.'));

        $status = app(GetApiCatalogSyncStatusAction::class)->execute((int) $syncRun->getKey());

        $this->assertNotNull($status);
        $this->assertSame(ApiCatalogSyncStatusDTO::STATUS_FAILED, $status->status);
        $this->assertSame(1, $status->result->failedCount);
        $this->assertSame('Worker timeout.', $status->errorMessage);
    }

    public function test_sync_job_has_explicit_timeout_for_catalog_sync(): void
    {
        $job = new SyncApiCatalogJob();

        $this->assertSame(1, $job->tries);
        $this->assertSame(900, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
    }

    public function test_api_catalog_sync_status_route_returns_current_status(): void
    {
        $repository = app(ApiCatalogSyncStatusRepositoryInterface::class);
        $syncRun = $repository->createQueued();
        $repository->markRunning((int) $syncRun->getKey(), now());

        $this
            ->getJson('/api-catalog/sync/status?sync_id='.$syncRun->getKey())
            ->assertOk()
            ->assertJsonPath('syncStatus.id', $syncRun->getKey())
            ->assertJsonPath('syncStatus.status', ApiCatalogSyncStatusDTO::STATUS_RUNNING)
            ->assertJsonPath('syncStatus.isRunning', true);
    }

    public function test_api_catalog_frontend_disables_sync_button_while_sync_is_running(): void
    {
        $source = file_get_contents(resource_path('js/Pages/ApiCatalog/Index.tsx'));

        $this->assertIsString($source);
        $this->assertStringContainsString(
            'const isSyncButtonDisabled = isStartingSync || (syncStatus?.isRunning ?? false);',
            $source,
        );
        $this->assertStringContainsString('disabled={isSyncButtonDisabled}', $source);
    }
}
