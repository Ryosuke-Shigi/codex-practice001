<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\Strategies\DanceShortsRadar\DisplayCards\AllRankingDisplayCardStrategy;
use App\Strategies\DanceShortsRadar\DisplayCards\DanceShortDisplayCardStrategyInterface;
use App\Strategies\DanceShortsRadar\DisplayCards\RegionRankingDisplayCardStrategy;
use App\Strategies\DanceShortsRadar\DisplayCards\RisingDisplayCardStrategy;

final readonly class DanceShortDisplayCardStrategyFactory
{
    public function __construct(
        private RisingDisplayCardStrategy $risingStrategy,
        private AllRankingDisplayCardStrategy $allRankingStrategy,
        private RegionRankingDisplayCardStrategy $regionRankingStrategy,
    ) {}

    public function make(string $selectedTabCode): DanceShortDisplayCardStrategyInterface
    {
        /*
         * selectedTabCode は DanceShortDisplayCardTabService で「画面タブ」として解決済みです。
         * Factory はその値から取得方式だけを選び、Action に RISING / ALL / 地域別の分岐を
         * 増やさないための境界として使います。
         */
        return match ($selectedTabCode) {
            DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE => $this->allRankingStrategy,
            'JP', 'US', 'KR' => $this->regionRankingStrategy,
            default => $this->risingStrategy,
        };
    }
}
