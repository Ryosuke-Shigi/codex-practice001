<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Models\ApiCatalogSyncRun;
use Carbon\CarbonInterface;

/**
 * APIカタログ同期 run の状態保存に必要な Repository 契約です。
 *
 * Controller / Action はこの契約を通じて status を扱い、Eloquent model や Schema 確認の詳細へ依存しません。
 */
interface ApiCatalogSyncStatusRepositoryInterface
{
    public function isStorageReady(): bool;

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
