<?php

namespace App\Jobs\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class RefreshEarthquakeMapDataJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public function __construct(
        public readonly int $feedEntrySyncRunId,
        public readonly int $mapPinSyncRunId,
    ) {
    }

    public function handle(
        EarthquakeFeedEntrySyncRunRepositoryInterface $feedEntrySyncRunRepository,
        EarthquakeMapPinSyncRunRepositoryInterface $mapPinSyncRunRepository,
        EarthquakeFeedEntrySyncService $feedEntrySyncService,
        EarthquakeMapPinBuildService $mapPinBuildService,
    ): void {
        /*
         * 1ボタン更新でも、業務手順は既存Serviceに分けたまま順番だけをJobで束ねます。
         * 先にAtom feed entryをDBへupsertし、その完了後に保存済みentryのxml_urlから
         * map pinを生成します。XML解析やDB保存の詳細はここには書きません。
         */
        try {
            $feedEntrySyncRunRepository->markRunning($this->feedEntrySyncRunId);
            $feedResult = $feedEntrySyncService->sync($this->feedEntrySyncRunId);
            $feedEntrySyncRunRepository->markCompleted($this->feedEntrySyncRunId, $feedResult);
        } catch (Throwable $exception) {
            $feedEntrySyncRunRepository->markFailed($this->feedEntrySyncRunId, $exception->getMessage());
            $mapPinSyncRunRepository->markFailed(
                $this->mapPinSyncRunId,
                'Feed entry sync failed before map pin generation: '.$exception->getMessage(),
            );

            throw $exception;
        }

        try {
            $mapPinSyncRunRepository->markRunning($this->mapPinSyncRunId);
            $mapResult = $mapPinBuildService->sync($this->mapPinSyncRunId);
            $mapPinSyncRunRepository->markCompleted($this->mapPinSyncRunId, $mapResult);
        } catch (Throwable $exception) {
            $mapPinSyncRunRepository->markFailed($this->mapPinSyncRunId, $exception->getMessage());

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        /*
         * timeoutやworker停止ではhandle()内のcatchを通らない場合があります。
         * ただしfeedだけ完了してmap側で失敗したケースを上書きしないよう、
         * まだpending/runningのrunだけをfailedへ倒します。
         */
        $feedEntrySyncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);
        $mapPinSyncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $message = $exception?->getMessage() ?: 'Earthquake map refresh job failed.';

        if ($feedEntrySyncRunRepository->isStorageReady()) {
            $feedStatus = $feedEntrySyncRunRepository->findResult($this->feedEntrySyncRunId);

            if (
                $feedStatus !== null
                && in_array(
                    $feedStatus->status,
                    [
                        EarthquakeFeedEntrySyncResultDTO::STATUS_PENDING,
                        EarthquakeFeedEntrySyncResultDTO::STATUS_RUNNING,
                    ],
                    true,
                )
            ) {
                $feedEntrySyncRunRepository->markFailed($this->feedEntrySyncRunId, $message);
            }
        }

        if ($mapPinSyncRunRepository->isStorageReady()) {
            $mapStatus = $mapPinSyncRunRepository->findResult($this->mapPinSyncRunId);

            if (
                $mapStatus !== null
                && in_array(
                    $mapStatus->status,
                    [
                        EarthquakeMapPinSyncResultDTO::STATUS_PENDING,
                        EarthquakeMapPinSyncResultDTO::STATUS_RUNNING,
                    ],
                    true,
                )
            ) {
                $mapPinSyncRunRepository->markFailed($this->mapPinSyncRunId, $message);
            }
        }
    }
}
