<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Actions\Earthquake\Commands\StartEarthquakeFeedEntrySyncAction;
use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryDTO;
use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\Jobs\Earthquake\SyncEarthquakeFeedEntriesJob;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

/**
 * QuakeWave feed entry 同期の開始 route / Action / Job / status API を固定する Feature Test です。
 *
 * Atom feed 解析そのものではなく、同期 run の状態遷移と polling 用 JSON shape を守ります。
 */
class QuakeWavePreviewFeedEntrySyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_earthquake_feed_entry_sync_action_creates_pending_run_and_dispatches_job(): void
    {
        Queue::fake();

        $syncRunId = app(StartEarthquakeFeedEntrySyncAction::class)->execute();

        $this->assertDatabaseHas('earthquake_feed_entry_sync_runs', [
            'id' => $syncRunId,
            'status' => EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING,
        ]);
        Queue::assertPushed(
            SyncEarthquakeFeedEntriesJob::class,
            fn (SyncEarthquakeFeedEntriesJob $job) => $job->syncRunId === $syncRunId,
        );
    }

    public function test_feed_entry_sync_start_route_returns_sync_run_id_for_polling(): void
    {
        Queue::fake();

        $response = $this->postJson('/quakewave-preview/feed-entries/sync');

        $response
            ->assertOk()
            ->assertJsonPath('syncRunId', 1)
            ->assertJsonPath('syncStatus.syncRunId', 1)
            ->assertJsonPath('syncStatus.status', EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING)
            ->assertJsonPath('syncStatus.isRunning', true);

        Queue::assertPushed(
            SyncEarthquakeFeedEntriesJob::class,
            fn (SyncEarthquakeFeedEntriesJob $job) => $job->syncRunId === 1,
        );
    }

    public function test_feed_entry_sync_start_route_returns_clear_error_when_storage_is_not_ready(): void
    {
        Queue::fake();
        $this->app->instance(EarthquakeFeedEntrySyncRunRepositoryInterface::class, new class implements EarthquakeFeedEntrySyncRunRepositoryInterface
        {
            public function isStorageReady(): bool
            {
                return false;
            }

            public function createPending(): int
            {
                throw new RuntimeException('Storage should not be used.');
            }

            public function markRunning(int $syncRunId): void
            {
                //
            }

            public function markCompleted(int $syncRunId, EarthquakeFeedEntrySyncResultDTO $result): void
            {
                //
            }

            public function markFailed(int $syncRunId, string $message): void
            {
                //
            }

            public function findResult(int $syncRunId): ?EarthquakeFeedEntrySyncResultDTO
            {
                return null;
            }

            public function latest(int $limit = 10): array
            {
                return [];
            }
        });

        $this
            ->postJson('/quakewave-preview/feed-entries/sync')
            ->assertStatus(503)
            ->assertJsonPath('message', 'Earthquake feed entry sync storage is not ready. Run migrations.')
            ->assertJsonPath('syncStatus', null);

        Queue::assertNothingPushed();
    }

    public function test_feed_entry_sync_status_route_returns_current_status(): void
    {
        $repository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();
        $repository->markRunning($syncRunId);

        $this
            ->getJson('/quakewave-preview/feed-entries/sync/status?syncRunId='.$syncRunId)
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $syncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeFeedEntrySyncResultDTO::STATUS_RUNNING)
            ->assertJsonPath('syncStatus.isRunning', true);
    }

    public function test_feed_entry_sync_job_marks_run_completed_with_result_counts(): void
    {
        /*
         * Job は Queue が拾った事実を running として保存し、Service の結果を completed に反映します。
         * feed取得・XML解析・upsert詳細は Service/Repository 側のテストに任せます。
         */
        $repository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();
        $syncService = new class extends EarthquakeFeedEntrySyncService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
            {
                return new EarthquakeFeedEntrySyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
                    totalCount: 4,
                    insertedCount: 2,
                    updatedCount: 1,
                    skippedCount: 1,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                );
            }
        };

        (new SyncEarthquakeFeedEntriesJob($syncRunId))->handle($repository, $syncService);

        $status = $repository->findResult($syncRunId);

        $this->assertNotNull($status);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED, $status->status);
        $this->assertFalse($status->isRunning());
        $this->assertSame(4, $status->totalCount);
        $this->assertSame(2, $status->insertedCount);
        $this->assertSame(1, $status->updatedCount);
        $this->assertSame(1, $status->skippedCount);
        $this->assertSame(0, $status->failedCount);
        $this->assertNull($status->errorMessage);
        $this->assertNotNull($status->startedAt);
        $this->assertNotNull($status->finishedAt);
    }

    public function test_feed_entry_repository_inserts_skips_and_updates_by_entry_id(): void
    {
        $repository = app(EarthquakeFeedEntryRepositoryInterface::class);
        $entries = new EarthquakeExtractedEntryListDTO([
            $this->entry(id: 'urn:jma:earthquake:1', title: '震源・震度に関する情報'),
        ]);

        $insertResult = $repository->upsertFromExtractedEntries($entries);

        $this->assertSame(1, $insertResult['totalCount']);
        $this->assertSame(1, $insertResult['insertedCount']);
        $this->assertSame(0, $insertResult['updatedCount']);
        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:1',
            'title' => '震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
        ]);

        $skipResult = $repository->upsertFromExtractedEntries($entries);

        $this->assertSame(0, $skipResult['insertedCount']);
        $this->assertSame(0, $skipResult['updatedCount']);
        $this->assertSame(1, $skipResult['skippedCount']);

        $updateResult = $repository->upsertFromExtractedEntries(new EarthquakeExtractedEntryListDTO([
            $this->entry(id: 'urn:jma:earthquake:1', title: '震源・震度に関する更新情報'),
        ]));

        $this->assertSame(0, $updateResult['insertedCount']);
        $this->assertSame(1, $updateResult['updatedCount']);
        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:1',
            'title' => '震源・震度に関する更新情報',
        ]);
    }

    public function test_feed_entry_sync_service_fetches_atom_feed_extracts_earthquake_entries_and_saves_them(): void
    {
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
                throw new RuntimeException('Individual XML documents are not fetched in this sync.');
            }
        });

        $syncRunId = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class)->createPending();

        $result = app(EarthquakeFeedEntrySyncService::class)->sync($syncRunId);

        $this->assertSame($syncRunId, $result->syncRunId);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED, $result->status);
        $this->assertSame(1, $result->totalCount);
        $this->assertSame(1, $result->insertedCount);
        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:1',
            'title' => '震源・震度に関する情報',
        ]);
        $this->assertDatabaseMissing('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:volcano:1',
        ]);
    }

    public function test_sync_job_failed_hook_marks_sync_run_as_failed(): void
    {
        $repository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();

        (new SyncEarthquakeFeedEntriesJob($syncRunId))->failed(new RuntimeException('Worker timeout.'));

        $status = $repository->findResult($syncRunId);

        $this->assertNotNull($status);
        $this->assertSame(EarthquakeFeedEntrySyncResultDTO::STATUS_FAILED, $status->status);
        $this->assertSame(1, $status->failedCount);
        $this->assertSame('Worker timeout.', $status->errorMessage);
    }

    public function test_quakewave_frontend_contains_feed_entry_sync_polling_ui(): void
    {
        $source = file_get_contents(resource_path('js/Pages/QuakeWavePreview/Index.tsx'));

        $this->assertIsString($source);
        $this->assertStringContainsString('/quakewave-preview/feed-entries/sync', $source);
        $this->assertStringContainsString('/quakewave-preview/feed-entries/sync/status', $source);
        $this->assertStringContainsString('EARTHQUAKE_FEED_SYNC_POLL_INTERVAL_MS = 2500', $source);
        $this->assertStringContainsString('地震feed取込', $source);
    }

    private function entry(string $id, string $title): EarthquakeExtractedEntryDTO
    {
        return new EarthquakeExtractedEntryDTO(
            id: $id,
            title: $title,
            updatedAt: '2026-05-11T08:30:00+09:00',
            publishedAt: '2026-05-11T08:25:00+09:00',
            xmlUrl: 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
            rawCategory: '地震情報 (地震火山関連)',
            rawAuthor: '気象庁',
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
    <id>urn:jma:earthquake:1</id>
    <title>震源・震度に関する情報</title>
    <updated>2026-05-11T08:30:00+09:00</updated>
    <published>2026-05-11T08:25:00+09:00</published>
    <link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml" />
    <category term="地震火山関連" label="地震情報" />
    <author>
      <name>気象庁</name>
    </author>
  </entry>
  <entry>
    <id>urn:jma:volcano:1</id>
    <title>火山の状況に関する解説情報</title>
    <updated>2026-05-11T08:15:00+09:00</updated>
    <published>2026-05-11T08:10:00+09:00</published>
    <link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/20260511081500_0.xml" />
    <category term="火山関連" label="火山情報" />
    <author>
      <name>気象庁</name>
    </author>
  </entry>
</feed>
XML;
    }
}
