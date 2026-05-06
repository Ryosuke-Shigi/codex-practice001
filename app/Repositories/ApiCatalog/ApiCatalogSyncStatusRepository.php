<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Models\ApiCatalogSyncRun;
use Carbon\CarbonInterface;

class ApiCatalogSyncStatusRepository implements ApiCatalogSyncStatusRepositoryInterface
{
    public function createQueued(): ApiCatalogSyncRun
    {
        return ApiCatalogSyncRun::query()->create([
            'status' => ApiCatalogSyncStatusDTO::STATUS_QUEUED,
        ]);
    }

    public function markRunning(int $syncRunId, CarbonInterface $startedAt): void
    {
        ApiCatalogSyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => ApiCatalogSyncStatusDTO::STATUS_RUNNING,
                'started_at' => $startedAt->toDateTimeString(),
                'finished_at' => null,
                'error_message' => null,
            ]);
    }

    public function markCompleted(
        int $syncRunId,
        ApiCatalogSyncResultDTO $result,
        CarbonInterface $finishedAt,
    ): void {
        ApiCatalogSyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => ApiCatalogSyncStatusDTO::STATUS_COMPLETED,
                'total_count' => $result->totalCount,
                'inserted_count' => $result->insertedCount,
                'updated_count' => $result->updatedCount,
                'skipped_count' => $result->skippedCount,
                'inactive_count' => $result->inactiveCount,
                'failed_count' => $result->failedCount,
                'error_message' => null,
                'finished_at' => $finishedAt->toDateTimeString(),
            ]);
    }

    public function markFailed(
        int $syncRunId,
        string $errorMessage,
        CarbonInterface $finishedAt,
        int $failedCount,
    ): void {
        ApiCatalogSyncRun::query()
            ->whereKey($syncRunId)
            ->update([
                'status' => ApiCatalogSyncStatusDTO::STATUS_FAILED,
                'failed_count' => $failedCount,
                'error_message' => mb_strcut($errorMessage, 0, 2000, 'UTF-8'),
                'finished_at' => $finishedAt->toDateTimeString(),
            ]);
    }

    public function findStatusById(int $syncRunId): ?ApiCatalogSyncStatusDTO
    {
        $syncRun = ApiCatalogSyncRun::query()->find($syncRunId);

        return $syncRun instanceof ApiCatalogSyncRun
            ? ApiCatalogSyncStatusDTO::fromModel($syncRun)
            : null;
    }

    public function findLatestStatus(): ?ApiCatalogSyncStatusDTO
    {
        $syncRun = ApiCatalogSyncRun::query()
            ->latest('id')
            ->first();

        return $syncRun instanceof ApiCatalogSyncRun
            ? ApiCatalogSyncStatusDTO::fromModel($syncRun)
            : null;
    }
}
