<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\Models\EarthquakeFeedEntrySyncRun;
use Illuminate\Support\Facades\Schema;

class EarthquakeFeedEntrySyncRunRepository implements EarthquakeFeedEntrySyncRunRepositoryInterface
{
    private const TABLE = 'earthquake_feed_entry_sync_runs';

    public function isStorageReady(): bool
    {
        return Schema::hasTable(self::TABLE);
    }

    public function createPending(): int
    {
        $syncRun = EarthquakeFeedEntrySyncRun::query()->create([
            'status' => EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING,
        ]);

        return (int) $syncRun->getKey();
    }

    public function markRunning(int $syncRunId): void
    {
        if (! $this->isStorageReady()) {
            return;
        }

        EarthquakeFeedEntrySyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => EarthquakeFeedEntrySyncResultDTO::STATUS_RUNNING,
                'started_at' => now()->toDateTimeString(),
                'finished_at' => null,
                'error_message' => null,
            ]);
    }

    public function markCompleted(int $syncRunId, EarthquakeFeedEntrySyncResultDTO $result): void
    {
        if (! $this->isStorageReady()) {
            return;
        }

        EarthquakeFeedEntrySyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => EarthquakeFeedEntrySyncResultDTO::STATUS_COMPLETED,
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

        EarthquakeFeedEntrySyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => EarthquakeFeedEntrySyncResultDTO::STATUS_FAILED,
                'failed_count' => 1,
                'error_message' => mb_strcut($message, 0, 2000, 'UTF-8'),
                'finished_at' => now()->toDateTimeString(),
            ]);
    }

    public function findResult(int $syncRunId): ?EarthquakeFeedEntrySyncResultDTO
    {
        if (! $this->isStorageReady()) {
            return null;
        }

        $syncRun = EarthquakeFeedEntrySyncRun::query()->find($syncRunId);

        return $syncRun instanceof EarthquakeFeedEntrySyncRun
            ? EarthquakeFeedEntrySyncResultDTO::fromModel($syncRun)
            : null;
    }

    /**
     * @return array<int, EarthquakeFeedEntrySyncResultDTO>
     */
    public function latest(int $limit = 10): array
    {
        if (! $this->isStorageReady()) {
            return [];
        }

        return EarthquakeFeedEntrySyncRun::query()
            ->latest('id')
            ->limit(max(1, min($limit, 50)))
            ->get()
            ->map(fn (EarthquakeFeedEntrySyncRun $syncRun): EarthquakeFeedEntrySyncResultDTO
                => EarthquakeFeedEntrySyncResultDTO::fromModel($syncRun))
            ->all();
    }
}
