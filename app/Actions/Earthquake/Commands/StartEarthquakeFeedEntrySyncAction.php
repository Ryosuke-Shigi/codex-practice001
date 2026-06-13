<?php

namespace App\Actions\Earthquake\Commands;

use App\Jobs\Earthquake\SyncEarthquakeFeedEntriesJob;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use RuntimeException;

/**
 * QuakeWave Preview の feed entry 同期を開始する Command Action です。
 *
 * HTTP 入口から呼ばれ、pending run 作成と Queue Job 投入だけを担当します。
 * Atom feed 取得、entry 抽出、DB upsert は Job / Service / Repository に分けます。
 */
final readonly class StartEarthquakeFeedEntrySyncAction
{
    public function __construct(
        private EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
    ) {}

    /**
     * feed entry 同期 run を作成して Queue に投入し、polling 用 ID を返します。
     *
     * @throws RuntimeException status 保存先の migration が未適用などで同期開始できない場合。
     */
    public function execute(): int
    {
        /*
         * 手動実行でも同期本体をHTTPリクエスト内では実行しません。
         * 状態レコードを pending で作り、実処理は Queue に積んだ Job へ渡します。
         *
         * ここで Service を直接呼ばないのは、画面操作と feed 取得・DB 保存の実行時間を
         * 切り離すためです。HTTP は「同期依頼を受け付けた」時点で返し、React は
         * syncRunId を使って GET の status API だけを polling します。
         */
        if (! $this->syncRunRepository->isStorageReady()) {
            /*
             * ローカル開発や deploy 直後は、コードだけが先に反映されて migration が
             * まだ未適用の状態になり得ます。未作成テーブルへ insert して 500 を返すと
             * 画面側には原因が見えないため、Action 境界で明示的なエラーに変換します。
             */
            throw new RuntimeException('Earthquake feed entry sync storage is not ready. Run migrations.');
        }

        $syncRunId = $this->syncRunRepository->createPending();

        /*
         * Job には syncRunId だけを渡します。
         * XML取得、地震entry抽出、DB upsert の詳細は Service / Repository に置き、
         * Queue payload が HTTP や表示都合を背負わないようにします。
         */
        SyncEarthquakeFeedEntriesJob::dispatch($syncRunId);

        return $syncRunId;
    }
}
