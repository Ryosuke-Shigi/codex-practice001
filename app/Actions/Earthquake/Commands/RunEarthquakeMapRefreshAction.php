<?php

namespace App\Actions\Earthquake\Commands;

use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use Throwable;

/**
 * Queue 上で QuakeWave Map の統合更新 run を実行する Command Action です。
 *
 * feed entry 同期を完了させてから map pin 生成へ進めます。
 * Job はこの Action を呼ぶ入口に留め、実行手順と失敗時の状態反映をここへ集約します。
 */
final readonly class RunEarthquakeMapRefreshAction
{
    public function __construct(
        private RunEarthquakeFeedEntrySyncAction $feedEntrySyncAction,
        private RunEarthquakeMapPinSyncAction $mapPinSyncAction,
        private EarthquakeMapPinSyncRunRepositoryInterface $mapPinSyncRunRepository,
    ) {}

    public function execute(int $feedEntrySyncRunId, int $mapPinSyncRunId): void
    {
        try {
            $feedEntrySyncResult = $this->feedEntrySyncAction->execute($feedEntrySyncRunId);
        } catch (Throwable $exception) {
            $this->mapPinSyncRunRepository->markFailed(
                $mapPinSyncRunId,
                'Feed entry sync failed before map pin generation: '.$exception->getMessage(),
            );

            throw $exception;
        }

        $this->mapPinSyncAction->executeEntries(
            $mapPinSyncRunId,
            $feedEntrySyncResult->changedEntryIds,
        );
    }
}
