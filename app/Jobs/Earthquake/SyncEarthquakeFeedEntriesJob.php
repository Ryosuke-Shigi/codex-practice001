<?php

namespace App\Jobs\Earthquake;

use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Services\Earthquake\EarthquakeFeedEntrySyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SyncEarthquakeFeedEntriesJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public bool $failOnTimeout = true;

    public function __construct(
        public readonly int $syncRunId,
    ) {}

    public function handle(
        EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
        EarthquakeFeedEntrySyncService $syncService,
    ): void {
        /*
         * Job は非同期実行の入口だけを担当します。
         * XML解析やDB upsert詳細は Service / Repository へ委譲します。
         *
         * running への状態更新は Service 実行前に行います。
         * これにより React polling は「Queue worker が拾ったか」と「同期本体が終わったか」を
         * pending / running / completed / failed の段階として追えます。
         */
        $syncRunRepository->markRunning($this->syncRunId);

        try {
            $result = $syncService->sync($this->syncRunId);
        } catch (Throwable $exception) {
            $syncRunRepository->markFailed($this->syncRunId, $exception->getMessage());

            throw $exception;
        }

        $syncRunRepository->markCompleted($this->syncRunId, $result);
    }

    public function failed(?Throwable $exception): void
    {
        /*
         * timeout や worker 側の失敗は handle() の catch を通らないことがあります。
         * failed hook でも終端状態を書いておくことで、画面の polling が running を
         * 見続ける状態を避けます。
         */
        $syncRunRepository = app(EarthquakeFeedEntrySyncRunRepositoryInterface::class);

        if (! $syncRunRepository->isStorageReady()) {
            return;
        }

        $syncRunRepository->markFailed(
            $this->syncRunId,
            $exception?->getMessage() ?: 'Earthquake feed entry sync job failed.',
        );
    }
}
