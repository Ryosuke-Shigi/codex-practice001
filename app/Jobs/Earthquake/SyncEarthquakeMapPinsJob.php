<?php

namespace App\Jobs\Earthquake;

use App\Actions\Earthquake\Commands\RunEarthquakeMapPinSyncAction;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Japan Quake Wave Map の map pin 生成を Queue で実行する Job です。
 *
 * POST 入口で作成された syncRunId を実行用 Action へ渡します。
 * 個別XML取得、解析、pin生成可否、DB保存条件、状態反映手順は Job に置きません。
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
     * map pin 同期 run の実行を Command Action へ委譲します。
     */
    public function handle(RunEarthquakeMapPinSyncAction $action): void
    {
        /*
         * Job は Queue worker が拾った事実と payload を Action へ渡す入口に留めます。
         * pending -> running 以降の状態遷移は Action 側で固定します。
         */
        $action->execute($this->syncRunId);
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
