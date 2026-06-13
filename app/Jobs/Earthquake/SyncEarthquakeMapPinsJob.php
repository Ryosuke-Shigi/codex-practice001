<?php

namespace App\Jobs\Earthquake;

use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Japan Quake Wave Map の map pin 生成を Queue で実行する Job です。
 *
 * POST 入口で作成された syncRunId を受け取り、状態遷移と Service 呼び出しだけを担当します。
 * 個別XML取得、解析、pin生成可否、DB保存条件は Service / Repository に置きます。
 */
class SyncEarthquakeMapPinsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public bool $failOnTimeout = true;

    public function __construct(
        public readonly int $syncRunId,
    ) {}

    /**
     * map pin 同期 run を running へ進め、生成 Service の結果を完了状態として保存します。
     */
    public function handle(
        EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
        EarthquakeMapPinBuildService $buildService,
    ): void {
        /*
         * Job は Queue worker が実行する入口だけを担当します。
         * 個別XML取得、XML解析、DTO化、upsert の詳細は Service / Repository へ委譲します。
         *
         * pending -> running は worker がJobを拾った事実を表します。
         * React polling はこの段階遷移を見ることで「POSTは成功したがworker待ち」なのか
         * 「workerが処理中」なのかを区別できます。
         */
        $syncRunRepository->markRunning($this->syncRunId);

        try {
            $result = $buildService->sync($this->syncRunId);
        } catch (Throwable $exception) {
            $syncRunRepository->markFailed($this->syncRunId, $exception->getMessage());

            throw $exception;
        }

        $syncRunRepository->markCompleted($this->syncRunId, $result);
    }

    /**
     * handle() を通らない失敗でも polling 用の終端状態を残します。
     */
    public function failed(?Throwable $exception): void
    {
        /*
         * timeout やコンテナ停止などは handle() の catch を通らない場合があります。
         * failed hook 側でも終端状態を書いておかないと、画面は pending/running を
         * 見続けてしまうため、ここでも failed を保存します。
         */
        $syncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);

        if (! $syncRunRepository->isStorageReady()) {
            return;
        }

        $syncRunRepository->markFailed(
            $this->syncRunId,
            $exception?->getMessage() ?: 'Earthquake map pin sync job failed.',
        );
    }
}
