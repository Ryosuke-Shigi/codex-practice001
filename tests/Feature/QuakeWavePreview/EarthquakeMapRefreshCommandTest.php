<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Actions\Earthquake\Commands\StartEarthquakeMapRefreshAction;
use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Jobs\Earthquake\RefreshEarthquakeMapDataJob;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

/**
 * QuakeWave map refresh の Artisan Command が既存Action入口だけを呼ぶことを固定します。
 */
class EarthquakeMapRefreshCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_calls_map_refresh_action_and_outputs_sync_run_ids(): void
    {
        Queue::fake();
        $this->bindMapRefreshActionWithFakeRepositories(feedEntrySyncRunId: 101, mapPinSyncRunId: 202);

        $this
            ->artisan('earthquake:refresh-map')
            ->expectsOutput('Earthquake map refresh job dispatched.')
            ->expectsOutput('feedEntrySyncRunId: 101')
            ->expectsOutput('mapPinSyncRunId: 202')
            ->assertExitCode(0);

        Queue::assertPushed(
            RefreshEarthquakeMapDataJob::class,
            fn (RefreshEarthquakeMapDataJob $job): bool => $job->feedEntrySyncRunId === 101
                && $job->mapPinSyncRunId === 202,
        );
    }

    public function test_command_creates_both_pending_runs_and_dispatches_refresh_job(): void
    {
        Queue::fake();

        $this
            ->artisan('earthquake:refresh-map')
            ->expectsOutput('Earthquake map refresh job dispatched.')
            ->expectsOutput('feedEntrySyncRunId: 1')
            ->expectsOutput('mapPinSyncRunId: 1')
            ->assertExitCode(0);

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

    public function test_command_does_not_execute_sync_services_directly(): void
    {
        Queue::fake();
        $this->app->instance(EarthquakeFeedEntrySyncService::class, new class extends EarthquakeFeedEntrySyncService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeFeedEntrySyncResultDTO
            {
                throw new RuntimeException('Command should only dispatch the earthquake map refresh job.');
            }
        });
        $this->app->instance(EarthquakeMapPinBuildService::class, new class extends EarthquakeMapPinBuildService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
            {
                throw new RuntimeException('Command should only dispatch the earthquake map refresh job.');
            }
        });

        $this
            ->artisan('earthquake:refresh-map')
            ->expectsOutput('Earthquake map refresh job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(RefreshEarthquakeMapDataJob::class);
    }

    private function bindMapRefreshActionWithFakeRepositories(int $feedEntrySyncRunId, int $mapPinSyncRunId): void
    {
        $feedEntrySyncRunRepository = new class($feedEntrySyncRunId) implements EarthquakeFeedEntrySyncRunRepositoryInterface
        {
            public function __construct(private readonly int $syncRunId) {}

            public function isStorageReady(): bool
            {
                return true;
            }

            public function createPending(): int
            {
                return $this->syncRunId;
            }

            public function markRunning(int $syncRunId): void {}

            public function markCompleted(int $syncRunId, EarthquakeFeedEntrySyncResultDTO $result): void {}

            public function markFailed(int $syncRunId, string $message): void {}

            public function findResult(int $syncRunId): ?EarthquakeFeedEntrySyncResultDTO
            {
                return null;
            }

            public function latest(int $limit = 10): array
            {
                return [];
            }
        };
        $mapPinSyncRunRepository = new class($mapPinSyncRunId) implements EarthquakeMapPinSyncRunRepositoryInterface
        {
            public function __construct(private readonly int $syncRunId) {}

            public function isStorageReady(): bool
            {
                return true;
            }

            public function createPending(): int
            {
                return $this->syncRunId;
            }

            public function markRunning(int $syncRunId): void {}

            public function markCompleted(int $syncRunId, EarthquakeMapPinSyncResultDTO $result): void {}

            public function markFailed(int $syncRunId, string $message): void {}

            public function findResult(int $syncRunId): ?EarthquakeMapPinSyncResultDTO
            {
                return null;
            }

            public function latest(int $limit = 10): array
            {
                return [];
            }
        };
        $mapPinRepository = new class implements EarthquakeMapPinRepositoryInterface
        {
            public function isStorageReady(): bool
            {
                return true;
            }

            public function upsertFromMapPins(EarthquakeMapPinListDTO $pins): array
            {
                return [
                    'totalCount' => 0,
                    'insertedCount' => 0,
                    'updatedCount' => 0,
                    'skippedCount' => 0,
                    'failedCount' => 0,
                    'failedSourceEntryIds' => [],
                ];
            }

            public function latest(int $limit = 50): array
            {
                return [];
            }

            public function deleteBySourceEntryId(int $sourceEntryId): void {}

            public function toMapPinListDTO(EarthquakeMapPinListQueryDTO $query): EarthquakeMapPinListDTO
            {
                return new EarthquakeMapPinListDTO([]);
            }
        };

        $this->app->instance(
            StartEarthquakeMapRefreshAction::class,
            new StartEarthquakeMapRefreshAction(
                $feedEntrySyncRunRepository,
                $mapPinSyncRunRepository,
                $mapPinRepository,
            ),
        );
    }
}
