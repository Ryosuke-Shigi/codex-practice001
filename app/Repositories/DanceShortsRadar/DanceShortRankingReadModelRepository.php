<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildStatus;
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

    public function beginBuild(string $buildId, CarbonInterface $calculatedAt): void
    {
        DB::table(self::BUILD_TABLE)->insert([
            'build_id' => $buildId,
            'status' => RankingReadModelBuildStatus::BUILDING,
            'calculated_at' => $calculatedAt->toDateTimeString(),
            'activated_at' => null,
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

    public function hasBuildingBuild(): bool
    {
        return DB::table(self::BUILD_TABLE)
            ->where('status', RankingReadModelBuildStatus::BUILDING)
            ->exists();
    }

    public function markStaleBuildingBuildsFailed(
        CarbonInterface $staleBefore,
        CarbonInterface $failedAt,
        int $chunkSize,
    ): array {
        $buildIds = DB::table(self::BUILD_TABLE)
            ->where('status', RankingReadModelBuildStatus::BUILDING)
            ->where('updated_at', '<=', $staleBefore->toDateTimeString())
            ->orderBy('id')
            ->pluck('build_id')
            ->filter(fn (mixed $buildId): bool => is_string($buildId) && $buildId !== '')
            ->values()
            ->all();

        if ($buildIds === []) {
            return [
                'buildCount' => 0,
                'deletedRowCount' => 0,
            ];
        }

        $updatedBuildCount = DB::table(self::BUILD_TABLE)
            ->whereIn('build_id', $buildIds)
            ->where('status', RankingReadModelBuildStatus::BUILDING)
            ->update([
                'status' => RankingReadModelBuildStatus::FAILED,
                'updated_at' => $failedAt->toDateTimeString(),
            ]);

        return [
            'buildCount' => $updatedBuildCount,
            'deletedRowCount' => $this->deleteRowsForBuildIds($buildIds, $chunkSize),
        ];
    }

    public function rowCountForBuild(string $buildId): int
    {
        return DB::table(self::ROW_TABLE)
            ->where('build_id', $buildId)
            ->count();
    }

    public function activateBuild(string $buildId): void
    {
        $now = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));

        DB::transaction(function () use ($buildId, $now): void {
            /*
             * 先に新buildを active へ更新できたことを確認します。
             * 存在しない build_id や building 以外の状態では、旧 active build を触らずに失敗させます。
             */
            $activated = DB::table(self::BUILD_TABLE)
                ->where('build_id', $buildId)
                ->where('status', RankingReadModelBuildStatus::BUILDING)
                ->update([
                    'status' => RankingReadModelBuildStatus::ACTIVE,
                    'activated_at' => $now->toDateTimeString(),
                    'updated_at' => $now->toDateTimeString(),
                ]);

            if ($activated !== 1) {
                throw new RuntimeException('Ranking read model build is not activatable.');
            }

            /*
             * 新buildが active になった後だけ旧buildを退役させます。
             * 表示側は常に active build を1つ読むため、切替途中の欠損windowを避けられます。
             */
            DB::table(self::BUILD_TABLE)
                ->where('status', RankingReadModelBuildStatus::ACTIVE)
                ->where('build_id', '!=', $buildId)
                ->update([
                    'status' => RankingReadModelBuildStatus::SUPERSEDED,
                    'updated_at' => $now->toDateTimeString(),
                ]);
        });
    }

    public function markBuildFailed(string $buildId, int $chunkSize): int
    {
        $now = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));

        $deletedRowCount = $this->deleteRowsForBuildIds([$buildId], $chunkSize);

        DB::table(self::BUILD_TABLE)
            ->where('build_id', $buildId)
            ->update([
                'status' => RankingReadModelBuildStatus::FAILED,
                'updated_at' => $now->toDateTimeString(),
            ]);

        return $deletedRowCount;
    }

    public function cleanupRowsExceptBuildIds(array $retainedBuildIds, int $chunkSize): int
    {
        $retainedBuildIds = array_values(array_filter(
            array_unique($retainedBuildIds),
            fn (string $buildId): bool => $buildId !== '',
        ));

        if ($retainedBuildIds === []) {
            throw new RuntimeException('Ranking read model cleanup requires retained build ids.');
        }

        $deletedRowCount = 0;

        do {
            $rowIds = DB::table(self::ROW_TABLE)
                ->whereNotIn('build_id', $retainedBuildIds)
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

    public function activeBuildId(): ?string
    {
        $buildId = DB::table(self::BUILD_TABLE)
            ->where('status', RankingReadModelBuildStatus::ACTIVE)
            ->orderByDesc('activated_at')
            ->value('build_id');

        return is_string($buildId) ? $buildId : null;
    }

    private function activeRowsQuery(
        string $scope,
        int $comparisonDays,
        string $sortKey,
    ): ?Builder {
        $buildId = $this->activeBuildId();

        if ($buildId === null) {
            return null;
        }

        $query = DB::table(self::ROW_TABLE)
            ->where('build_id', $buildId)
            ->where('scope', $scope)
            ->where('comparison_days', $comparisonDays)
            ->where('sort_key', $sortKey);

        return $query;
    }

    /**
     * @param  array<int, string>  $buildIds
     */
    private function deleteRowsForBuildIds(array $buildIds, int $chunkSize): int
    {
        $buildIds = array_values(array_filter(
            array_unique($buildIds),
            fn (string $buildId): bool => $buildId !== '',
        ));

        if ($buildIds === []) {
            return 0;
        }

        $deletedRowCount = 0;

        do {
            $rowIds = DB::table(self::ROW_TABLE)
                ->whereIn('build_id', $buildIds)
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
