<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;

/**
 * ALL タブ用の通常ランキング表示カード Strategy です。
 *
 * active region 全体を対象にし、window 切り出しや空表示メッセージだけを担当します。
 */
final readonly class AllRankingDisplayCardStrategy extends RegionRankingDisplayCardStrategy
{
    /**
     * active region 全体から通常ランキングの表示カード window を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        return $this->rankingWindow(
            condition: $condition,
            scope: DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE,
            emptyMessage: count($condition->activeRegionCodes) > 0
                ? '表示できる通常ランキング候補はまだありません。'
                : '有効な地域がまだ登録されていません。',
        );
    }
}
