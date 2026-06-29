<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortVideoSnapshot;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

interface DanceShortVideoSnapshotRepositoryInterface
{
    public function create(DanceShortVideoSnapshotCreateDTO $dto): DanceShortVideoSnapshot;

    public function updateLatestInPeriodOrCreate(
        DanceShortVideoSnapshotCreateDTO $dto,
        CarbonInterface $periodStartAt,
        CarbonInterface $periodEndAt,
    ): DanceShortVideoSnapshot;

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
     * snapshot based compatibility query 用に、通常ランキング window row を取得します。
     *
     * 現在の displayCardField は active read model を参照します。この method は snapshot 由来の
     * 候補 query と repository-level 検証のために残し、指定 region code 群に対する startRank から
     * windowSize 件の候補と hasNext 判定用の1件だけを DB 側で取得します。
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
     * snapshot based compatibility query 用に、通常ランキング全体順の row を取得します。
     *
     * Repository は指定された region code 群と sortKey に従って DB 上の並び順を確定するだけです。
     * 選択中カードの順位探索や最大5件 window の切り出しは Action / Service 側へ残します。
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
     * read model pattern 生成用に、通常ランキング row を sort 後に取得します。
     *
     * maxRows が 0 の場合は、まとめ用など通常500件制限を使わない pattern として全件取得します。
     *
     * @param  array<int, string>  $regionCodes
     * @return array<int, object>
     */
    public function rankingRowsForReadModelPattern(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
        int $maxRows,
    ): array;

    /**
     * read model pattern 生成用に、上昇候補 row を取得します。
     *
     * maxRows が 0 の場合は、通常ランキングの500件制限を使わず全件取得します。
     *
     * @param  array<int, string>  $sourceRegionCodes
     * @return array<int, object>
     */
    public function risingRowsForReadModelPattern(
        array $sourceRegionCodes,
        int $comparisonDays,
        int $maxRows,
    ): array;

    /**
     * snapshot based compatibility query 用に、上昇候補 window row を取得します。
     *
     * 現在の上昇候補 displayCardField は active read model を参照します。この method は source / JP /
     * previous snapshot を DB 上で結合する snapshot 由来の候補 query と repository-level 検証のために残します。
     * JP 比較状態の意味づけや表示 DTO 化は Repository では行いません。
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
     * snapshot based compatibility query 用に、上昇候補全体順の row を取得します。
     *
     * Repository は上昇候補表示用の snapshot query / prefilter と既存の並び順だけを扱い、
     * 選択カード前後の切り出し、DTO 化、表示 props 生成は Action / Service 側へ残します。
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
