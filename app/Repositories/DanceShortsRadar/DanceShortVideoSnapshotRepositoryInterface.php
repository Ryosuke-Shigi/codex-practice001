<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortVideoSnapshot;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

interface DanceShortVideoSnapshotRepositoryInterface
{
    public function create(DanceShortVideoSnapshotCreateDTO $dto): DanceShortVideoSnapshot;

    public function latestForVideoAndRegion(int $videoId, int $regionId): ?DanceShortVideoSnapshot;

    /**
     * 指定 region の ranking current 候補を取得します。
     *
     * current は video_id + region_id ごとの最新 snapshot です。
     * active 動画かどうか、指定 region かどうか、どの行が最新かという DB 境界だけを扱い、
     * previous との差分計算やランキング順位の意味づけは Action / Service 側へ委譲します。
     *
     * @return Collection<int, DanceShortVideoSnapshot>
     */
    public function latestRankingSnapshotsByRegionCode(string $regionCode, int $limit): Collection;

    /**
     * previous 候補を取得します。
     *
     * previous は currentCollectedAt - comparisonDays 日以前の最新 snapshot です。
     * cutoff より新しい snapshot を比較対象に混ぜないため、Action が算出した cutoffAt 以下で絞ります。
     */
    public function latestSnapshotAtOrBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $cutoffAt,
    ): ?DanceShortVideoSnapshot;

    public function deleteCollectedBefore(CarbonInterface $cutoffAt): int;
}
