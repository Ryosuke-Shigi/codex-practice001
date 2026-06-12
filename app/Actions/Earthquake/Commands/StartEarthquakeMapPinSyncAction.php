<?php

namespace App\Actions\Earthquake\Commands;

use App\Jobs\Earthquake\SyncEarthquakeMapPinsJob;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use RuntimeException;

final readonly class StartEarthquakeMapPinSyncAction
{
    public function __construct(
        private EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
        private EarthquakeMapPinRepositoryInterface $mapPinRepository,
    ) {}

    public function execute(): int
    {
        /*
         * 手動実行でも map pin 生成本体はHTTPリクエスト内で実行しません。
         * feed entry 取込とは別の同期runを作り、個別XML取得と解析は Queue Job へ渡します。
         *
         * 第2段階では「feed entry 取込」と「map pin 生成」をまだ別ボタンにしています。
         * 将来1つの同期ボタンへ統合する時も、この Action は「map pin生成を開始する」
         * 小さい入口として再利用できるよう、feed entry 同期の開始判断はここへ混ぜません。
         */
        if (! $this->syncRunRepository->isStorageReady() || ! $this->mapPinRepository->isStorageReady()) {
            /*
             * deploy直後やローカル作業直後は、コードだけ先に反映されて migration が未適用の
             * 状態になり得ます。ここで未作成テーブルへ insert してSQL例外を出すより、
             * React がそのまま表示できる短い message に変換します。
             */
            throw new RuntimeException('Earthquake map pin sync storage is not ready. Run migrations.');
        }

        $syncRunId = $this->syncRunRepository->createPending();

        /*
         * Job payload は syncRunId のみに限定します。
         * 対象entry一覧は Job 実行時点のDBから Service が読み直すため、POST時点の古い配列や
         * XML本文を Queue に積まずに済みます。
         */
        SyncEarthquakeMapPinsJob::dispatch($syncRunId);

        return $syncRunId;
    }
}
