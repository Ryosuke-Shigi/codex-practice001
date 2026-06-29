<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortVideoSnapshot;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\DB;

class DanceShortVideoSnapshotRepository implements DanceShortVideoSnapshotRepositoryInterface
{
    public function create(DanceShortVideoSnapshotCreateDTO $dto): DanceShortVideoSnapshot
    {
        /*
         * snapshot は「取得した時点の公開指標」を履歴として積むテーブルです。
         * view_count_delta / view_growth_rate / views_per_hour は保存せず、
         * 必要なときに latestForVideoAndRegion() などで取得した前回値と比較して算出します。
         */
        return DanceShortVideoSnapshot::query()->create($dto->toArray());
    }

    public function updateLatestInPeriodOrCreate(
        DanceShortVideoSnapshotCreateDTO $dto,
        CarbonInterface $periodStartAt,
        CarbonInterface $periodEndAt,
    ): DanceShortVideoSnapshot {
        /*
         * JST12時間枠内に同じ video_id + region_id の snapshot がある場合は、
         * collected_at DESC / id DESC の最新1件だけを更新します。
         * 同枠内の他の既存 snapshot は触らず、枠内に候補がない場合だけ新規作成します。
         */
        $snapshot = DanceShortVideoSnapshot::query()
            ->where('video_id', $dto->video_id)
            ->where('region_id', $dto->region_id)
            ->where('collected_at', '>=', $periodStartAt->toDateTimeString())
            ->where('collected_at', '<', $periodEndAt->toDateTimeString())
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();

        if ($snapshot === null) {
            return $this->create($dto);
        }

        $snapshot->fill([
            'view_count' => $dto->view_count,
            'like_count' => $dto->like_count,
            'comment_count' => $dto->comment_count,
            'collected_at' => $dto->collected_at->toDateTimeString(),
        ]);
        $snapshot->save();

        return $snapshot->refresh();
    }

    public function latestForVideoAndRegion(int $videoId, int $regionId): ?DanceShortVideoSnapshot
    {
        /*
         * 同じ動画でも地域別に検索・観測されるため、最新 snapshot は video_id と region_id の
         * 両方で絞ります。collected_at が同一秒になるケースに備えて id も降順にし、
         * 直近に作成された行を安定して返します。
         */
        return DanceShortVideoSnapshot::query()
            ->where('video_id', $videoId)
            ->where('region_id', $regionId)
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @return Collection<int, DanceShortVideoSnapshot>
     */
    public function latestRankingSnapshotsByRegionCode(string $regionCode): Collection
    {
        /*
         * Ranking Query の current 候補です。
         * Repository は active / region / 最新 snapshot という DB 取得条件だけを閉じ、
         * 増加量や伸び率、ランキングとしての意味づけは Service / Action 側へ残します。
         *
         * orderBy は「current 候補の返却順」を安定させるためのものです。
         * collected_at / id 順はランキング指標ではないため、この段階で表示件数 limit をかけると、
         * 後段の metric sort では上位になるはずの動画を計算前に除外してしまいます。
         * そのため Repository は候補を全件返し、limit は Action 側の metric 計算と sort 後にだけ適用します。
         */
        return DanceShortVideoSnapshot::query()
            ->with(['video', 'region'])
            ->whereHas('region', fn ($query) => $query->where('code', $regionCode))
            ->whereHas('video', fn ($query) => $query->where('tracking_status', 'active'))
            ->whereNotExists(function ($query): void {
                /*
                 * video_id + region_id の組み合わせごとに「より新しい snapshot が存在しない行」だけを残します。
                 * collected_at が同一秒で重なる可能性があるため、同時刻の場合は id が大きい行を新しい行として扱い、
                 * latestForVideoAndRegion() と同じ安定した tie-break にそろえています。
                 */
                $query->selectRaw('1')
                    ->from('dance_short_video_snapshots as later_snapshots')
                    ->whereColumn('later_snapshots.video_id', 'dance_short_video_snapshots.video_id')
                    ->whereColumn('later_snapshots.region_id', 'dance_short_video_snapshots.region_id')
                    ->where(function ($query): void {
                        $query->whereColumn(
                            'later_snapshots.collected_at',
                            '>',
                            'dance_short_video_snapshots.collected_at',
                        )->orWhere(function ($query): void {
                            $query->whereColumn(
                                'later_snapshots.collected_at',
                                'dance_short_video_snapshots.collected_at',
                            )->whereColumn('later_snapshots.id', '>', 'dance_short_video_snapshots.id');
                        });
                    });
            })
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * @param  array<int, string>  $regionCodes
     * @return array<int, object>
     */
    public function rankingRowsWindowByRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
        int $startRank,
        int $windowSize,
    ): array {
        /*
         * 通常ランキングの displayCardField は全件候補を Action 側で作らず、
         * Repository で startRank 位置から必要な window だけを取得します。
         * windowSize + 1 件にすることで、別 COUNT query を増やさず hasNext を判定できます。
         */
        $safeRegionCodes = array_values(array_unique(array_filter(
            $regionCodes,
            fn (string $regionCode): bool => $regionCode !== '',
        )));

        if ($safeRegionCodes === []) {
            return [];
        }

        $query = $this->rankingRowsQuery($comparisonDays)
            ->whereIn('regions.code', $safeRegionCodes);

        $this->orderRankingRows($query, $sortKey);

        return $query
            ->offset(max(0, $startRank - 1))
            ->limit($windowSize + 1)
            ->get()
            ->all();
    }

    /**
     * @param  array<int, string>  $regionCodes
     * @return array<int, object>
     */
    public function rankingRowsByRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
    ): array {
        $safeRegionCodes = array_values(array_unique(array_filter(
            $regionCodes,
            fn (string $regionCode): bool => $regionCode !== '',
        )));

        if ($safeRegionCodes === []) {
            return [];
        }

        $query = $this->rankingRowsQuery($comparisonDays)
            ->whereIn('regions.code', $safeRegionCodes);

        $this->orderRankingRows($query, $sortKey);

        return $query
            ->get()
            ->all();
    }

    /**
     * @param  array<int, string>  $regionCodes
     * @return array<int, object>
     */
    public function rankingRowsForReadModelPattern(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
        int $maxRows,
    ): array {
        $safeRegionCodes = array_values(array_unique(array_filter(
            $regionCodes,
            fn (string $regionCode): bool => $regionCode !== '',
        )));

        if ($safeRegionCodes === []) {
            return [];
        }

        $query = $this->rankingRowsQuery($comparisonDays)
            ->whereIn('regions.code', $safeRegionCodes);

        $this->orderRankingRows($query, $sortKey);

        return $query
            ->limit(max(1, $maxRows))
            ->get()
            ->all();
    }

    /**
     * @param  array<int, string>  $sourceRegionCodes
     * @return array<int, object>
     */
    public function risingRowsWindow(
        array $sourceRegionCodes,
        int $comparisonDays,
        int $startRank,
        int $windowSize,
    ): array {
        $query = $this->risingRowsQuery($sourceRegionCodes, $comparisonDays);

        if ($query === null) {
            return [];
        }

        return $query
            ->offset(max(0, $startRank - 1))
            ->limit($windowSize + 1)
            ->get()
            ->all();
    }

    /**
     * @param  array<int, string>  $sourceRegionCodes
     * @return array<int, object>
     */
    public function risingRows(
        array $sourceRegionCodes,
        int $comparisonDays,
    ): array {
        $query = $this->risingRowsQuery($sourceRegionCodes, $comparisonDays);

        if ($query === null) {
            return [];
        }

        return $query
            ->get()
            ->all();
    }

    /**
     * @param  array<int, string>  $sourceRegionCodes
     */
    private function risingRowsQuery(array $sourceRegionCodes, int $comparisonDays): ?Builder
    {
        /*
         * RISING タブの displayCardField は startRank から windowSize + 1 件だけを返す必要があるため、
         * Repository で source / JP / previous snapshot を結合し、DB 上で候補行を prefilter します。
         *
         * JP は比較対象であり source region ではないため、入力に混ざっていても source から外します。
         * ここでは read model 用の row、並び順、window 取得に必要な SQL 条件だけを扱い、JP 比較状態の
         * 意味づけ、DTO 化、カード文言、Inertia props 生成は Service / Strategy / Responder へ残します。
         */
        $safeSourceRegionCodes = array_values(array_intersect(
            ['US', 'KR'],
            array_unique($sourceRegionCodes),
        ));

        if ($safeSourceRegionCodes === []) {
            return null;
        }

        $sourceDeltaExpression = $this->deltaExpression('current_snapshots', 'previous_snapshots');
        $sourceGrowthExpression = $this->growthRateExpression('current_snapshots', 'previous_snapshots');
        $sourceViewsPerHourExpression = $this->viewsPerHourExpression('current_snapshots', 'previous_snapshots');
        $japanDeltaExpression = $this->deltaExpression('japan_current_snapshots', 'japan_previous_snapshots');
        $japanGrowthExpression = $this->growthRateExpression('japan_current_snapshots', 'japan_previous_snapshots');
        $japanViewsPerHourExpression = $this->viewsPerHourExpression('japan_current_snapshots', 'japan_previous_snapshots');
        $uniqueSourceOrder = implode(', ', [
            $sourceDeltaExpression.' DESC',
            'CASE WHEN '.$sourceGrowthExpression.' IS NULL THEN 1 ELSE 0 END ASC',
            $sourceGrowthExpression.' DESC',
            'CASE WHEN '.$japanDeltaExpression.' IS NULL THEN 0 ELSE 1 END ASC',
            $japanDeltaExpression.' ASC',
            'current_snapshots.collected_at DESC',
            'videos.id ASC',
        ]);

        $baseQuery = $this->baseCurrentSnapshotQuery($comparisonDays)
            ->whereIn('regions.code', $safeSourceRegionCodes)
            ->leftJoin('dance_short_regions as japan_regions', function (JoinClause $join): void {
                $join->where('japan_regions.code', 'JP')
                    ->where('japan_regions.is_active', true);
            })
            ->leftJoin('dance_short_video_snapshots as japan_current_snapshots', function (JoinClause $join): void {
                $join->whereRaw(
                    'japan_current_snapshots.id = ('.$this->latestSnapshotIdSql(
                        currentAlias: 'current_snapshots',
                        lookupAlias: 'latest_japan_current_snapshots',
                        regionIdExpression: 'japan_regions.id',
                    ).')',
                );
            })
            ->leftJoin('dance_short_video_snapshots as japan_previous_snapshots', function (JoinClause $join) use ($comparisonDays): void {
                $join->whereRaw(
                    'japan_previous_snapshots.id = COALESCE(('.
                    $this->previousAtOrBeforeIdSql(
                        currentAlias: 'japan_current_snapshots',
                        lookupAlias: 'japan_previous_cutoff_snapshots',
                        comparisonDays: $comparisonDays,
                    ).
                    '), ('.
                    $this->previousBeforeIdSql(
                        currentAlias: 'japan_current_snapshots',
                        lookupAlias: 'japan_previous_fallback_snapshots',
                    ).
                    '))',
                );
            })
            ->whereNotNull('previous_snapshots.id')
            ->whereRaw($sourceDeltaExpression.' > 0')
            ->where(function (Builder $query) use ($sourceDeltaExpression, $japanDeltaExpression): void {
                $query->whereNull('japan_current_snapshots.id')
                    ->orWhere(function (Builder $query) use ($sourceDeltaExpression, $japanDeltaExpression): void {
                        $query->whereNotNull('japan_previous_snapshots.id')
                            ->whereRaw($japanDeltaExpression.' < '.$sourceDeltaExpression);
                    });
            })
            ->select([
                'videos.id as video_id',
                'videos.youtube_video_id',
                'videos.title',
                'videos.channel_title',
                'videos.thumbnail_url',
                'videos.url',
                'videos.published_at',
                'regions.code as source_region_code',
                'regions.name as source_region_name',
                'current_snapshots.view_count as source_current_view_count',
                'previous_snapshots.view_count as source_previous_view_count',
                'current_snapshots.like_count as source_like_count',
                'current_snapshots.comment_count as source_comment_count',
                'current_snapshots.collected_at as source_current_collected_at',
                'previous_snapshots.collected_at as source_previous_collected_at',
                'japan_current_snapshots.id as japan_current_snapshot_id',
                'japan_previous_snapshots.id as japan_previous_snapshot_id',
                'japan_current_snapshots.view_count as japan_current_view_count',
                'japan_previous_snapshots.view_count as japan_previous_view_count',
                'japan_current_snapshots.collected_at as japan_current_collected_at',
                'japan_previous_snapshots.collected_at as japan_previous_collected_at',
            ])
            ->selectRaw($sourceDeltaExpression.' as source_view_count_delta')
            ->selectRaw($sourceGrowthExpression.' as source_view_growth_rate')
            ->selectRaw($sourceViewsPerHourExpression.' as source_views_per_hour')
            ->selectRaw($japanDeltaExpression.' as japan_view_count_delta')
            ->selectRaw($japanGrowthExpression.' as japan_view_growth_rate')
            ->selectRaw($japanViewsPerHourExpression.' as japan_views_per_hour')
            ->selectRaw(
                /*
                 * 同じ YouTube 動画が US / KR の両方で候補になる場合は、より強い source 側の伸びを
                 * 代表行にします。Window 関数で source_unique_rank = 1 だけを残し、
                 * Strategy には重複のない候補 row として渡します。
                 */
                'ROW_NUMBER() OVER (PARTITION BY videos.youtube_video_id ORDER BY '.
                $uniqueSourceOrder.
                ') as source_unique_rank',
            );

        return DB::query()
            ->fromSub($baseQuery, 'rising_candidate_rows')
            ->where('source_unique_rank', 1)
            ->orderByDesc('source_view_count_delta')
            ->orderByRaw('CASE WHEN source_view_growth_rate IS NULL THEN 1 ELSE 0 END ASC')
            ->orderByDesc('source_view_growth_rate')
            ->orderByRaw('CASE WHEN japan_view_count_delta IS NULL THEN 0 ELSE 1 END ASC')
            ->orderBy('japan_view_count_delta')
            ->orderByDesc('source_current_collected_at')
            ->orderBy('video_id');
    }

    public function latestSnapshotAtOrBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $cutoffAt,
    ): ?DanceShortVideoSnapshot {
        /*
         * current の収集時刻から comparisonDays 分だけ戻した cutoffAt を受け取り、
         * その時刻以前で最も新しい snapshot を previous として返します。
         * cutoff より後の snapshot は「比較期間に満たない観測値」なので、ここでは採用しません。
         */
        return DanceShortVideoSnapshot::query()
            ->where('video_id', $videoId)
            ->where('region_id', $regionId)
            ->where('collected_at', '<=', $cutoffAt->toDateTimeString())
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();
    }

    private function rankingRowsQuery(int $comparisonDays): Builder
    {
        $deltaExpression = $this->deltaExpression('current_snapshots', 'previous_snapshots');
        $growthExpression = $this->growthRateExpression('current_snapshots', 'previous_snapshots');
        $viewsPerHourExpression = $this->viewsPerHourExpression('current_snapshots', 'previous_snapshots');

        return $this->baseCurrentSnapshotQuery($comparisonDays)
            ->select([
                'videos.id as video_id',
                'videos.youtube_video_id',
                'videos.title',
                'videos.channel_title',
                'videos.thumbnail_url',
                'videos.url',
                'videos.published_at',
                'regions.code as region_code',
                'regions.name as region_name',
                'current_snapshots.view_count as current_view_count',
                'previous_snapshots.view_count as previous_view_count',
                'current_snapshots.like_count',
                'current_snapshots.comment_count',
                'current_snapshots.collected_at as current_collected_at',
                'previous_snapshots.collected_at as previous_collected_at',
                'previous_snapshots.id as previous_snapshot_id',
            ])
            ->selectRaw($deltaExpression.' as view_count_delta')
            ->selectRaw($growthExpression.' as view_growth_rate')
            ->selectRaw($viewsPerHourExpression.' as views_per_hour');
    }

    private function baseCurrentSnapshotQuery(int $comparisonDays): Builder
    {
        return DB::table('dance_short_video_snapshots as current_snapshots')
            ->join('dance_short_videos as videos', 'videos.id', '=', 'current_snapshots.video_id')
            ->join('dance_short_regions as regions', 'regions.id', '=', 'current_snapshots.region_id')
            ->leftJoin('dance_short_video_snapshots as previous_snapshots', function (JoinClause $join) use ($comparisonDays): void {
                $join->whereRaw(
                    'previous_snapshots.id = COALESCE(('.
                    $this->previousAtOrBeforeIdSql(
                        currentAlias: 'current_snapshots',
                        lookupAlias: 'previous_cutoff_snapshots',
                        comparisonDays: $comparisonDays,
                    ).
                    '), ('.
                    $this->previousBeforeIdSql(
                        currentAlias: 'current_snapshots',
                        lookupAlias: 'previous_fallback_snapshots',
                    ).
                    '))',
                );
            })
            ->where('videos.tracking_status', 'active')
            ->where('regions.is_active', true)
            ->whereNotExists(function (Builder $query): void {
                $query->selectRaw('1')
                    ->from('dance_short_video_snapshots as later_snapshots')
                    ->whereColumn('later_snapshots.video_id', 'current_snapshots.video_id')
                    ->whereColumn('later_snapshots.region_id', 'current_snapshots.region_id')
                    ->where(function (Builder $query): void {
                        $query->whereColumn(
                            'later_snapshots.collected_at',
                            '>',
                            'current_snapshots.collected_at',
                        )->orWhere(function (Builder $query): void {
                            $query->whereColumn(
                                'later_snapshots.collected_at',
                                'current_snapshots.collected_at',
                            )->whereColumn('later_snapshots.id', '>', 'current_snapshots.id');
                        });
                    });
            });
    }

    private function latestSnapshotIdSql(
        string $currentAlias,
        string $lookupAlias,
        string $regionIdExpression,
    ): string {
        return sprintf(
            'select %1$s.id from dance_short_video_snapshots as %1$s '.
            'where %1$s.video_id = %2$s.video_id '.
            'and %1$s.region_id = %3$s '.
            'order by %1$s.collected_at desc, %1$s.id desc limit 1',
            $lookupAlias,
            $currentAlias,
            $regionIdExpression,
        );
    }

    private function previousAtOrBeforeIdSql(
        string $currentAlias,
        string $lookupAlias,
        int $comparisonDays,
    ): string {
        return sprintf(
            'select %1$s.id from dance_short_video_snapshots as %1$s '.
            'where %1$s.video_id = %2$s.video_id '.
            'and %1$s.region_id = %2$s.region_id '.
            'and %1$s.collected_at <= %3$s '.
            'order by %1$s.collected_at desc, %1$s.id desc limit 1',
            $lookupAlias,
            $currentAlias,
            $this->previousCutoffExpression($currentAlias, $comparisonDays),
        );
    }

    private function previousBeforeIdSql(string $currentAlias, string $lookupAlias): string
    {
        return sprintf(
            'select %1$s.id from dance_short_video_snapshots as %1$s '.
            'where %1$s.video_id = %2$s.video_id '.
            'and %1$s.region_id = %2$s.region_id '.
            'and (%1$s.collected_at < %2$s.collected_at '.
            'or (%1$s.collected_at = %2$s.collected_at and %1$s.id < %2$s.id)) '.
            'order by %1$s.collected_at desc, %1$s.id desc limit 1',
            $lookupAlias,
            $currentAlias,
        );
    }

    private function previousCutoffExpression(string $currentAlias, int $comparisonDays): string
    {
        $safeComparisonDays = max(1, $comparisonDays);

        if (DB::connection()->getDriverName() === 'sqlite') {
            return sprintf("datetime(%s.collected_at, '-%d days')", $currentAlias, $safeComparisonDays);
        }

        return sprintf('DATE_SUB(%s.collected_at, INTERVAL %d DAY)', $currentAlias, $safeComparisonDays);
    }

    private function deltaExpression(string $currentAlias, string $previousAlias): string
    {
        return sprintf(
            'CASE WHEN %2$s.id IS NOT NULL THEN %3$s - %4$s ELSE NULL END',
            $currentAlias,
            $previousAlias,
            $this->signedViewCountExpression($currentAlias),
            $this->signedViewCountExpression($previousAlias),
        );
    }

    private function growthRateExpression(string $currentAlias, string $previousAlias): string
    {
        $deltaExpression = $this->deltaExpression($currentAlias, $previousAlias);

        return sprintf(
            'CASE WHEN %2$s.id IS NOT NULL AND %2$s.view_count > 0 '.
            'THEN (%3$s) * 1.0 / %2$s.view_count ELSE NULL END',
            $currentAlias,
            $previousAlias,
            $deltaExpression,
        );
    }

    private function viewsPerHourExpression(string $currentAlias, string $previousAlias): string
    {
        $deltaExpression = $this->deltaExpression($currentAlias, $previousAlias);
        $hoursExpression = DB::connection()->getDriverName() === 'sqlite'
            ? sprintf('(julianday(%s.collected_at) - julianday(%s.collected_at)) * 24.0', $currentAlias, $previousAlias)
            : sprintf('TIMESTAMPDIFF(SECOND, %s.collected_at, %s.collected_at) / 3600.0', $previousAlias, $currentAlias);

        return sprintf(
            'CASE WHEN %2$s.id IS NOT NULL AND %3$s > 0 '.
            'THEN (%4$s) * 1.0 / (%3$s) ELSE NULL END',
            $currentAlias,
            $previousAlias,
            $hoursExpression,
            $deltaExpression,
        );
    }

    private function signedViewCountExpression(string $alias): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return sprintf('CAST(%s.view_count AS INTEGER)', $alias);
        }

        return sprintf('CAST(%s.view_count AS SIGNED)', $alias);
    }

    private function orderRankingRows(Builder $query, string $sortKey): void
    {
        $deltaExpression = $this->deltaExpression('current_snapshots', 'previous_snapshots');
        $sortExpression = match ($sortKey) {
            'view_count_delta' => $deltaExpression,
            'view_growth_rate' => $this->growthRateExpression('current_snapshots', 'previous_snapshots'),
            'current_view_count' => 'current_snapshots.view_count',
            default => $this->viewsPerHourExpression('current_snapshots', 'previous_snapshots'),
        };

        $query
            ->orderByRaw('CASE WHEN previous_snapshots.id IS NULL THEN 1 ELSE 0 END ASC')
            ->orderByRaw('CASE WHEN previous_snapshots.id IS NOT NULL AND '.$sortExpression.' IS NULL THEN 1 ELSE 0 END ASC')
            ->orderByRaw('CASE WHEN previous_snapshots.id IS NOT NULL THEN '.$sortExpression.' ELSE NULL END DESC')
            ->orderByRaw('CASE WHEN previous_snapshots.id IS NOT NULL THEN '.$deltaExpression.' ELSE NULL END DESC')
            ->orderByRaw('CASE WHEN previous_snapshots.id IS NOT NULL THEN current_snapshots.view_count ELSE NULL END DESC')
            ->orderByRaw('CASE WHEN previous_snapshots.id IS NULL THEN current_snapshots.collected_at ELSE NULL END DESC')
            ->orderByRaw('CASE WHEN previous_snapshots.id IS NULL THEN current_snapshots.id ELSE NULL END DESC')
            ->orderBy('videos.id');
    }

    public function latestSnapshotBefore(
        int $videoId,
        int $regionId,
        CarbonInterface $currentCollectedAt,
        int $currentSnapshotId,
    ): ?DanceShortVideoSnapshot {
        /*
         * 初回同期から十分な日数が経っていない環境では、
         * current - comparisonDays 以前の snapshot がまだ存在しないことがあります。
         * その場合でも同じ video / region に直前 snapshot があれば通常ランキングとして表示できるため、
         * current より古い行を collected_at / id の stable tie-break で取得します。
         *
         * Repository は「current より古い DB 行」の取得条件だけを持ちます。
         * この fallback をいつ使うか、表示上どう扱うかは Action / Responder 側へ残します。
         */
        return DanceShortVideoSnapshot::query()
            ->where('video_id', $videoId)
            ->where('region_id', $regionId)
            ->where(function ($query) use ($currentCollectedAt, $currentSnapshotId): void {
                $query->where('collected_at', '<', $currentCollectedAt->toDateTimeString())
                    ->orWhere(function ($query) use ($currentCollectedAt, $currentSnapshotId): void {
                        $query->where('collected_at', $currentCollectedAt->toDateTimeString())
                            ->where('id', '<', $currentSnapshotId);
                    });
            })
            ->orderByDesc('collected_at')
            ->orderByDesc('id')
            ->first();
    }

    public function deleteCollectedBefore(CarbonInterface $cutoffAt): int
    {
        /*
         * 物理削除の対象は保持期間を超えた snapshot だけです。
         * video / region / keyword / category はここでは削除しません。
         */
        return DanceShortVideoSnapshot::query()
            ->where('collected_at', '<', $cutoffAt->toDateTimeString())
            ->delete();
    }
}
