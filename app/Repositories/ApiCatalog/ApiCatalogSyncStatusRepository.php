<?php

namespace App\Repositories\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Models\ApiCatalogSyncRun;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Schema;

/**
 * APIカタログ同期 run の状態保存境界を担当する Repository です。
 *
 * status table の存在確認、作成、更新、取得を扱います。
 * 同期件数の意味づけや Queue 投入判断は Action / Service 側へ置きます。
 */
class ApiCatalogSyncStatusRepository implements ApiCatalogSyncStatusRepositoryInterface
{
    private const TABLE = 'api_catalog_sync_runs';

    public function isStorageReady(): bool
    {
        /*
         * 新しい状態表示コードが本番に先に反映され、migration が後から適用される運用を許容します。
         * Repository 境界でテーブル存在確認を集約し、Controller / Action / React に
         * MySQL の 42S02 例外や Schema 確認の都合を漏らさないようにします。
         */
        return Schema::hasTable(self::TABLE);
    }

    public function createQueued(): ApiCatalogSyncRun
    {
        return ApiCatalogSyncRun::query()->create([
            'status' => ApiCatalogSyncStatusDTO::STATUS_QUEUED,
        ]);
    }

    public function markRunning(int $syncRunId, CarbonInterface $startedAt): void
    {
        /*
         * Job の進行中に deploy / rollback などで DB 状態が揺れても、
         * 状態表示の保存失敗で同期本体まで巻き込まないためのガードです。
         */
        if (! $this->isStorageReady()) {
            return;
        }

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
        if (! $this->isStorageReady()) {
            return;
        }

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
        if (! $this->isStorageReady()) {
            return;
        }

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
        if (! $this->isStorageReady()) {
            return null;
        }

        $syncRun = ApiCatalogSyncRun::query()->find($syncRunId);

        return $syncRun instanceof ApiCatalogSyncRun
            ? ApiCatalogSyncStatusDTO::fromModel($syncRun)
            : null;
    }

    public function findLatestStatus(): ?ApiCatalogSyncStatusDTO
    {
        if (! $this->isStorageReady()) {
            return null;
        }

        $syncRun = ApiCatalogSyncRun::query()
            ->latest('id')
            ->first();

        return $syncRun instanceof ApiCatalogSyncRun
            ? ApiCatalogSyncStatusDTO::fromModel($syncRun)
            : null;
    }
}
