<?php

namespace Tests\Unit\DanceShortsRadar\Factories;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\Factories\DanceShortsRadar\DanceShortRankingReadModelStrategyFactory;
use App\Strategies\DanceShortsRadar\RankingReadModels\AllRankingReadModelStrategy;
use App\Strategies\DanceShortsRadar\RankingReadModels\RegionRankingReadModelStrategy;
use App\Strategies\DanceShortsRadar\RankingReadModels\RisingRankingReadModelStrategy;
use InvalidArgumentException;
use Tests\TestCase;

class DanceShortRankingReadModelStrategyFactoryTest extends TestCase
{
    public function test_it_returns_region_strategy_for_normal_patterns(): void
    {
        $strategy = app(DanceShortRankingReadModelStrategyFactory::class)->make($this->definition(
            rankingType: RankingReadModelPatternDefinitionDTO::TYPE_NORMAL,
            scope: 'JP',
        ));

        $this->assertInstanceOf(RegionRankingReadModelStrategy::class, $strategy);
    }

    public function test_it_returns_all_strategy_for_summary_patterns(): void
    {
        $strategy = app(DanceShortRankingReadModelStrategyFactory::class)->make($this->definition(
            rankingType: RankingReadModelPatternDefinitionDTO::TYPE_SUMMARY,
            scope: 'ALL',
        ));

        $this->assertInstanceOf(AllRankingReadModelStrategy::class, $strategy);
    }

    public function test_it_returns_rising_strategy_for_rising_patterns(): void
    {
        $strategy = app(DanceShortRankingReadModelStrategyFactory::class)->make($this->definition(
            rankingType: RankingReadModelPatternDefinitionDTO::TYPE_RISING,
            scope: 'RISING',
            sortKey: '__rising',
        ));

        $this->assertInstanceOf(RisingRankingReadModelStrategy::class, $strategy);
    }

    public function test_it_rejects_unknown_ranking_type(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Unsupported ranking read model type [unknown].');

        app(DanceShortRankingReadModelStrategyFactory::class)->make($this->definition(
            rankingType: 'unknown',
            scope: 'JP',
        ));
    }

    private function definition(
        string $rankingType,
        string $scope,
        string $sortKey = 'view_count_delta',
    ): RankingReadModelPatternDefinitionDTO {
        return new RankingReadModelPatternDefinitionDTO(
            patternKey: implode('|', [$rankingType, $scope, 1, $sortKey]),
            rankingType: $rankingType,
            scope: $scope,
            comparisonDays: 1,
            sortKey: $sortKey,
            maxRows: $rankingType === RankingReadModelPatternDefinitionDTO::TYPE_NORMAL ? 500 : 0,
        );
    }
}
