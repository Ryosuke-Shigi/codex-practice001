<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Actions\Earthquake\Commands\RunEarthquakeFeedEntrySyncAction;
use App\Actions\Earthquake\Commands\RunEarthquakeMapPinSyncAction;
use App\Actions\Earthquake\Commands\RunEarthquakeMapRefreshAction;
use App\Actions\Earthquake\Commands\StartEarthquakeMapPinSyncAction;
use App\Actions\Earthquake\Commands\StartEarthquakeMapRefreshAction;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Jobs\Earthquake\RefreshEarthquakeMapDataJob;
use App\Jobs\Earthquake\SyncEarthquakeMapPinsJob;
use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

/**
 * QuakeWave map refresh の一括開始 Action と Job の手順を固定する Feature Test です。
 *
 * feed entry と map pin の2つの同期runを分け、片方の失敗を全成功扱いにしない境界を守ります。
 */
class EarthquakeMapRefreshActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_map_refresh_action_creates_both_pending_runs_and_dispatches_refresh_job(): void
    {
        Queue::fake();

        $syncRunIds = app(StartEarthquakeMapRefreshAction::class)->execute();

        $this->assertSame([
            'feedEntrySyncRunId' => 1,
            'mapPinSyncRunId' => 1,
        ], $syncRunIds);
        $this->assertDatabaseHas('earthquake_feed_entry_sync_runs', [
            'id' => 1,
            'status' => EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING,
        ]);
        $this->assertDatabaseHas('earthquake_map_pin_sync_runs', [
            'id' => 1,
            'status' => EarthquakeMapPinSyncResultDTO::STATUS_PENDING,
        ]);
        Queue::assertPushed(
            RefreshEarthquakeMapDataJob::class,
            fn (RefreshEarthquakeMapDataJob $job): bool => $job->feedEntrySyncRunId === 1
                && $job->mapPinSyncRunId === 1,
        );
    }

    public function test_start_map_refresh_action_returns_initial_statuses_for_http_response(): void
    {
        Queue::fake();

        $result = app(StartEarthquakeMapRefreshAction::class)->executeWithInitialStatus();

        $this->assertSame(1, $result->feedEntrySyncRunId);
        $this->assertSame(1, $result->mapPinSyncRunId);
        $this->assertNotNull($result->feedEntrySyncStatus);
        $this->assertNotNull($result->mapPinSyncStatus);
        $this->assertSame($result->feedEntrySyncRunId, $result->feedEntrySyncStatus->syncRunId);
        $this->assertSame($result->mapPinSyncRunId, $result->mapPinSyncStatus->syncRunId);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING, $result->feedEntrySyncStatus->status);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_PENDING, $result->mapPinSyncStatus->status);
        Queue::assertPushed(
            RefreshEarthquakeMapDataJob::class,
            fn (RefreshEarthquakeMapDataJob $job): bool => $job->feedEntrySyncRunId === $result->feedEntrySyncRunId
                && $job->mapPinSyncRunId === $result->mapPinSyncRunId,
        );
    }

    public function test_refresh_job_uses_shared_queue_overlap_protection(): void
    {
        $middleware = (new RefreshEarthquakeMapDataJob(1, 1))->middleware();

        $this->assertCount(1, $middleware);
        $this->assertInstanceOf(WithoutOverlapping::class, $middleware[0]);
        $this->assertSame('earthquake-map-refresh', $middleware[0]->key);
        $this->assertTrue($middleware[0]->shareKey);
        $this->assertSame(30, $middleware[0]->releaseAfter);
        $this->assertSame(660, $middleware[0]->expiresAfter);

        $job = new RefreshEarthquakeMapDataJob(1, 1);
        $this->assertSame(0, $job->tries);
        $this->assertSame(1, $job->maxExceptions);

        $retryJob = new SyncEarthquakeMapPinsJob(1, [101], 1);
        $retryMiddleware = $retryJob->middleware();
        $this->assertCount(1, $retryMiddleware);
        $this->assertSame('earthquake-map-refresh', $retryMiddleware[0]->key);
        $this->assertTrue($retryMiddleware[0]->shareKey);
        $this->assertSame(30, $retryMiddleware[0]->releaseAfter);
        $this->assertSame(360, $retryMiddleware[0]->expiresAfter);
        $this->assertSame(0, $retryJob->tries);
        $this->assertSame(1, $retryJob->maxExceptions);
    }

    public function test_queue_retry_after_exceeds_every_earthquake_job_timeout(): void
    {
        $requiredRetryAfter = max(
            (new RefreshEarthquakeMapDataJob(1, 1))->timeout,
            (new SyncEarthquakeMapPinsJob(1))->timeout,
        );

        $this->assertGreaterThan($requiredRetryAfter, config('queue.connections.redis.retry_after'));
        $this->assertGreaterThan($requiredRetryAfter, config('queue.connections.database.retry_after'));
    }

    public function test_refresh_job_is_released_during_overlap_and_runs_after_the_lock_is_free(): void
    {
        $middleware = (new RefreshEarthquakeMapDataJob(1, 1))->middleware()[0];
        $lock = Cache::lock($middleware->getLockKey(new \stdClass), $middleware->expiresAfter);
        $this->assertTrue($lock->get());

        $queuedJob = new class
        {
            public ?int $releasedAfter = null;

            public function release(int $delay): void
            {
                $this->releasedAfter = $delay;
            }
        };
        $handled = false;

        try {
            $middleware->handle($queuedJob, function () use (&$handled): void {
                $handled = true;
            });

            $this->assertSame(30, $queuedJob->releasedAfter);
            $this->assertFalse($handled);
        } finally {
            $lock->release();
        }

        $middleware->handle($queuedJob, function () use (&$handled): void {
            $handled = true;
        });

        $this->assertTrue($handled);
    }

    public function test_retry_job_is_released_while_the_integrated_refresh_lock_is_held(): void
    {
        $refreshMiddleware = (new RefreshEarthquakeMapDataJob(1, 1))->middleware()[0];
        $retryMiddleware = (new SyncEarthquakeMapPinsJob(2, [101], 1))->middleware()[0];
        $lock = Cache::lock($refreshMiddleware->getLockKey(new \stdClass), $refreshMiddleware->expiresAfter);
        $this->assertTrue($lock->get());
        $queuedJob = new class
        {
            public ?int $releasedAfter = null;

            public function release(int $delay): void
            {
                $this->releasedAfter = $delay;
            }
        };
        $handled = false;

        try {
            $retryMiddleware->handle($queuedJob, function () use (&$handled): void {
                $handled = true;
            });
        } finally {
            $lock->release();
        }

        $this->assertSame(30, $queuedJob->releasedAfter);
        $this->assertFalse($handled);
    }

    public function test_refresh_job_marks_both_runs_completed_when_feed_and_map_pin_steps_succeed(): void
    {
        /*
         * 一括更新Jobは feed entry 同期を完了してから map pin 生成へ進む手順だけを持ちます。
         * 各Serviceの内部処理は既存テストに任せ、ここでは2つの sync_runs の成功状態を固定します。
         */
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();
        $feedEntrySyncService = new class extends EarthquakeFeedEntrySyncService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
            {
                return new EarthquakeFeedEntrySyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
                    totalCount: 3,
                    insertedCount: 1,
                    updatedCount: 1,
                    skippedCount: 1,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                    changedEntryIds: [11, 12],
                );
            }
        };
        $mapPinBuildService = new class extends EarthquakeMapPinBuildService
        {
            /** @var array<int, int>|null */
            public ?array $receivedSourceEntryIds = null;

            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
            {
                return new EarthquakeMapPinSyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                    totalCount: 2,
                    insertedCount: 1,
                    updatedCount: 1,
                    skippedCount: 0,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                );
            }

            public function syncEntries(int $syncRunId, array $sourceEntryIds): EarthquakeMapPinSyncResultDTO
            {
                $this->receivedSourceEntryIds = $sourceEntryIds;

                return $this->sync($syncRunId);
            }
        };

        (new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId))->handle($this->runMapRefreshAction(
            $feedEntrySyncRunRepository,
            $mapPinSyncRunRepository,
            $feedEntrySyncService,
            $mapPinBuildService,
        ));

        $feedStatus = $feedEntrySyncRunRepository->findResult($feedEntrySyncRunId);
        $mapStatus = $mapPinSyncRunRepository->findResult($mapPinSyncRunId);

        $this->assertNotNull($feedStatus);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED, $feedStatus->status);
        $this->assertSame(3, $feedStatus->totalCount);
        $this->assertSame(1, $feedStatus->insertedCount);
        $this->assertSame(1, $feedStatus->updatedCount);
        $this->assertSame(1, $feedStatus->skippedCount);
        $this->assertSame(0, $feedStatus->failedCount);
        $this->assertNull($feedStatus->errorMessage);
        $this->assertNotNull($feedStatus->startedAt);
        $this->assertNotNull($feedStatus->finishedAt);

        $this->assertNotNull($mapStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $mapStatus->status);
        $this->assertSame(2, $mapStatus->totalCount);
        $this->assertSame(1, $mapStatus->insertedCount);
        $this->assertSame(1, $mapStatus->updatedCount);
        $this->assertSame(0, $mapStatus->skippedCount);
        $this->assertSame(0, $mapStatus->failedCount);
        $this->assertNull($mapStatus->errorMessage);
        $this->assertNotNull($mapStatus->startedAt);
        $this->assertNotNull($mapStatus->finishedAt);
        $this->assertSame([11, 12], $mapPinBuildService->receivedSourceEntryIds);
    }

    public function test_refresh_job_dispatches_a_limited_retry_for_transient_map_pin_failures(): void
    {
        Queue::fake();
        $feedRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedRunId = $feedRepository->createPending();
        $mapRunId = $mapRepository->createPending();
        $feedService = new class extends EarthquakeFeedEntrySyncService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
            {
                return new EarthquakeFeedEntrySyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
                    totalCount: 2,
                    insertedCount: 2,
                    updatedCount: 0,
                    skippedCount: 0,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                    changedEntryIds: [51, 52],
                );
            }
        };
        $buildService = new class extends EarthquakeMapPinBuildService
        {
            public function __construct() {}

            public function syncEntries(int $syncRunId, array $sourceEntryIds): EarthquakeMapPinSyncResultDTO
            {
                return new EarthquakeMapPinSyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                    totalCount: 2,
                    insertedCount: 1,
                    updatedCount: 0,
                    skippedCount: 0,
                    failedCount: 1,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                    retryableSourceEntryIds: [52],
                );
            }
        };

        (new RefreshEarthquakeMapDataJob($feedRunId, $mapRunId))->handle(
            $this->runMapRefreshAction($feedRepository, $mapRepository, $feedService, $buildService),
            app(StartEarthquakeMapPinSyncAction::class),
        );

        Queue::assertPushed(
            SyncEarthquakeMapPinsJob::class,
            fn (SyncEarthquakeMapPinsJob $job): bool => $job->sourceEntryIds === [52]
                && $job->retryAttempt === 1
                && $job->delay === 60,
        );
    }

    public function test_refresh_job_completes_map_pin_run_without_fetching_detail_xml_when_feed_has_no_changes(): void
    {
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();
        $feedEntrySyncService = new class extends EarthquakeFeedEntrySyncService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
            {
                return new EarthquakeFeedEntrySyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
                    totalCount: 1,
                    insertedCount: 0,
                    updatedCount: 0,
                    skippedCount: 1,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                    changedEntryIds: [],
                );
            }
        };
        $mapPinBuildService = new class extends EarthquakeMapPinBuildService
        {
            public bool $fullSyncCalled = false;

            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
            {
                $this->fullSyncCalled = true;

                throw new RuntimeException('Full map pin sync must not run for a zero diff refresh.');
            }
        };

        (new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId))->handle($this->runMapRefreshAction(
            $feedEntrySyncRunRepository,
            $mapPinSyncRunRepository,
            $feedEntrySyncService,
            $mapPinBuildService,
        ));

        $mapStatus = $mapPinSyncRunRepository->findResult($mapPinSyncRunId);

        $this->assertNotNull($mapStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $mapStatus->status);
        $this->assertSame(0, $mapStatus->totalCount);
        $this->assertFalse($mapPinBuildService->fullSyncCalled);
    }

    public function test_refresh_job_marks_both_runs_failed_when_feed_sync_fails_before_map_pin_generation(): void
    {
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();
        $feedEntrySyncService = new class extends EarthquakeFeedEntrySyncService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
            {
                throw new RuntimeException('feed unavailable');
            }
        };
        $mapPinBuildService = new class extends EarthquakeMapPinBuildService
        {
            public bool $wasCalled = false;

            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
            {
                $this->wasCalled = true;

                return new EarthquakeMapPinSyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                    totalCount: 0,
                    insertedCount: 0,
                    updatedCount: 0,
                    skippedCount: 0,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                );
            }
        };

        try {
            (new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId))->handle($this->runMapRefreshAction(
                $feedEntrySyncRunRepository,
                $mapPinSyncRunRepository,
                $feedEntrySyncService,
                $mapPinBuildService,
            ));

            $this->fail('Feed entry sync failure should be rethrown.');
        } catch (RuntimeException $exception) {
            $this->assertSame('feed unavailable', $exception->getMessage());
        }

        $feedStatus = $feedEntrySyncRunRepository->findResult($feedEntrySyncRunId);
        $mapStatus = $mapPinSyncRunRepository->findResult($mapPinSyncRunId);

        $this->assertNotNull($feedStatus);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_FAILED, $feedStatus->status);
        $this->assertSame(1, $feedStatus->failedCount);
        $this->assertSame('feed unavailable', $feedStatus->errorMessage);
        $this->assertNotNull($mapStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_FAILED, $mapStatus->status);
        $this->assertSame(1, $mapStatus->failedCount);
        $this->assertSame(
            'Feed entry sync failed before map pin generation: feed unavailable',
            $mapStatus->errorMessage,
        );
        $this->assertFalse($mapPinBuildService->wasCalled);
    }

    public function test_refresh_job_keeps_feed_success_completed_when_map_pin_generation_fails(): void
    {
        $existingSourceEntry = EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:earthquake:existing',
            'title' => '既存の震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260510083000_0.xml',
            'updated_at_from_feed' => '2026-05-10 08:30:00',
            'published_at_from_feed' => '2026-05-10 08:25:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-10 08:31:00',
        ]);
        EarthquakeMapPin::query()->create([
            'event_id' => '20260510083000',
            'source_entry_id' => $existingSourceEntry->getKey(),
            'title' => '震源・震度情報',
            'area_name' => '既存震源',
            'headline' => '既存の保存済み地震情報です。',
            'raw_coordinate' => '+41.0+142.5-50000/',
            'latitude' => '41.0000000',
            'longitude' => '142.5000000',
            'depth_meter' => 50000,
            'magnitude' => '4.0',
            'max_intensity' => '3',
            'occurred_at' => '2026-05-10 08:27:00',
            'reported_at' => '2026-05-10 08:31:00',
            'comment' => '既存のピンです。',
        ]);
        $this->app->instance(EarthquakeXmlRepositoryInterface::class, new class($this->atomFeed()) implements EarthquakeXmlRepositoryInterface
        {
            public function __construct(private readonly string $body) {}

            public function fetchHighFrequencyFeed(): array
            {
                return [
                    'endpoint' => 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml',
                    'method' => 'GET',
                    'request_headers' => [],
                    'success' => true,
                    'status_code' => 200,
                    'fetched_at' => '2026-05-11T08:31:00+09:00',
                    'response_time_ms' => 12.3,
                    'body' => $this->body,
                    'error_message' => null,
                ];
            }

            public function fetchXmlDocument(string $url): array
            {
                throw new RuntimeException('Individual XML documents are not fetched during feed sync.');
            }
        });

        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();
        $feedEntrySyncService = app(EarthquakeFeedEntrySyncService::class);
        $mapPinBuildService = new class extends EarthquakeMapPinBuildService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
            {
                throw new RuntimeException('map pin generation failed');
            }

            public function syncEntries(int $syncRunId, array $sourceEntryIds): EarthquakeMapPinSyncResultDTO
            {
                throw new RuntimeException('map pin generation failed');
            }
        };
        $job = new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId);
        $caughtException = null;

        try {
            $job->handle($this->runMapRefreshAction(
                $feedEntrySyncRunRepository,
                $mapPinSyncRunRepository,
                $feedEntrySyncService,
                $mapPinBuildService,
            ));

            $this->fail('Map pin generation failure should be rethrown.');
        } catch (RuntimeException $exception) {
            $caughtException = $exception;
        }

        $this->assertNotNull($caughtException);
        $this->assertSame('map pin generation failed', $caughtException->getMessage());
        $job->failed($caughtException);

        $feedStatus = $feedEntrySyncRunRepository->findResult($feedEntrySyncRunId);
        $mapStatus = $mapPinSyncRunRepository->findResult($mapPinSyncRunId);

        $this->assertNotNull($feedStatus);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED, $feedStatus->status);
        $this->assertSame(1, $feedStatus->totalCount);
        $this->assertSame(1, $feedStatus->insertedCount);
        $this->assertSame(0, $feedStatus->failedCount);
        $this->assertNull($feedStatus->errorMessage);

        $this->assertNotNull($mapStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_FAILED, $mapStatus->status);
        $this->assertSame(1, $mapStatus->failedCount);
        $this->assertSame('map pin generation failed', $mapStatus->errorMessage);

        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:new',
            'title' => '震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
        ]);
        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:existing',
        ]);
        $this->assertDatabaseCount('earthquake_feed_entries', 2);
        $this->assertDatabaseHas('earthquake_map_pins', [
            'event_id' => '20260510083000',
            'area_name' => '既存震源',
        ]);
        $this->assertDatabaseMissing('earthquake_map_pins', [
            'event_id' => '20260511083000',
        ]);
        $this->assertDatabaseCount('earthquake_map_pins', 1);
    }

    public function test_refresh_job_failed_hook_marks_pending_and_running_runs_as_failed(): void
    {
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();
        $mapPinSyncRunRepository->markRunning($mapPinSyncRunId);

        (new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId))
            ->failed(new RuntimeException('worker crashed'));

        $feedStatus = $feedEntrySyncRunRepository->findResult($feedEntrySyncRunId);
        $mapStatus = $mapPinSyncRunRepository->findResult($mapPinSyncRunId);

        $this->assertNotNull($feedStatus);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_FAILED, $feedStatus->status);
        $this->assertSame(1, $feedStatus->failedCount);
        $this->assertSame('worker crashed', $feedStatus->errorMessage);
        $this->assertNotNull($mapStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_FAILED, $mapStatus->status);
        $this->assertSame(1, $mapStatus->failedCount);
        $this->assertSame('worker crashed', $mapStatus->errorMessage);
    }

    public function test_refresh_job_failed_hook_does_not_overwrite_completed_runs(): void
    {
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();

        $feedEntrySyncRunRepository->markCompleted(
            $feedEntrySyncRunId,
            new EarthquakeFeedEntrySyncResultDTO(
                syncRunId: $feedEntrySyncRunId,
                status: EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
                totalCount: 2,
                insertedCount: 1,
                updatedCount: 1,
                skippedCount: 0,
                failedCount: 0,
                errorMessage: null,
                startedAt: now(),
                finishedAt: now(),
            ),
        );
        $mapPinSyncRunRepository->markCompleted(
            $mapPinSyncRunId,
            new EarthquakeMapPinSyncResultDTO(
                syncRunId: $mapPinSyncRunId,
                status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                totalCount: 3,
                insertedCount: 2,
                updatedCount: 1,
                skippedCount: 0,
                failedCount: 0,
                errorMessage: null,
                startedAt: now(),
                finishedAt: now(),
            ),
        );

        (new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId))
            ->failed(new RuntimeException('late worker failure'));

        $feedStatus = $feedEntrySyncRunRepository->findResult($feedEntrySyncRunId);
        $mapStatus = $mapPinSyncRunRepository->findResult($mapPinSyncRunId);

        $this->assertNotNull($feedStatus);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED, $feedStatus->status);
        $this->assertSame(2, $feedStatus->totalCount);
        $this->assertSame(1, $feedStatus->insertedCount);
        $this->assertSame(1, $feedStatus->updatedCount);
        $this->assertSame(0, $feedStatus->failedCount);
        $this->assertNull($feedStatus->errorMessage);
        $this->assertNotNull($mapStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $mapStatus->status);
        $this->assertSame(3, $mapStatus->totalCount);
        $this->assertSame(2, $mapStatus->insertedCount);
        $this->assertSame(1, $mapStatus->updatedCount);
        $this->assertSame(0, $mapStatus->failedCount);
        $this->assertNull($mapStatus->errorMessage);
    }

    private function runMapRefreshAction(
        EarthquakeFeedEntrySyncRunRepositoryInterface $feedEntrySyncRunRepository,
        EarthquakeMapPinSyncRunRepositoryInterface $mapPinSyncRunRepository,
        EarthquakeFeedEntrySyncService $feedEntrySyncService,
        EarthquakeMapPinBuildService $mapPinBuildService,
    ): RunEarthquakeMapRefreshAction {
        return new RunEarthquakeMapRefreshAction(
            new RunEarthquakeFeedEntrySyncAction(
                $feedEntrySyncRunRepository,
                $feedEntrySyncService,
            ),
            new RunEarthquakeMapPinSyncAction($mapPinSyncRunRepository, $mapPinBuildService),
            $mapPinSyncRunRepository,
        );
    }

    private function atomFeed(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>JMA Earthquake and Volcano Feed</title>
  <updated>2026-05-11T08:30:00+09:00</updated>
  <entry>
    <id>urn:jma:earthquake:new</id>
    <title>震源・震度に関する情報</title>
    <updated>2026-05-11T08:30:00+09:00</updated>
    <published>2026-05-11T08:25:00+09:00</published>
    <link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml" />
    <category term="地震火山関連" label="地震情報" />
    <author>
      <name>気象庁</name>
    </author>
  </entry>
</feed>
XML;
    }
}
