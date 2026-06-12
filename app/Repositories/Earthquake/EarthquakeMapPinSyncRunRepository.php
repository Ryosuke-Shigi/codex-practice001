<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Models\EarthquakeMapPinSyncRun;
use Illuminate\Support\Facades\Schema;

class EarthquakeMapPinSyncRunRepository implements EarthquakeMapPinSyncRunRepositoryInterface
{
    private const TABLE = 'earthquake_map_pin_sync_runs';

    public function isStorageReady(): bool
    {
        return Schema::hasTable(self::TABLE);
    }

    public function createPending(): int
    {
        $syncRun = EarthquakeMapPinSyncRun::query()->create([
            'status' => EarthquakeMapPinSyncResultDTO::STATUS_PENDING,
        ]);

        return (int) $syncRun->getKey();
    }

    public function markRunning(int $syncRunId): void
    {
        if (! $this->isStorageReady()) {
            return;
        }

        EarthquakeMapPinSyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => EarthquakeMapPinSyncResultDTO::STATUS_RUNNING,
                'started_at' => now()->toDateTimeString(),
                'finished_at' => null,
                'error_message' => null,
            ]);
    }

    public function markCompleted(int $syncRunId, EarthquakeMapPinSyncResultDTO $result): void
    {
        if (! $this->isStorageReady()) {
            return;
        }

        EarthquakeMapPinSyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                'total_count' => $result->totalCount,
                'inserted_count' => $result->insertedCount,
                'updated_count' => $result->updatedCount,
                'skipped_count' => $result->skippedCount,
                'failed_count' => $result->failedCount,
                'error_message' => null,
                'finished_at' => ($result->finishedAt ?? now())->toDateTimeString(),
            ]);
    }

    public function markFailed(int $syncRunId, string $message): void
    {
        if (! $this->isStorageReady()) {
            return;
        }

        EarthquakeMapPinSyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => EarthquakeMapPinSyncResultDTO::STATUS_FAILED,
                'failed_count' => 1,
                'error_message' => mb_strcut($message, 0, 2000, 'UTF-8'),
                'finished_at' => now()->toDateTimeString(),
            ]);
    }

    public function findResult(int $syncRunId): ?EarthquakeMapPinSyncResultDTO
    {
        if (! $this->isStorageReady()) {
            return null;
        }

        $syncRun = EarthquakeMapPinSyncRun::query()->find($syncRunId);

        return $syncRun instanceof EarthquakeMapPinSyncRun
            ? EarthquakeMapPinSyncResultDTO::fromModel($syncRun)
            : null;
    }

    /**
     * @return array<int, EarthquakeMapPinSyncResultDTO>
     */
    public function latest(int $limit = 10): array
    {
        if (! $this->isStorageReady()) {
            return [];
        }

        return EarthquakeMapPinSyncRun::query()
            ->latest('id')
            ->limit(max(1, min($limit, 50)))
            ->get()
            ->map(fn (EarthquakeMapPinSyncRun $syncRun): EarthquakeMapPinSyncResultDTO => EarthquakeMapPinSyncResultDTO::fromModel($syncRun))
            ->all();
    }
}
