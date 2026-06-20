<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
use Carbon\CarbonImmutable;

/**
 * 地域別通常ランキングの表示カード Strategy です。
 *
 * 選択中 region のランキング取得を担当し、Action から Repository 条件分岐を隠します。
 * selectedVideoId 指定時の前後 window 切り出しは Service へ委譲します。
 */
readonly class RegionRankingDisplayCardStrategy implements DanceShortDisplayCardStrategyInterface
{
    public function __construct(
        private DanceShortRankingReadModelRepositoryInterface $readModelRepository,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
    ) {}

    /**
     * 選択中 region だけを対象に通常ランキングの表示カード window を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        $scope = in_array($condition->selectedTabCode, $condition->activeRegionCodes, true)
            ? $condition->selectedTabCode
            : null;

        return $this->rankingWindow(
            condition: $condition,
            scope: $scope,
            emptyMessage: count($condition->activeRegionCodes) > 0
                ? '表示できる通常ランキング候補はまだありません。'
                : '有効な地域がまだ登録されていません。',
        );
    }

    protected function rankingWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
        ?string $scope,
        string $emptyMessage,
    ): DanceShortDisplayCardWindowDTO {
        $windowStartRank = $condition->startRank;

        if ($scope === null) {
            $rankingItems = [];
            $window = $this->displayCardWindowService->buildWindowFromLookahead(
                lookaheadItems: $rankingItems,
                startRank: $windowStartRank,
                windowSize: $condition->windowSize,
            );
        } elseif ($condition->selectedVideoId === null) {
            $rankingItems = $this->rankingItemsFromRows($this->readModelRepository->activeRowsWindow(
                scope: $scope,
                comparisonDays: $condition->comparisonDays,
                sortKey: $condition->sortKey,
                startRank: $condition->startRank,
                windowSize: $condition->windowSize,
            ));
            $window = $this->displayCardWindowService->buildWindowFromLookahead(
                lookaheadItems: $rankingItems,
                startRank: $windowStartRank,
                windowSize: $condition->windowSize,
            );
        } else {
            $selectedRank = $this->readModelRepository->activeRankForVideo(
                scope: $scope,
                comparisonDays: $condition->comparisonDays,
                sortKey: $condition->sortKey,
                videoId: $condition->selectedVideoId,
            );
            $windowStartRank = $selectedRank === null
                ? 1
                : $this->displayCardWindowService->startRankAroundSelectedRank(
                    selectedRank: $selectedRank,
                    totalItemCount: $this->readModelRepository->activeRowCount(
                        scope: $scope,
                        comparisonDays: $condition->comparisonDays,
                        sortKey: $condition->sortKey,
                    ),
                    windowSize: $condition->windowSize,
                );
            $rankingItems = $this->rankingItemsFromRows($this->readModelRepository->activeRowsWindow(
                scope: $scope,
                comparisonDays: $condition->comparisonDays,
                sortKey: $condition->sortKey,
                startRank: $windowStartRank,
                windowSize: $condition->windowSize,
            ));
            $window = $this->displayCardWindowService->buildWindowFromLookahead(
                lookaheadItems: $rankingItems,
                startRank: $windowStartRank,
                windowSize: $condition->windowSize,
            );

            if ($selectedRank !== null && count($window['visibleItems']) > 0) {
                $window['activeIndex'] = min(
                    max(0, $selectedRank - $windowStartRank),
                    count($window['visibleItems']) - 1,
                );
                $window['activeRank'] = $this->displayCardWindowService->activeRankFor(
                    startRank: $windowStartRank,
                    activeIndex: $window['activeIndex'],
                    hasVisibleCards: true,
                );
            }
        }
        $visibleItems = $window['visibleItems'];
        $activeIndex = $window['activeIndex'] ?? 0;
        $activeRank = $window['activeRank'] ?? $this->displayCardWindowService->activeRankFor(
            startRank: $windowStartRank,
            activeIndex: 0,
            hasVisibleCards: count($visibleItems) > 0,
        );

        return new DanceShortDisplayCardWindowDTO(new DanceShortDisplayCardFieldDTO(
            type: DanceShortDisplayCardFieldDTO::TYPE_RANKING,
            visibleCards: new DanceShortDisplayCardListDTO(array_map(
                fn (DanceShortVideoRankingItemDTO $item): DanceShortRankingDisplayCardDTO => new DanceShortRankingDisplayCardDTO($item),
                $visibleItems,
            )),
            activeIndex: $activeIndex,
            activeRank: $activeRank,
            pagination: $window['pagination'],
            emptyMessage: count($visibleItems) === 0 ? $emptyMessage : null,
        ));
    }

    /**
     * @param  array<int, object>  $rows
     * @return array<int, DanceShortVideoRankingItemDTO>
     */
    private function rankingItemsFromRows(array $rows): array
    {
        return array_map(
            fn (object $row): DanceShortVideoRankingItemDTO => new DanceShortVideoRankingItemDTO(
                videoId: (int) $row->video_id,
                youtubeVideoId: (string) $row->youtube_video_id,
                title: (string) $row->title,
                channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
                thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
                url: $row->youtube_url === null ? null : (string) $row->youtube_url,
                publishedAt: $row->published_at === null ? null : $this->parseApplicationDate((string) $row->published_at),
                regionCode: (string) $row->region_code,
                regionName: $row->region_name === null ? (string) $row->region_code : (string) $row->region_name,
                currentViewCount: (int) $row->current_view_count,
                previousViewCount: $row->previous_view_count === null ? null : (int) $row->previous_view_count,
                viewCountDelta: $row->view_count_delta === null ? null : (int) $row->view_count_delta,
                viewGrowthRate: $row->view_growth_rate === null ? null : (float) $row->view_growth_rate,
                viewsPerHour: $row->views_per_hour === null ? null : (float) $row->views_per_hour,
                likeCount: $row->like_count === null ? null : (int) $row->like_count,
                commentCount: $row->comment_count === null ? null : (int) $row->comment_count,
                currentCollectedAt: $this->parseApplicationDate((string) $row->current_collected_at),
                previousCollectedAt: $row->previous_collected_at === null ? null : $this->parseApplicationDate((string) $row->previous_collected_at),
                comparisonDays: (int) $row->comparison_days,
                hasPreviousSnapshot: (bool) $row->has_previous_snapshot,
            ),
            $rows,
        );
    }

    private function parseApplicationDate(string $value): CarbonImmutable
    {
        return CarbonImmutable::parse($value, (string) config('app.timezone', 'Asia/Tokyo'));
    }
}
