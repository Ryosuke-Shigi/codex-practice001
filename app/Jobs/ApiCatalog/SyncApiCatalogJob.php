<?php

namespace App\Jobs\ApiCatalog;

use App\Actions\ApiCatalog\Commands\SyncApiCatalogAction;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * APIカタログ同期を Queue worker で実行する Job です。
 *
 * 状態runを running / completed / failed へ更新しながら SyncApiCatalogAction を呼びます。
 * APIs.guru payload の解釈や cache 更新判断は Action / Service 側へ委譲します。
 */
class SyncApiCatalogJob implements ShouldQueue
{
    use Queueable;

    /*
     * APIs.guru list.json の同期は、同じデータソースに対する一括更新です。
     * 自動リトライで同じ同期レコードを何度も running に戻すより、失敗を画面に出して
     * 人間が worker / network / upstream 状態を確認できる方を優先します。
     */
    public int $tries = 1;

    /*
     * Docker 側の queue worker は --timeout=120 で起動される構成もありますが、
     * Job 自身にも明示的な上限を持たせておくと、worker 設定が変わっても
     * 「永久に running」の状態を避けやすくなります。
     */
    public int $timeout = 900;

    /*
     * timeout を failed 扱いにしないと、画面上は running のまま残る可能性があります。
     * failed hook で api_catalog_sync_runs を failed に更新し、ポーリングが停止できるようにします。
     */
    public bool $failOnTimeout = true;

    public function __construct(
        public readonly ?int $syncRunId = null,
    ) {}

    public function handle(
        SyncApiCatalogAction $action,
        ApiCatalogSyncStatusRepositoryInterface $statusRepository,
    ): void {
        /*
         * deploy 直後など、migration 未適用で状態テーブルが存在しない場合の保険です。
         * 状態表示は無効になりますが、従来の同期本体は止めずに実行します。
         */
        if (! $statusRepository->isStorageReady()) {
            $action->execute();

            return;
        }

        $syncRunId = $this->syncRunId ?? (int) $statusRepository->createQueued()->getKey();
        $statusRepository->markRunning($syncRunId, CarbonImmutable::now());

        try {
            $result = $action->execute();
        } catch (Throwable $exception) {
            $statusRepository->markFailed($syncRunId, $exception->getMessage(), CarbonImmutable::now(), 1);

            throw $exception;
        }

        $statusRepository->markCompleted($syncRunId, $result, CarbonImmutable::now());
    }

    public function failed(?Throwable $exception): void
    {
        /*
         * failed() は handle() の catch を通らない失敗でも呼ばれます。
         * 例: worker timeout、プロセス kill、Laravel Queue 側での失敗確定。
         * ここで終端状態を書いておかないと、React ポーリングは running を見続けます。
         */
        if ($this->syncRunId === null) {
            return;
        }

        $statusRepository = app(ApiCatalogSyncStatusRepositoryInterface::class);

        if (! $statusRepository->isStorageReady()) {
            return;
        }

        $statusRepository->markFailed(
            $this->syncRunId,
            $exception?->getMessage() ?: 'API catalog sync job failed.',
            CarbonImmutable::now(),
            1,
        );
    }
}
