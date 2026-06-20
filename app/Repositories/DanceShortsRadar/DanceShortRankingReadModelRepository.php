<?php

namespace App\Repositories\DanceShortsRadar;

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
            'status' => 'building',
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
                ->where('status', 'building')
                ->update([
                    'status' => 'active',
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
                ->where('status', 'active')
                ->where('build_id', '!=', $buildId)
                ->update([
                    'status' => 'superseded',
                    'updated_at' => $now->toDateTimeString(),
                ]);

            DB::table(self::ROW_TABLE)
                ->where('build_id', '!=', $buildId)
                ->delete();

            DB::table(self::BUILD_TABLE)
                ->where('build_id', '!=', $buildId)
                ->delete();
        });
    }

    public function markBuildFailed(string $buildId): void
    {
        $now = CarbonImmutable::now((string) config('app.timezone', 'Asia/Tokyo'));

        DB::table(self::ROW_TABLE)
            ->where('build_id', $buildId)
            ->delete();

        DB::table(self::BUILD_TABLE)
            ->where('build_id', $buildId)
            ->update([
                'status' => 'failed',
                'updated_at' => $now->toDateTimeString(),
            ]);
    }

    public function activeRowsWindow(
        string $scope,
        int $comparisonDays,
        ?string $sortKey,
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
        ?string $sortKey,
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
        ?string $sortKey,
    ): int {
        $query = $this->activeRowsQuery($scope, $comparisonDays, $sortKey);

        return $query === null ? 0 : $query->count();
    }

    public function activeBuildId(): ?string
    {
        $buildId = DB::table(self::BUILD_TABLE)
            ->where('status', 'active')
            ->orderByDesc('activated_at')
            ->value('build_id');

        return is_string($buildId) ? $buildId : null;
    }

    private function activeRowsQuery(
        string $scope,
        int $comparisonDays,
        ?string $sortKey,
    ): ?Builder {
        $buildId = $this->activeBuildId();

        if ($buildId === null) {
            return null;
        }

        $query = DB::table(self::ROW_TABLE)
            ->where('build_id', $buildId)
            ->where('scope', $scope)
            ->where('comparison_days', $comparisonDays);

        if ($sortKey === null) {
            $query->whereNull('sort_key');
        } else {
            $query->where('sort_key', $sortKey);
        }

        return $query;
    }
}
