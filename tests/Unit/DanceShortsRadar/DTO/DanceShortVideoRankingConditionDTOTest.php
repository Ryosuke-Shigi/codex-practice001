<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use PHPUnit\Framework\TestCase;

class DanceShortVideoRankingConditionDTOTest extends TestCase
{
    public function test_it_holds_ranking_query_conditions_with_defaults(): void
    {
        $dto = new DanceShortVideoRankingConditionDTO(regionCode: 'JP');

        $this->assertSame('JP', $dto->regionCode);
        $this->assertSame(7, $dto->comparisonDays);
        $this->assertSame(20, $dto->limit);
        $this->assertSame('views_per_hour', $dto->sortKey);
        $this->assertSame([
            'regionCode' => 'JP',
            'comparisonDays' => 7,
            'limit' => 20,
            'sortKey' => 'views_per_hour',
        ], $dto->toArray());
    }

    public function test_comparison_days_candidates_follow_the_mock_screen(): void
    {
        $this->assertSame([1, 3, 7, 14, 30], DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS);
        $this->assertNotContains(8, DanceShortVideoRankingConditionDTO::ALLOWED_COMPARISON_DAYS);
    }

    public function test_it_holds_explicit_region_comparison_days_limit_and_sort_key(): void
    {
        $dto = new DanceShortVideoRankingConditionDTO(
            regionCode: 'US',
            comparisonDays: 14,
            limit: 5,
            sortKey: 'view_count_delta',
        );

        $this->assertSame('US', $dto->regionCode);
        $this->assertSame(14, $dto->comparisonDays);
        $this->assertSame(5, $dto->limit);
        $this->assertSame('view_count_delta', $dto->sortKey);
    }

    public function test_sort_key_candidates_are_fixed(): void
    {
        $this->assertSame([
            'views_per_hour',
            'view_count_delta',
            'view_growth_rate',
            'current_view_count',
        ], DanceShortVideoRankingConditionDTO::ALLOWED_SORT_KEYS);
    }
}
