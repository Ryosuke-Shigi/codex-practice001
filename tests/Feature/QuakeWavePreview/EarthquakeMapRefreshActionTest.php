<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Actions\Earthquake\Commands\StartEarthquakeMapRefreshAction;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Jobs\Earthquake\RefreshEarthquakeMapDataJob;
use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

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
            public function __construct()
            {
            }

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
                );
            }
        };
        $mapPinBuildService = new class extends EarthquakeMapPinBuildService
        {
            public function __construct()
            {
            }

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
        };

        (new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId))->handle(
            $feedEntrySyncRunRepository,
            $mapPinSyncRunRepository,
            $feedEntrySyncService,
            $mapPinBuildService,
        );

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
    }

    public function test_refresh_job_marks_both_runs_failed_when_feed_sync_fails_before_map_pin_generation(): void
    {
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();
        $feedEntrySyncService = new class extends EarthquakeFeedEntrySyncService
        {
            public function __construct()
            {
            }

            public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
            {
                throw new RuntimeException('feed unavailable');
            }
        };
        $mapPinBuildService = new class extends EarthquakeMapPinBuildService
        {
            public bool $wasCalled = false;

            public function __construct()
            {
            }

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
            (new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId))->handle(
                $feedEntrySyncRunRepository,
                $mapPinSyncRunRepository,
                $feedEntrySyncService,
                $mapPinBuildService,
            );

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
            public function __construct(private readonly string $body)
            {
            }

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
            public function __construct()
            {
            }

            public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
            {
                throw new RuntimeException('map pin generation failed');
            }
        };
        $job = new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId);
        $caughtException = null;

        try {
            $job->handle(
                $feedEntrySyncRunRepository,
                $mapPinSyncRunRepository,
                $feedEntrySyncService,
                $mapPinBuildService,
            );

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
