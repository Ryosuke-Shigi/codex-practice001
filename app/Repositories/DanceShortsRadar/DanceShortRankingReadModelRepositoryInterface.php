<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelRowDTO;
use Carbon\CarbonInterface;

interface DanceShortRankingReadModelRepositoryInterface
{
    /**
     * 新しい read model pattern build の生成開始を記録します。
     */
    public function beginPatternBuild(
        RankingReadModelPatternDefinitionDTO $definition,
        string $patternBuildId,
        CarbonInterface $calculatedAt,
    ): void;

    /**
     * @param  array<int, RankingReadModelRowDTO>  $rows
     */
    public function bulkInsertRows(array $rows): void;

    /**
     * 指定 pattern の若い building build が残っているかを返します。
     */
    public function hasBuildingBuildForPattern(string $patternKey): bool;

    /**
     * 指定 pattern の stale building build を failed 化し、その build に紐づく rows を削除します。
     *
     * @return array{buildCount: int, deletedRowCount: int}
     */
    public function markStaleBuildingBuildsFailedForPattern(
        string $patternKey,
        CarbonInterface $staleBefore,
        CarbonInterface $failedAt,
        int $chunkSize,
    ): array;

    /**
     * 指定 pattern build に紐づく read model rows 件数を返します。
     */
    public function rowCountForPatternBuild(string $patternBuildId): int;

    /**
     * 生成済み pattern build を active に切り替え、同じ pattern の旧 active build だけを superseded にします。
     */
    public function activatePatternBuild(string $patternBuildId, string $patternKey, int $insertedCount): void;

    /**
     * 失敗した pattern build の部分 rows を削除します。同じ pattern の旧 active build は変更しません。
     */
    public function markPatternBuildFailed(string $patternBuildId, int $chunkSize, ?string $errorMessage = null): int;

    /**
     * 指定 pattern の保持対象外 pattern_build_id の read model rows を削除します。
     *
     * @param  array<int, string>  $retainedPatternBuildIds
     */
    public function cleanupRowsExceptPatternBuildIds(string $patternKey, array $retainedPatternBuildIds, int $chunkSize): int;

    /**
     * active pattern build から表示window分と lookahead 1件を取得します。
     *
     * @return array<int, object>
     */
    public function activeRowsWindow(
        string $scope,
        int $comparisonDays,
        string $sortKey,
        int $startRank,
        int $windowSize,
    ): array;

    /**
     * active pattern build 上で選択動画の順位を返します。
     */
    public function activeRankForVideo(
        string $scope,
        int $comparisonDays,
        string $sortKey,
        int $videoId,
    ): ?int;

    /**
     * active pattern build 上の対象pattern総件数を返します。
     */
    public function activeRowCount(
        string $scope,
        int $comparisonDays,
        string $sortKey,
    ): int;

    /**
     * 現在表示に使われる pattern_build_id を返します。
     */
    public function activePatternBuildId(string $scope, int $comparisonDays, string $sortKey): ?string;
}
