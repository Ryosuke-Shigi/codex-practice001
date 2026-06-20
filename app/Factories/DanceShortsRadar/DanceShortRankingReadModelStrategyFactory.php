<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\Strategies\DanceShortsRadar\RankingReadModels\AllRankingReadModelStrategy;
use App\Strategies\DanceShortsRadar\RankingReadModels\DanceShortRankingReadModelStrategyInterface;
use App\Strategies\DanceShortsRadar\RankingReadModels\RegionRankingReadModelStrategy;
use App\Strategies\DanceShortsRadar\RankingReadModels\RisingRankingReadModelStrategy;

/**
 * read model 生成時の scope に対応する Strategy を返す Factory です。
 */
final readonly class DanceShortRankingReadModelStrategyFactory
{
    public function __construct(
        private RisingRankingReadModelStrategy $risingStrategy,
        private AllRankingReadModelStrategy $allRankingStrategy,
        private RegionRankingReadModelStrategy $regionRankingStrategy,
    ) {}

    public function make(string $scope): DanceShortRankingReadModelStrategyInterface
    {
        return match ($scope) {
            DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE => $this->risingStrategy,
            DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE => $this->allRankingStrategy,
            default => $this->regionRankingStrategy,
        };
    }
}
