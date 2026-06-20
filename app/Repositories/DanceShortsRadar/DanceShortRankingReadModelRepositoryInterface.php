<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelRowDTO;
use Carbon\CarbonInterface;

interface DanceShortRankingReadModelRepositoryInterface
{
    /**
     * 新しい read model build の生成開始を記録します。
     */
    public function beginBuild(string $buildId, CarbonInterface $calculatedAt): void;

    /**
     * @param  array<int, RankingReadModelRowDTO>  $rows
     */
    public function bulkInsertRows(array $rows): void;

    /**
     * 生成済み build を active に切り替え、旧 build rows を削除します。
     */
    public function activateBuild(string $buildId): void;

    /**
     * 失敗した build の部分 rows を削除します。旧 active build は変更しません。
     */
    public function markBuildFailed(string $buildId): void;

    /**
     * active build から表示window分と lookahead 1件を取得します。
     *
     * @return array<int, object>
     */
    public function activeRowsWindow(
        string $scope,
        int $comparisonDays,
        ?string $sortKey,
        int $startRank,
        int $windowSize,
    ): array;

    /**
     * active build 上で選択動画の順位を返します。
     */
    public function activeRankForVideo(
        string $scope,
        int $comparisonDays,
        ?string $sortKey,
        int $videoId,
    ): ?int;

    /**
     * active build 上の対象pattern総件数を返します。
     */
    public function activeRowCount(
        string $scope,
        int $comparisonDays,
        ?string $sortKey,
    ): int;

    /**
     * 現在表示に使われる build_id を返します。
     */
    public function activeBuildId(): ?string;
}
