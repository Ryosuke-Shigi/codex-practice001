<?php

namespace Tests\Feature\QuakeWavePreview;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Jobs\Earthquake\RefreshEarthquakeMapDataJob;
use App\Models\EarthquakeMapPin;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeXmlRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class QuakeWaveSyncStatusApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_apis_return_feed_completed_and_map_pin_failed_after_partial_refresh_failure(): void
    {
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
        $job = new RefreshEarthquakeMapDataJob($feedEntrySyncRunId, $mapPinSyncRunId);
        $caughtException = null;

        try {
            $job->handle(
                $feedEntrySyncRunRepository,
                $mapPinSyncRunRepository,
                app(EarthquakeFeedEntrySyncService::class),
                new class extends EarthquakeMapPinBuildService
                {
                    public function __construct()
                    {
                    }

                    public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
                    {
                        throw new RuntimeException('map pin generation failed');
                    }
                },
            );

            $this->fail('Map pin generation failure should be rethrown.');
        } catch (RuntimeException $exception) {
            $caughtException = $exception;
        }

        $this->assertNotNull($caughtException);
        $job->failed($caughtException);

        $feedResponse = $this->getJson(route('quakewave-preview.feed-entries.sync.status', [
            'syncRunId' => $feedEntrySyncRunId,
        ]));
        $mapPinResponse = $this->getJson(route('quakewave-preview.map-pins.sync.status', [
            'syncRunId' => $mapPinSyncRunId,
        ]));

        $feedResponse
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $feedEntrySyncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED)
            ->assertJsonPath('syncStatus.isRunning', false)
            ->assertJsonPath('syncStatus.totalCount', 1)
            ->assertJsonPath('syncStatus.insertedCount', 1)
            ->assertJsonPath('syncStatus.updatedCount', 0)
            ->assertJsonPath('syncStatus.skippedCount', 0)
            ->assertJsonPath('syncStatus.failedCount', 0)
            ->assertJsonPath('syncStatus.errorMessage', null);

        $mapPinResponse
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $mapPinSyncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeMapPinSyncResultDTO::STATUS_FAILED)
            ->assertJsonPath('syncStatus.isRunning', false)
            ->assertJsonPath('syncStatus.totalCount', 0)
            ->assertJsonPath('syncStatus.insertedCount', 0)
            ->assertJsonPath('syncStatus.updatedCount', 0)
            ->assertJsonPath('syncStatus.skippedCount', 0)
            ->assertJsonPath('syncStatus.failedCount', 1)
            ->assertJsonPath('syncStatus.errorMessage', 'map pin generation failed');

        $this->assertStatusJsonShape($feedResponse->json());
        $this->assertStatusJsonShape($mapPinResponse->json());
        $this->assertIsString($feedResponse->json('syncStatus.startedAt'));
        $this->assertIsString($feedResponse->json('syncStatus.finishedAt'));
        $this->assertIsString($mapPinResponse->json('syncStatus.startedAt'));
        $this->assertIsString($mapPinResponse->json('syncStatus.finishedAt'));
        $this->assertSame(
            EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
            $feedResponse->json('syncStatus.status'),
        );
        $this->assertSame(
            EarthquakeMapPinSyncResultDTO::STATUS_FAILED,
            $mapPinResponse->json('syncStatus.status'),
        );
        $this->assertDatabaseHas('earthquake_feed_entries', [
            'entry_id' => 'urn:jma:earthquake:status-api',
        ]);
        $this->assertDatabaseCount('earthquake_map_pins', 0);
        $this->assertSame(0, EarthquakeMapPin::query()->count());
    }

    public function test_status_apis_return_null_sync_status_without_sync_run_id(): void
    {
        $feedResponse = $this->getJson(route('quakewave-preview.feed-entries.sync.status'));
        $mapPinResponse = $this->getJson(route('quakewave-preview.map-pins.sync.status'));

        $feedResponse
            ->assertOk()
            ->assertExactJson([
                'syncStatus' => null,
            ]);
        $mapPinResponse
            ->assertOk()
            ->assertExactJson([
                'syncStatus' => null,
            ]);
    }

    public function test_status_apis_return_pending_status_with_running_flag_and_initial_counts(): void
    {
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();

        $feedResponse = $this->getJson(route('quakewave-preview.feed-entries.sync.status', [
            'syncRunId' => $feedEntrySyncRunId,
        ]));
        $mapPinResponse = $this->getJson(route('quakewave-preview.map-pins.sync.status', [
            'syncRunId' => $mapPinSyncRunId,
        ]));

        $feedResponse
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $feedEntrySyncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING)
            ->assertJsonPath('syncStatus.isRunning', true)
            ->assertJsonPath('syncStatus.totalCount', 0)
            ->assertJsonPath('syncStatus.insertedCount', 0)
            ->assertJsonPath('syncStatus.updatedCount', 0)
            ->assertJsonPath('syncStatus.skippedCount', 0)
            ->assertJsonPath('syncStatus.failedCount', 0)
            ->assertJsonPath('syncStatus.errorMessage', null)
            ->assertJsonPath('syncStatus.startedAt', null)
            ->assertJsonPath('syncStatus.finishedAt', null);
        $mapPinResponse
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $mapPinSyncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeMapPinSyncResultDTO::STATUS_PENDING)
            ->assertJsonPath('syncStatus.isRunning', true)
            ->assertJsonPath('syncStatus.totalCount', 0)
            ->assertJsonPath('syncStatus.insertedCount', 0)
            ->assertJsonPath('syncStatus.updatedCount', 0)
            ->assertJsonPath('syncStatus.skippedCount', 0)
            ->assertJsonPath('syncStatus.failedCount', 0)
            ->assertJsonPath('syncStatus.errorMessage', null)
            ->assertJsonPath('syncStatus.startedAt', null)
            ->assertJsonPath('syncStatus.finishedAt', null);

        $this->assertStatusJsonShape($feedResponse->json());
        $this->assertStatusJsonShape($mapPinResponse->json());
    }

    public function test_status_apis_return_running_status_with_running_flag_and_initial_counts(): void
    {
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $feedEntrySyncRunId = $feedEntrySyncRunRepository->createPending();
        $mapPinSyncRunId = $mapPinSyncRunRepository->createPending();
        $feedEntrySyncRunRepository->markRunning($feedEntrySyncRunId);
        $mapPinSyncRunRepository->markRunning($mapPinSyncRunId);

        $feedResponse = $this->getJson(route('quakewave-preview.feed-entries.sync.status', [
            'syncRunId' => $feedEntrySyncRunId,
        ]));
        $mapPinResponse = $this->getJson(route('quakewave-preview.map-pins.sync.status', [
            'syncRunId' => $mapPinSyncRunId,
        ]));

        $feedResponse
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $feedEntrySyncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeFeedEntrySyncResultDTO::STATUS_RUNNING)
            ->assertJsonPath('syncStatus.isRunning', true)
            ->assertJsonPath('syncStatus.totalCount', 0)
            ->assertJsonPath('syncStatus.insertedCount', 0)
            ->assertJsonPath('syncStatus.updatedCount', 0)
            ->assertJsonPath('syncStatus.skippedCount', 0)
            ->assertJsonPath('syncStatus.failedCount', 0)
            ->assertJsonPath('syncStatus.errorMessage', null)
            ->assertJsonPath('syncStatus.finishedAt', null);
        $mapPinResponse
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $mapPinSyncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeMapPinSyncResultDTO::STATUS_RUNNING)
            ->assertJsonPath('syncStatus.isRunning', true)
            ->assertJsonPath('syncStatus.totalCount', 0)
            ->assertJsonPath('syncStatus.insertedCount', 0)
            ->assertJsonPath('syncStatus.updatedCount', 0)
            ->assertJsonPath('syncStatus.skippedCount', 0)
            ->assertJsonPath('syncStatus.failedCount', 0)
            ->assertJsonPath('syncStatus.errorMessage', null)
            ->assertJsonPath('syncStatus.finishedAt', null);

        $this->assertStatusJsonShape($feedResponse->json());
        $this->assertStatusJsonShape($mapPinResponse->json());
        $this->assertIsString($feedResponse->json('syncStatus.startedAt'));
        $this->assertIsString($mapPinResponse->json('syncStatus.startedAt'));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertStatusJsonShape(array $payload): void
    {
        $this->assertSame(['syncStatus'], array_keys($payload));
        $this->assertIsArray($payload['syncStatus']);
        $this->assertSame([
            'syncRunId',
            'status',
            'isRunning',
            'totalCount',
            'insertedCount',
            'updatedCount',
            'skippedCount',
            'failedCount',
            'errorMessage',
            'startedAt',
            'finishedAt',
        ], array_keys($payload['syncStatus']));
    }

    private function atomFeed(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>JMA Earthquake and Volcano Feed</title>
  <updated>2026-05-11T08:30:00+09:00</updated>
  <entry>
    <id>urn:jma:earthquake:status-api</id>
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
