<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\Strategies\DanceShortsRadar\RankingReadModels\AllRankingReadModelStrategy;
use App\Strategies\DanceShortsRadar\RankingReadModels\DanceShortRankingReadModelStrategyInterface;
use App\Strategies\DanceShortsRadar\RankingReadModels\RegionRankingReadModelStrategy;
use App\Strategies\DanceShortsRadar\RankingReadModels\RisingRankingReadModelStrategy;
use InvalidArgumentException;

/**
 * ranking read model の生成 Strategy を ranking type ごとに返す Factory です。
 */
final readonly class DanceShortRankingReadModelStrategyFactory
{
    public function __construct(
        private RegionRankingReadModelStrategy $regionRankingStrategy,
        private AllRankingReadModelStrategy $allRankingStrategy,
        private RisingRankingReadModelStrategy $risingRankingStrategy,
    ) {}

    public function make(RankingReadModelPatternDefinitionDTO $definition): DanceShortRankingReadModelStrategyInterface
    {
        return match ($definition->rankingType) {
            RankingReadModelPatternDefinitionDTO::TYPE_NORMAL => $this->regionRankingStrategy,
            RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY => $this->allRankingStrategy,
            RankingReadModelPatternDefinitionDTO::TYPE_RISING => $this->risingRankingStrategy,
            default => throw new InvalidArgumentException(
                "Unsupported ranking read model type [{$definition->rankingType}]."
            ),
        };
    }
}
