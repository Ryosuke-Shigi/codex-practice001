<?php

namespace App\Jobs\Earthquake;

use App\Actions\Earthquake\Commands\RunEarthquakeMapRefreshAction;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Throwable;

/**
 * QuakeWave Map の統合更新を Queue 上で順番に実行する Job です。
 *
 * 2つの syncRunId を実行用 Action へ渡します。
 * feed entry 同期から map pin 生成へ進める手順は Action へ置き、Job は Queue 実行入口に留めます。
 * 共有lockの取得待ちは30秒後に再投入し、実処理で例外が起きた場合だけ1回でfailedにします。
 */
class RefreshEarthquakeMapDataJob implements ShouldQueue
{
    use Queueable;

    /*
     * WithoutOverlappingによるreleaseもQueueのattemptsを消費します。
     * 重複待機だけでMaxAttemptsExceededExceptionにしないようattempt上限は設けず、
     * 実処理例外の再試行可否はmaxExceptionsで分離します。
     */
    public int $tries = 0;

    public int $maxExceptions = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public function __construct(
        public readonly int $feedEntrySyncRunId,
        public readonly int $mapPinSyncRunId,
    ) {}

    /**
     * @return array<int, WithoutOverlapping>
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping('earthquake-map-refresh'))
                ->shared()
                ->releaseAfter(30)
                ->expireAfter($this->timeout + 60),
        ];
    }

    public function handle(RunEarthquakeMapRefreshAction $action): void
    {
        /*
         * Job payload は2つのsyncRunIdだけです。
         * XML取得、解析、DB保存、状態run更新の手順は Action / Service / Repository へ委譲します。
         */
        $action->execute($this->feedEntrySyncRunId, $this->mapPinSyncRunId);
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
