<?php

namespace App\Factories\DanceShortsRadar;

use App\Strategies\DanceShortsRadar\RankingReadModels\DanceShortRankingReadModelStrategyInterface;
use App\Strategies\DanceShortsRadar\RankingReadModels\RegionRankingReadModelStrategy;

/**
 * 通常ランキング read model の生成 Strategy を返す Factory です。
 */
final readonly class DanceShortRankingReadModelStrategyFactory
{
    public function __construct(
        private RegionRankingReadModelStrategy $regionRankingStrategy,
    ) {}

    public function make(string $scope): DanceShortRankingReadModelStrategyInterface
    {
        return $this->regionRankingStrategy;
    }
}
