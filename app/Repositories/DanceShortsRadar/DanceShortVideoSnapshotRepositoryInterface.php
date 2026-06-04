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
     * ここで返す順序は current snapshot の取得順であり、ランキング順位ではありません。
     * 表示件数 limit をこの段階で適用すると、view_count_delta / view_growth_rate / views_per_hour の
     * 計算前に候補が落ちるため、limit は metric 計算と sort が終わった後に Action 側で適用します。
     *
     * @return Collection<int, DanceShortVideoSnapshot>
     */
    public function latestRankingSnapshotsByRegionCode(string $regionCode): Collection;

    /**
     * displayCardField の通常ランキング window 用 read model を取得します。
     *
     * 指定された region code 群に対し、startRank から windowSize 件の表示候補と
     * hasNext 判定用の1件を取得します。返却される row は current snapshot、previous snapshot、
     * snapshot 比較 metric を持ちますが、DTO 化や Inertia props 化は Repository では行いません。
     *
     * @param  array<int, string>  $regionCodes
     * @return array<int, object>
     */
    public function rankingRowsWindowByRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
        int $startRank,
        int $windowSize,
    ): array;

    /**
     * displayCardField の選択カード基準 window 用に、通常ランキング全体順の read model を取得します。
     *
     * Repository は指定された region code 群と sortKey に従って DB 上の並び順を確定するだけです。
     * 選択中カードの順位探索や最大5件 window の切り出しは Service / Strategy 側へ残します。
     *
     * @param  array<int, string>  $regionCodes
     * @return array<int, object>
     */
    public function rankingRowsByRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
    ): array;

    /**
     * displayCardField の上昇候補 window 用 read model を取得します。
     *
     * US / KR などの source region に対し、海外側で増加していて、JP 側が未観測または
     * JP 側の増加量が source より小さい候補だけを startRank から windowSize + 1 件取得します。
     *
     * @param  array<int, string>  $sourceRegionCodes
     * @return array<int, object>
     */
    public function risingRowsWindow(
        array $sourceRegionCodes,
        int $comparisonDays,
        int $startRank,
        int $windowSize,
    ): array;

    /**
     * displayCardField の選択カード基準 window 用に、上昇候補全体順の read model を取得します。
     *
     * Repository は上昇候補 query と既存の並び順だけを扱い、選択カード前後の切り出しは行いません。
     *
     * @param  array<int, string>  $sourceRegionCodes
     * @return array<int, object>
     */
    public function risingRows(
        array $sourceRegionCodes,
        int $comparisonDays,
    ): array;

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

    /**
     * current snapshot より前に保存された直近 snapshot を取得します。
     *
     * 通常ランキングでは、指定 comparisonDays 以前の snapshot がまだ無い初期観測直後でも、
     * 直前 snapshot があれば増加量を表示できるようにします。
     * 「何日前と比較するか」という意味づけやフォールバック採用判断は Action / Service 側へ残し、
     * Repository は current より古い行を stable tie-break で取る DB 条件だけを扱います。
     */
    public function latestSnapshotBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $currentCollectedAt,
        int $currentSnapshotId,
    ): ?DanceShortVideoSnapshot;

    public function deleteCollectedBefore(CarbonInterface $cutoffAt): int;
}
