<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;

class GetDanceShortVideoRankingCandidatesAction
{
    public function __construct(
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
    ) {
    }

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
         */
        $items = [];
        $currentSnapshots = $this->snapshotRepository->latestRankingSnapshotsByRegionCode(
            regionCode: $condition->regionCode,
            limit: $limit,
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
                 * 初期方針では previous がない動画はランキング対象外にします。
                 * current だけでカードを作ると増加量・伸び率・時間あたり増加数の意味が崩れるため、
                 * ここでは空の指標を持つ DTO にはせず、候補から外します。
                 */
                continue;
            }

            /*
             * 差分や伸び率は Service の責務です。
             * Action は current / previous の Model を集め、Service の計算結果を DTO へ詰める進行表に留めます。
             */
            $metrics = $this->snapshotMetricService->calculateSnapshotMetrics(
                previousViewCount: $previousSnapshot->view_count,
                previousCollectedAt: $previousSnapshot->collected_at,
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
            $items[] = new DanceShortVideoRankingItemDTO(
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
                previousViewCount: (int) $previousSnapshot->view_count,
                viewCountDelta: (int) $metrics['viewCountDelta'],
                viewGrowthRate: $metrics['viewGrowthRate'],
                viewsPerHour: $metrics['viewsPerHour'],
                currentCollectedAt: $currentCollectedAt,
                previousCollectedAt: $previousSnapshot->collected_at,
                comparisonDays: $comparisonDays,
            );
        }

        return new DanceShortVideoRankingListDTO(
            array_slice($this->sortedItems($items, $sortKey), 0, $limit),
        );
    }

    /**
     * @param  array<int, DanceShortVideoRankingItemDTO>  $items
     * @return array<int, DanceShortVideoRankingItemDTO>
     */
    private function sortedItems(array $items, string $sortKey): array
    {
        /*
         * 並び順の最終適用は Query Action で行います。
         * Repository は DB 取得条件、Service は比較値計算に閉じ、ランキング表示としての順序は
         * ListDTO を返す直前のここへ集約します。
         */
        usort($items, function (
            DanceShortVideoRankingItemDTO $first,
            DanceShortVideoRankingItemDTO $second,
        ) use ($sortKey): int {
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
                ?: ($second->viewCountDelta <=> $first->viewCountDelta)
                ?: ($second->currentViewCount <=> $first->currentViewCount)
                ?: ($first->videoId <=> $second->videoId);
        });

        return $items;
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
}
