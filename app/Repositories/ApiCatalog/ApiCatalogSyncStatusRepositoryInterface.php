<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Models\ApiCatalogSyncRun;
use Carbon\CarbonInterface;

interface ApiCatalogSyncStatusRepositoryInterface
{
    public function createQueued(): ApiCatalogSyncRun;

    public function markRunning(int $syncRunId, CarbonInterface $startedAt): void;

    public function markCompleted(
        int $syncRunId,
        ApiCatalogSyncResultDTO $result,
        CarbonInterface $finishedAt,
    ): void;

    public function markFailed(
        int $syncRunId,
        string $errorMessage,
        CarbonInterface $finishedAt,
        int $failedCount,
    ): void;

    public function findStatusById(int $syncRunId): ?ApiCatalogSyncStatusDTO;

    public function findLatestStatus(): ?ApiCatalogSyncStatusDTO;
}
