<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;
use Carbon\CarbonImmutable;

/**
 * 保存済み snapshot からランキング候補 DTO を作る compatibility Query Action です。
 * 現在の displayCardField は DisplayCard Strategy から active read model を参照します。
 */
class GetDanceShortVideoRankingCandidatesAction
{
    public function __construct(
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
    ) {}

    public function execute(DanceShortVideoRankingConditionDTO $condition): DanceShortVideoRankingListDTO
    {
        /*
         * この Query Action は保存済み snapshot からランキング用 DTO を作るだけです。
         * YouTube API 呼び出し、Controller / Inertia props 生成、上昇候補判定は扱いません。
         */
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($condition->comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($condition->sortKey);
        $limit = max(1, $condition->limit);

        /*
         * Repository から取得する current は、指定 region の active 動画に紐づく最新 snapshot です。
         * Action は current 候補を受け取り、comparisonDays から previous cutoff を計算して、
         * 比較に必要なもう一方の snapshot を同じ Repository に取りに行きます。
         *
         * 表示件数 limit は、ここではまだ使いません。
         * current snapshot の新しさや Repository の返却順はランキング指標ではないため、
         * 全候補に対して previous を引き、metric を計算してから最後に絞り込みます。
         */
        $records = [];
        $currentSnapshots = $this->snapshotRepository->latestRankingSnapshotsByRegionCode(
            regionCode: $condition->regionCode,
        );

        foreach ($currentSnapshots as $currentSnapshot) {
            $currentCollectedAt = $currentSnapshot->collected_at;
            $cutoffAt = $currentCollectedAt->copy()->subDays($comparisonDays);
            $previousSnapshot = $this->snapshotRepository->latestSnapshotAtOrBefore(
                videoId: (int) $currentSnapshot->video_id,
                regionId: (int) $currentSnapshot->region_id,
                cutoffAt: $cutoffAt,
            );

            if ($previousSnapshot === null) {
                /*
                 * 本番投入直後やローカル確認直後は、snapshot が同日・同時間帯にしか存在しないことがあります。
                 * その状態で comparisonDays 以前の snapshot だけを要求すると、DB には current / previous が
                 * あるのに通常ランキングが 0 件になり、「本データ接続できていない」ように見えます。
                 *
                 * ここではまず comparisonDays どおりの比較元を探し、見つからない場合だけ直前 snapshot へ
                 * fallback します。直前 snapshot がある動画は比較 metric を算出できるため、
                 * current 1件だけの fallback 候補より上位グループとして扱います。
                 */
                $previousSnapshot = $this->snapshotRepository->latestSnapshotBefore(
                    videoId: (int) $currentSnapshot->video_id,
                    regionId: (int) $currentSnapshot->region_id,
                    currentCollectedAt: $currentCollectedAt,
                    currentSnapshotId: (int) $currentSnapshot->getKey(),
                );
            }

            /*
             * 差分や伸び率は Service の責務です。
             * Action は current / previous の Model を集め、Service の計算結果を DTO へ詰める進行表に留めます。
             * previous が最後まで見つからない current 1件だけの動画も、取得開始直後の通常ランキングを
             * 空画面にしないため fallback 候補として DTO 化します。その場合、Service には null を渡し、
             * viewCountDelta / viewGrowthRate / viewsPerHour を null のまま保ちます。
             */
            $metrics = $this->snapshotMetricService->calculateSnapshotMetrics(
                previousViewCount: $previousSnapshot?->view_count,
                previousCollectedAt: $previousSnapshot?->collected_at,
                currentViewCount: $currentSnapshot->view_count,
                currentCollectedAt: $currentCollectedAt,
            );
            $video = $currentSnapshot->video;
            $region = $currentSnapshot->region;

            /*
             * DTO は表示用 camelCase の値を運ぶ境界です。
             * DB カラム名や Eloquent Model をこの先の Responder / React 接続工程へ漏らさないよう、
             * Query Action の出口で必要な値だけを DTO に固定します。
             */
            $records[] = [
                'item' => new DanceShortVideoRankingItemDTO(
                    videoId: (int) $video->getKey(),
                    youtubeVideoId: (string) $video->youtube_video_id,
                    title: (string) $video->title,
                    channelTitle: $video->channel_title === null ? null : (string) $video->channel_title,
                    thumbnailUrl: $video->thumbnail_url === null ? null : (string) $video->thumbnail_url,
                    url: $video->url === null ? null : (string) $video->url,
                    publishedAt: $video->published_at,
                    regionCode: (string) $region->code,
                    regionName: (string) $region->name,
                    currentViewCount: (int) $currentSnapshot->view_count,
                    previousViewCount: $previousSnapshot === null ? null : (int) $previousSnapshot->view_count,
                    viewCountDelta: $metrics['viewCountDelta'],
                    viewGrowthRate: $metrics['viewGrowthRate'],
                    viewsPerHour: $metrics['viewsPerHour'],
                    likeCount: $currentSnapshot->like_count === null ? null : (int) $currentSnapshot->like_count,
                    commentCount: $currentSnapshot->comment_count === null ? null : (int) $currentSnapshot->comment_count,
                    currentCollectedAt: $currentCollectedAt,
                    previousCollectedAt: $previousSnapshot?->collected_at,
                    comparisonDays: $comparisonDays,
                    hasPreviousSnapshot: $previousSnapshot !== null,
                ),
                /*
                 * current 1件だけの fallback 候補同士は metric で比較できないため、
                 * Repository と同じ collected_at / id の新しい順で並べます。
                 * snapshot id は表示 props へは出さず、Action 内の安定 sort 用メタデータに留めます。
                 */
                'currentSnapshotId' => (int) $currentSnapshot->getKey(),
            ];
        }

        /*
         * limit はランキング sort 後にだけ適用します。
         * sort 前に絞ると、Repository の collected_at / id 順に左右され、
         * 本来は view_count_delta などで上位に来る動画が候補から消えるためです。
         */
        return new DanceShortVideoRankingListDTO(
            array_slice($this->sortedRecords($records, $sortKey), 0, $limit),
        );
    }

    /**
     * snapshot based compatibility query の通常ランキング window 取得用入口です。
     *
     * 現在の初期表示と先読み API は active read model を読む DisplayCard Strategy を使います。
     * この入口は snapshot 由来の候補 query と repository-level 検証のために残します。
     *
     * @param  array<int, string>  $regionCodes
     */
    public function executeWindowForRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
        int $startRank,
        int $windowSize,
    ): DanceShortVideoRankingListDTO {
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($sortKey);

        return new DanceShortVideoRankingListDTO(array_map(
            fn (object $row): DanceShortVideoRankingItemDTO => $this->rankingItemFromWindowRow($row, $comparisonDays),
            $this->snapshotRepository->rankingRowsWindowByRegionCodes(
                regionCodes: $regionCodes,
                comparisonDays: $comparisonDays,
                sortKey: $sortKey,
                startRank: $startRank,
                windowSize: $windowSize,
            ),
        ));
    }

    /**
     * snapshot based compatibility query の通常ランキング全体順取得用入口です。
     *
     * Action は snapshot row の DTO 化だけを担当し、選択カード前後の切り出しや表示 props 生成は
     * 呼び出し側へ残します。
     *
     * @param  array<int, string>  $regionCodes
     */
    public function executeForRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
    ): DanceShortVideoRankingListDTO {
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($sortKey);

        return new DanceShortVideoRankingListDTO(array_map(
            fn (object $row): DanceShortVideoRankingItemDTO => $this->rankingItemFromWindowRow($row, $comparisonDays),
            $this->snapshotRepository->rankingRowsByRegionCodes(
                regionCodes: $regionCodes,
                comparisonDays: $comparisonDays,
                sortKey: $sortKey,
            ),
        ));
    }

    /**
     * @param  array<int, DanceShortVideoRankingItemDTO>  $items
     * @return array<int, DanceShortVideoRankingItemDTO>
     */
    public function sortedItems(array $items, string $sortKey): array
    {
        /*
         * 既存の一覧 Query 利用側が複数 region の RankingItemDTO を集約するときも、
         * 地域別と同じ ranking sort を使えるよう公開しています。
         * ここでも metric の再計算は行わず、すでに DTO に入っている値だけを比較します。
         */
        $records = array_map(
            fn (DanceShortVideoRankingItemDTO $item): array => [
                'item' => $item,
                'currentSnapshotId' => 0,
            ],
            $items,
        );

        return $this->sortedRecords($records, $sortKey);
    }

    /**
     * @param  array<int, array{item: DanceShortVideoRankingItemDTO, currentSnapshotId: int}>  $records
     * @return array<int, DanceShortVideoRankingItemDTO>
     */
    private function sortedRecords(array $records, string $sortKey): array
    {
        /*
         * 並び順の最終適用は Query Action で行います。
         * Repository は DB 取得条件、Service は比較値計算に閉じ、ランキング表示としての順序は
         * ListDTO を返す直前のここへ集約します。
         */
        usort($records, function (
            array $firstRecord,
            array $secondRecord,
        ) use ($sortKey): int {
            $first = $firstRecord['item'];
            $second = $secondRecord['item'];

            /*
             * 比較可能な通常ランキング候補を、current 1件だけの fallback 候補より優先します。
             * fallback 候補の metric は null のため、単純な null 末尾 sort だけでは
             * current_view_count などの sortKey で混ざる可能性があります。
             */
            if ($first->hasPreviousSnapshot !== $second->hasPreviousSnapshot) {
                return $first->hasPreviousSnapshot ? -1 : 1;
            }

            if (! $first->hasPreviousSnapshot && ! $second->hasPreviousSnapshot) {
                return strcmp($second->currentCollectedAt->toDateTimeString(), $first->currentCollectedAt->toDateTimeString())
                    ?: ($secondRecord['currentSnapshotId'] <=> $firstRecord['currentSnapshotId'])
                    ?: ($first->videoId <=> $second->videoId);
            }

            $firstValue = $this->sortValue($first, $sortKey);
            $secondValue = $this->sortValue($second, $sortKey);

            /*
             * growthRate / viewsPerHour は計算不能な場合に null になります。
             * null を 0 扱いすると「実際に 0」なのか「算出不能」なのかが曖昧になるため、
             * 降順ソートでは null を末尾に寄せます。
             */
            if ($firstValue === null && $secondValue !== null) {
                return 1;
            }

            if ($firstValue !== null && $secondValue === null) {
                return -1;
            }

            return ($secondValue <=> $firstValue)
                ?: (($second->viewCountDelta ?? PHP_INT_MIN) <=> ($first->viewCountDelta ?? PHP_INT_MIN))
                ?: ($second->currentViewCount <=> $first->currentViewCount)
                ?: ($first->videoId <=> $second->videoId);
        });

        return array_map(
            fn (array $record): DanceShortVideoRankingItemDTO => $record['item'],
            $records,
        );
    }

    private function sortValue(DanceShortVideoRankingItemDTO $item, string $sortKey): int|float|null
    {
        return match ($sortKey) {
            'view_count_delta' => $item->viewCountDelta,
            'view_growth_rate' => $item->viewGrowthRate,
            'current_view_count' => $item->currentViewCount,
            default => $item->viewsPerHour,
        };
    }

    private function rankingItemFromWindowRow(object $row, int $comparisonDays): DanceShortVideoRankingItemDTO
    {
        return new DanceShortVideoRankingItemDTO(
            videoId: (int) $row->video_id,
            youtubeVideoId: (string) $row->youtube_video_id,
            title: (string) $row->title,
            channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
            thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
            url: $row->url === null ? null : (string) $row->url,
            publishedAt: $row->published_at === null ? null : $this->parseApplicationDate((string) $row->published_at),
            regionCode: (string) $row->region_code,
            regionName: (string) $row->region_name,
            currentViewCount: (int) $row->current_view_count,
            previousViewCount: $row->previous_view_count === null ? null : (int) $row->previous_view_count,
            viewCountDelta: $row->view_count_delta === null ? null : (int) $row->view_count_delta,
            viewGrowthRate: $row->view_growth_rate === null ? null : (float) $row->view_growth_rate,
            viewsPerHour: $row->views_per_hour === null ? null : (float) $row->views_per_hour,
            likeCount: $row->like_count === null ? null : (int) $row->like_count,
            commentCount: $row->comment_count === null ? null : (int) $row->comment_count,
            currentCollectedAt: $this->parseApplicationDate((string) $row->current_collected_at),
            previousCollectedAt: $row->previous_collected_at === null ? null : $this->parseApplicationDate((string) $row->previous_collected_at),
            comparisonDays: $comparisonDays,
            hasPreviousSnapshot: $row->previous_snapshot_id !== null,
        );
    }

    private function parseApplicationDate(string $value): CarbonImmutable
    {
        return CarbonImmutable::parse($value, (string) config('app.timezone', 'Asia/Tokyo'));
    }
}
