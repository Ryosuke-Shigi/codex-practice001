<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\Actions\DanceShortsRadar\Queries\GetDanceShortVideoRankingCandidatesAction;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;

/**
 * ALL タブ用の通常ランキング表示カード Strategy です。
 *
 * まとめは read model の500件制限に巻き込まず、snapshot 由来のランキング window を参照します。
 */
final readonly class AllRankingDisplayCardStrategy implements DanceShortDisplayCardStrategyInterface
{
    public function __construct(
        private GetDanceShortVideoRankingCandidatesAction $rankingCandidatesAction,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
    ) {}

    /**
     * active region 全体から通常ランキングの表示カード window を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        $windowStartRank = $condition->startRank;
        $selectedRank = null;

        if ($condition->selectedVideoId !== null) {
            $allItems = $this->rankingCandidatesAction->executeForRegionCodes(
                regionCodes: $condition->activeRegionCodes,
                comparisonDays: $condition->comparisonDays,
                sortKey: $condition->sortKey,
            )->items;
            $selectedRank = $this->rankForVideo($allItems, $condition->selectedVideoId);
            $windowStartRank = $selectedRank === null
                ? 1
                : $this->displayCardWindowService->startRankAroundSelectedRank(
                    selectedRank: $selectedRank,
                    totalItemCount: count($allItems),
                    windowSize: $condition->windowSize,
                );
        }

        $rankingItems = $this->rankingCandidatesAction->executeWindowForRegionCodes(
            regionCodes: $condition->activeRegionCodes,
            comparisonDays: $condition->comparisonDays,
            sortKey: $condition->sortKey,
            startRank: $windowStartRank,
            windowSize: $condition->windowSize,
        )->items;
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
            emptyMessage: count($visibleItems) === 0
                ? (count($condition->activeRegionCodes) > 0
                    ? '表示できる通常ランキング候補はまだありません。'
                    : '有効な地域がまだ登録されていません。')
                : null,
        ));
    }

    /**
     * @param  array<int, DanceShortVideoRankingItemDTO>  $items
     */
    private function rankForVideo(array $items, int $videoId): ?int
    {
        foreach ($items as $index => $item) {
            if ($item->videoId === $videoId) {
                return $index + 1;
            }
        }

        return null;
    }
}
