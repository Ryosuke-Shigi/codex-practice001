<?php

namespace Tests\Unit\DanceShortsRadar\Factories;

use App\Factories\DanceShortsRadar\DanceShortDisplayCardStrategyFactory;
use App\Strategies\DanceShortsRadar\DisplayCards\AllRankingDisplayCardStrategy;
use App\Strategies\DanceShortsRadar\DisplayCards\RegionRankingDisplayCardStrategy;
use App\Strategies\DanceShortsRadar\DisplayCards\RisingDisplayCardStrategy;
use Tests\TestCase;

class DanceShortDisplayCardStrategyFactoryTest extends TestCase
{
    public function test_it_returns_rising_strategy_for_rising_tab(): void
    {
        $strategy = app(DanceShortDisplayCardStrategyFactory::class)->make('RISING');

        $this->assertInstanceOf(RisingDisplayCardStrategy::class, $strategy);
    }

    public function test_it_returns_all_ranking_strategy_for_all_tab(): void
    {
        $strategy = app(DanceShortDisplayCardStrategyFactory::class)->make('ALL');

        $this->assertInstanceOf(AllRankingDisplayCardStrategy::class, $strategy);
    }

    public function test_it_returns_region_strategy_for_supported_regions(): void
    {
        $factory = app(DanceShortDisplayCardStrategyFactory::class);

        $this->assertInstanceOf(RegionRankingDisplayCardStrategy::class, $factory->make('JP'));
        $this->assertInstanceOf(RegionRankingDisplayCardStrategy::class, $factory->make('US'));
        $this->assertInstanceOf(RegionRankingDisplayCardStrategy::class, $factory->make('KR'));
    }

    public function test_unknown_tab_falls_back_to_rising_strategy(): void
    {
        $strategy = app(DanceShortDisplayCardStrategyFactory::class)->make('UNKNOWN');

        $this->assertInstanceOf(RisingDisplayCardStrategy::class, $strategy);
    }
}
