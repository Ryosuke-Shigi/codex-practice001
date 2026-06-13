<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\Strategies\DanceShortsRadar\DisplayCards\AllRankingDisplayCardStrategy;
use App\Strategies\DanceShortsRadar\DisplayCards\DanceShortDisplayCardStrategyInterface;
use App\Strategies\DanceShortsRadar\DisplayCards\RegionRankingDisplayCardStrategy;
use App\Strategies\DanceShortsRadar\DisplayCards\RisingDisplayCardStrategy;

/**
 * DanceShortsRadar の表示カード取得方式をタブ値から選ぶ Factory です。
 *
 * Action から RISING / ALL / 地域別の Strategy 選択を分離し、各 Strategy には取得差分だけを持たせます。
 * ここにランキング条件の計算や Repository query は置きません。
 */
final readonly class DanceShortDisplayCardStrategyFactory
{
    public function __construct(
        private RisingDisplayCardStrategy $risingStrategy,
        private AllRankingDisplayCardStrategy $allRankingStrategy,
        private RegionRankingDisplayCardStrategy $regionRankingStrategy,
    ) {}

    /**
     * 選択済みタブに対応する表示カード Strategy を返します。
     */
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
