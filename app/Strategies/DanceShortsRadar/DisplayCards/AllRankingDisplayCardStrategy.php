<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;

final readonly class AllRankingDisplayCardStrategy extends RegionRankingDisplayCardStrategy
{
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        return $this->rankingWindow(
            condition: $condition,
            regionCodes: $condition->activeRegionCodes,
            emptyMessage: count($condition->activeRegionCodes) > 0
                ? '表示できる通常ランキング候補はまだありません。'
                : '有効な地域がまだ登録されていません。',
        );
    }
}
