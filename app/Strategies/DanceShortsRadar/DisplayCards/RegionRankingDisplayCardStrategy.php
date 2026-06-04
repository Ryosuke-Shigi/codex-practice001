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

readonly class RegionRankingDisplayCardStrategy implements DanceShortDisplayCardStrategyInterface
{
    public function __construct(
        private GetDanceShortVideoRankingCandidatesAction $rankingCandidatesAction,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
    ) {
    }

    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        $regionCodes = in_array($condition->selectedTabCode, $condition->activeRegionCodes, true)
            ? [$condition->selectedTabCode]
            : [];

        return $this->rankingWindow(
            condition: $condition,
            regionCodes: $regionCodes,
            emptyMessage: count($condition->activeRegionCodes) > 0
                ? '表示できる通常ランキング候補はまだありません。'
                : '有効な地域がまだ登録されていません。',
        );
    }

    /**
     * @param  array<int, string>  $regionCodes
     */
    protected function rankingWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
        array $regionCodes,
        string $emptyMessage,
    ): DanceShortDisplayCardWindowDTO {
        /*
         * 通常ランキング Strategy は、選択済み region または ALL 用 region 群だけを
         * RankingCandidatesAction の window 入口へ渡します。ここで受け取る rankingList は
         * windowSize + 1 件の lookahead を含むため、全件集約や React 側の再 sort は不要です。
         */
        $rankingList = $this->rankingCandidatesAction->executeWindowForRegionCodes(
            regionCodes: $regionCodes,
            comparisonDays: $condition->comparisonDays,
            sortKey: $condition->sortKey,
            startRank: $condition->startRank,
            windowSize: $condition->windowSize,
        );
        $window = $this->displayCardWindowService->buildWindowFromLookahead(
            lookaheadItems: $rankingList->items,
            startRank: $condition->startRank,
            windowSize: $condition->windowSize,
        );
        $visibleItems = $window['visibleItems'];

        return new DanceShortDisplayCardWindowDTO(new DanceShortDisplayCardFieldDTO(
            type: DanceShortDisplayCardFieldDTO::TYPE_RANKING,
            visibleCards: new DanceShortDisplayCardListDTO(array_map(
                fn (DanceShortVideoRankingItemDTO $item): DanceShortRankingDisplayCardDTO => new DanceShortRankingDisplayCardDTO($item),
                $visibleItems,
            )),
            activeIndex: 0,
            activeRank: $this->displayCardWindowService->activeRankFor(
                startRank: $condition->startRank,
                activeIndex: 0,
                hasVisibleCards: count($visibleItems) > 0,
            ),
            pagination: $window['pagination'],
            emptyMessage: count($visibleItems) === 0 ? $emptyMessage : null,
        ));
    }
}
