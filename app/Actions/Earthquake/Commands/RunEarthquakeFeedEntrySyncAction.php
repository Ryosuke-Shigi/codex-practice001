<?php

namespace App\Actions\Earthquake\Commands;

use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use Throwable;

/**
 * Queue 上で feed entry 同期 run を実行する Command Action です。
 *
 * Job から呼ばれ、run 状態更新と同期 Service の結果反映を担当します。
 * Atom feed 取得、entry 抽出、DB upsert の詳細は Service / Repository 側へ残します。
 */
final readonly class RunEarthquakeFeedEntrySyncAction
{
    public function __construct(
        private EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
        private EarthquakeFeedEntrySyncService $syncService,
    ) {}

    public function execute(int $syncRunId): void
    {
        $this->syncRunRepository->markRunning($syncRunId);

        try {
            $result = $this->syncService->sync($syncRunId);
        } catch (Throwable $exception) {
            $this->syncRunRepository->markFailed($syncRunId, $exception->getMessage());

            throw $exception;
        }

        $this->syncRunRepository->markCompleted($syncRunId, $result);
    }
}
