<?php

namespace App\Actions\Earthquake\Commands;

use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncStartResultDTO;
use App\Jobs\Earthquake\SyncEarthquakeMapPinsJob;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use RuntimeException;
use Throwable;

/**
 * QuakeWave Preview の map pin 生成同期を開始する Command Action です。
 *
 * pending run 作成と Queue Job 投入だけを担当し、個別XML取得や pin 生成可否判断は後続層へ委譲します。
 */
final readonly class StartEarthquakeMapPinSyncAction
{
    private const MAX_RETRY_ATTEMPTS = 2;

    /** @var array<int, int> */
    private const RETRY_BACKOFF_SECONDS = [
        1 => 60,
        2 => 180,
    ];

    public function __construct(
        private EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
        private EarthquakeMapPinRepositoryInterface $mapPinRepository,
    ) {}

    /**
     * map pin 同期 run を作成して Queue に投入し、polling 用 ID を返します。
     *
     * @throws RuntimeException status / map pin 保存先が未準備で同期開始できない場合。
     */
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
         * 通常のfull syncはJob payloadにsyncRunIdだけを持ち、対象entryは実行時にDBから読みます。
         * retry時だけは一時失敗したIDをpayloadへ固定し、全対象を再取得しません。
         */
        SyncEarthquakeMapPinsJob::dispatch($syncRunId);

        return $syncRunId;
    }

    /**
     * 一時失敗したentryだけの次回runを有限回数で開始します。
     *
     * @param  array<int, int>  $sourceEntryIds
     */
    public function executeRetryableEntries(array $sourceEntryIds, int $completedRetryAttempt = 0): ?int
    {
        $sourceEntryIds = array_values(array_unique(array_filter(
            $sourceEntryIds,
            fn (mixed $sourceEntryId): bool => is_int($sourceEntryId) && $sourceEntryId > 0,
        )));

        if ($sourceEntryIds === [] || $completedRetryAttempt >= self::MAX_RETRY_ATTEMPTS) {
            return null;
        }

        $nextRetryAttempt = $completedRetryAttempt + 1;
        $syncRunId = $this->createPendingRun();

        try {
            SyncEarthquakeMapPinsJob::dispatch($syncRunId, $sourceEntryIds, $nextRetryAttempt)
                ->delay(self::RETRY_BACKOFF_SECONDS[$nextRetryAttempt]);
        } catch (Throwable $exception) {
            $this->syncRunRepository->markFailed($syncRunId, $exception->getMessage());

            throw $exception;
        }

        return $syncRunId;
    }

    /**
     * map pin 同期 run を開始し、開始結果として必要な初期 status もまとめて返します。
     */
    public function executeWithInitialStatus(): EarthquakeMapPinSyncStartResultDTO
    {
        $syncRunId = $this->execute();

        return new EarthquakeMapPinSyncStartResultDTO(
            syncRunId: $syncRunId,
            syncStatus: $this->syncRunRepository->findResult($syncRunId),
        );
    }

    private function createPendingRun(): int
    {
        if (! $this->syncRunRepository->isStorageReady() || ! $this->mapPinRepository->isStorageReady()) {
            throw new RuntimeException('Earthquake map pin sync storage is not ready. Run migrations.');
        }

        return $this->syncRunRepository->createPending();
    }
}
