<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildStatus;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelRowDTO;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DanceShortRankingReadModelRepository implements DanceShortRankingReadModelRepositoryInterface
{
    private const BUILD_TABLE = 'dance_short_radar_ranking_read_model_builds';

    private const ROW_TABLE = 'dance_short_radar_ranking_read_models';

    public function beginPatternBuild(
        RankingReadModelPatternDefinitionDTO $definition,
        string $patternBuildId,
        CarbonInterface $calculatedAt,
    ): void {
        DB::table(self::BUILD_TABLE)->insert([
            'pattern_build_id' => $patternBuildId,
            'pattern_key' => $definition->patternKey,
            'ranking_type' => $definition->rankingType,
            'scope' => $definition->scope,
            'comparison_days' => $definition->comparisonDays,
            'sort_key' => $definition->sortKey,
            'max_rows' => $definition->maxRows,
            'status' => RankingReadModelBuildStatus::BUILDING,
            'calculated_at' => $calculatedAt->toDateTimeString(),
            'activated_at' => null,
            'inserted_count' => 0,
            'error_message' => null,
            'created_at' => $calculatedAt->toDateTimeString(),
            'updated_at' => $calculatedAt->toDateTimeString(),
        ]);
    }

    public function bulkInsertRows(array $rows): void
    {
        if ($rows === []) {
            return;
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table(self::ROW_TABLE)->insert(array_map(
                fn (RankingReadModelRowDTO $row): array => $row->toArray(),
                $chunk,
            ));
        }
    }

    public function hasBuildingBuildForPattern(string $patternKey): bool
    {
        return DB::table(self::BUILD_TABLE)
            ->where('pattern_key', $patternKey)
            ->where('status', RankingReadModelBuildStatus::BUILDING)
            ->exists();
    }

    public function markStaleBuildingBuildsFailedForPattern(
        string $patternKey,
        CarbonInterface $staleBefore,
        CarbonInterface $failedAt,
        int $chunkSize,
    ): array {
        $patternBuildIds = DB::table(self::BUILD_TABLE)
            ->where('pattern_key', $patternKey)
            ->where('status', RankingReadModelBuildStatus::BUILDING)
            ->where('updated_at', '<=', $staleBefore->toDateTimeString())
            ->orderBy('id')
            ->pluck('pattern_build_id')
            ->filter(fn (mixed $patternBuildId): bool => is_string($patternBuildId) && $patternBuildId !== '')
            ->values()
            ->all();

        if ($patternBuildIds === []) {
            return [
                'buildCount' => 0,
                'deletedRowCount' => 0,
            ];
        }

        $updatedBuildCount = DB::table(self::BUILD_TABLE)
            ->whereIn('pattern_build_id', $patternBuildIds)
            ->where('status', RankingReadModelBuildStatus::BUILDING)
            ->update([
                'status' => RankingReadModelBuildStatus::FAILED,
                'error_message' => 'stale building pattern build',
                'updated_at' => $failedAt->toDateTimeString(),
            ]);

        return [
            'buildCount' => $updatedBuildCount,
            'deletedRowCount' => $this->deleteRowsForPatternBuildIds($patternBuildIds, $chunkSize),
        ];
    }

    public function rowCountForPatternBuild(string $patternBuildId): int
    {
        return DB::table(self::ROW_TABLE)
            ->where('pattern_build_id', $patternBuildId)
            ->count();
    }

    public function activatePatternBuild(string $patternBuildId, string $patternKey, int $insertedCount): void
    {
        $now = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));

        DB::transaction(function () use ($patternBuildId, $patternKey, $insertedCount, $now): void {
            /*
             * 新しい pattern build が active へ更新できたことを確認してから、同じ pattern の旧 active だけを退役させます。
             */
            $activated = DB::table(self::BUILD_TABLE)
                ->where('pattern_build_id', $patternBuildId)
                ->where('pattern_key', $patternKey)
                ->where('status', RankingReadModelBuildStatus::BUILDING)
                ->update([
                    'status' => RankingReadModelBuildStatus::ACTIVE,
                    'activated_at' => $now->toDateTimeString(),
                    'inserted_count' => $insertedCount,
                    'updated_at' => $now->toDateTimeString(),
                ]);

            if ($activated !== 1) {
                throw new RuntimeException('Ranking read model pattern build is not activatable.');
            }

            DB::table(self::BUILD_TABLE)
                ->where('pattern_key', $patternKey)
                ->where('status', RankingReadModelBuildStatus::ACTIVE)
                ->where('pattern_build_id', '!=', $patternBuildId)
                ->update([
                    'status' => RankingReadModelBuildStatus::SUPERSEDED,
                    'updated_at' => $now->toDateTimeString(),
                ]);
        });
    }

    public function markPatternBuildFailed(string $patternBuildId, int $chunkSize, ?string $errorMessage = null): int
    {
        $now = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));
        $deletedRowCount = $this->deleteRowsForPatternBuildIds([$patternBuildId], $chunkSize);

        DB::table(self::BUILD_TABLE)
            ->where('pattern_build_id', $patternBuildId)
            ->update([
                'status' => RankingReadModelBuildStatus::FAILED,
                'error_message' => $errorMessage === null ? null : mb_substr($errorMessage, 0, 1000),
                'updated_at' => $now->toDateTimeString(),
            ]);

        return $deletedRowCount;
    }

    public function cleanupRowsExceptPatternBuildIds(string $patternKey, array $retainedPatternBuildIds, int $chunkSize): int
    {
        $retainedPatternBuildIds = array_values(array_filter(
            array_unique($retainedPatternBuildIds),
            fn (string $patternBuildId): bool => $patternBuildId !== '',
        ));

        if ($retainedPatternBuildIds === []) {
            throw new RuntimeException('Ranking read model pattern cleanup requires retained pattern build ids.');
        }

        $deletedRowCount = 0;

        do {
            $rowIds = DB::table(self::ROW_TABLE)
                ->where('pattern_key', $patternKey)
                ->whereNotIn('pattern_build_id', $retainedPatternBuildIds)
                ->orderBy('id')
                ->limit(max(1, $chunkSize))
                ->pluck('id')
                ->all();

            if ($rowIds === []) {
                break;
            }

            $deletedRowCount += DB::table(self::ROW_TABLE)
                ->whereIn('id', $rowIds)
                ->delete();
        } while (count($rowIds) === max(1, $chunkSize));

        return $deletedRowCount;
    }

    public function activeRowsWindow(
        string $scope,
        int $comparisonDays,
        string $sortKey,
        int $startRank,
        int $windowSize,
    ): array {
        $query = $this->activeRowsQuery($scope, $comparisonDays, $sortKey);

        if ($query === null) {
            return [];
        }

        return $query
            ->orderBy('rank')
            ->offset(max(0, $startRank - 1))
            ->limit(max(1, $windowSize) + 1)
            ->get()
            ->all();
    }

    public function activeRankForVideo(
        string $scope,
        int $comparisonDays,
        string $sortKey,
        int $videoId,
    ): ?int {
        $query = $this->activeRowsQuery($scope, $comparisonDays, $sortKey);

        if ($query === null) {
            return null;
        }

        $rank = $query
            ->where('video_id', $videoId)
            ->orderBy('rank')
            ->value('rank');

        return $rank === null ? null : (int) $rank;
    }

    public function activeRowCount(
        string $scope,
        int $comparisonDays,
        string $sortKey,
    ): int {
        $query = $this->activeRowsQuery($scope, $comparisonDays, $sortKey);

        return $query === null ? 0 : $query->count();
    }

    public function activePatternBuildId(string $scope, int $comparisonDays, string $sortKey): ?string
    {
        $patternBuildId = DB::table(self::BUILD_TABLE)
            ->where('status', RankingReadModelBuildStatus::ACTIVE)
            ->where('scope', $scope)
            ->where('comparison_days', $comparisonDays)
            ->where('sort_key', $sortKey)
            ->orderByDesc('activated_at')
            ->value('pattern_build_id');

        return is_string($patternBuildId) ? $patternBuildId : null;
    }

    private function activeRowsQuery(
        string $scope,
        int $comparisonDays,
        string $sortKey,
    ): ?Builder {
        $patternBuildId = $this->activePatternBuildId($scope, $comparisonDays, $sortKey);

        if ($patternBuildId === null) {
            return null;
        }

        return DB::table(self::ROW_TABLE)
            ->where('pattern_build_id', $patternBuildId)
            ->where('scope', $scope)
            ->where('comparison_days', $comparisonDays)
            ->where('sort_key', $sortKey);
    }

    /**
     * @param  array<int, string>  $patternBuildIds
     */
    private function deleteRowsForPatternBuildIds(array $patternBuildIds, int $chunkSize): int
    {
        $patternBuildIds = array_values(array_filter(
            array_unique($patternBuildIds),
            fn (string $patternBuildId): bool => $patternBuildId !== '',
        ));

        if ($patternBuildIds === []) {
            return 0;
        }

        $deletedRowCount = 0;

        do {
            $rowIds = DB::table(self::ROW_TABLE)
                ->whereIn('pattern_build_id', $patternBuildIds)
                ->orderBy('id')
                ->limit(max(1, $chunkSize))
                ->pluck('id')
                ->all();

            if ($rowIds === []) {
                break;
            }

            $deletedRowCount += DB::table(self::ROW_TABLE)
                ->whereIn('id', $rowIds)
                ->delete();
        } while (count($rowIds) === max(1, $chunkSize));

        return $deletedRowCount;
    }
}
