<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Cleanup\DanceShortSnapshotCleanupResultDTO;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotRetentionService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * DanceShortsRadar snapshot の保持期間超過分を削除する Command Action です。
 *
 * Scheduler / Artisan Command / 同期後 cleanup から呼ばれ、cutoff 算出は Service、
 * 物理削除は Repository に委譲します。YouTube API 通信やランキング表示判断は持ちません。
 */
class CleanupDanceShortVideoSnapshotsAction
{
    public function __construct(
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortSnapshotRetentionService $retentionService,
    ) {}

    /**
     * cleanup の実行時刻を決め、保持期間に基づく削除結果 DTO を返します。
     */
    public function execute(?CarbonInterface $now = null): DanceShortSnapshotCleanupResultDTO
    {
        /*
         * Cleanup は snapshot の保持期間超過分を削除するユースケース手順だけを担当します。
         * retention 日数や cutoff の判断は Service、物理削除は Repository に分け、
         * YouTube API 取得や Scheduler 登録はここに置きません。
         *
         * sync 後の自動 cleanup と手動 command の単体実行は同じ Action を通します。
         * 入口を増やしても削除条件が分岐しないよう、ここでは現在時刻の決定、cutoff 算出、
         * Repository 委譲、ResultDTO 化という順序だけを固定します。
         */
        $executedAt = $now === null ? CarbonImmutable::now() : CarbonImmutable::instance($now);
        $cutoffAt = $this->retentionService->cutoffAt($executedAt);
        $deletedSnapshotCount = $this->snapshotRepository->deleteCollectedBefore($cutoffAt);

        return new DanceShortSnapshotCleanupResultDTO(
            executedAt: $executedAt,
            cutoffAt: $cutoffAt,
            retentionDays: $this->retentionService->retentionDays(),
            deletedSnapshotCount: $deletedSnapshotCount,
        );
    }
}
