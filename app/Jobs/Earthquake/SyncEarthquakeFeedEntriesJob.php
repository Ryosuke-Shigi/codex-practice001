<?php

namespace App\Jobs\Earthquake;

use App\Actions\Earthquake\Commands\RunEarthquakeFeedEntrySyncAction;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Japan Quake Wave Map の Atom feed entry 同期を Queue で実行する Job です。
 *
 * HTTP 入口から受け取った syncRunId を実行用 Action へ渡します。
 * Job へ XML 解析や entry upsert 条件、状態反映手順を置かないことで、再実行時の境界を読みやすくします。
 */
class SyncEarthquakeFeedEntriesJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public bool $failOnTimeout = true;

    public function __construct(
        public readonly int $syncRunId,
    ) {}

    /**
     * feed entry 同期 run の実行を Command Action へ委譲します。
     */
    public function handle(RunEarthquakeFeedEntrySyncAction $action): void
    {
        /*
         * Job は Queue worker が拾った事実と payload を Action へ渡す入口に留めます。
         * pending / running / completed / failed の状態遷移は Action 側で固定します。
         */
        $action->execute($this->syncRunId);
    }

    /**
     * timeout など handle() 外の失敗でも status API が終端状態を返せるようにします。
     */
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
