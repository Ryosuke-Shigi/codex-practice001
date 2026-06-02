<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use PHPUnit\Framework\TestCase;

class DanceShortVideoRankingPageInputDTOTest extends TestCase
{
    public function test_it_holds_page_query_conditions(): void
    {
        $dto = new DanceShortVideoRankingPageInputDTO(
            regionCode: 'RISING',
            comparisonDays: 3,
            limit: 10,
            sortKey: 'view_count_delta',
        );

        $this->assertSame([
            'regionCode' => 'RISING',
            'comparisonDays' => 3,
            'limit' => 10,
            'sortKey' => 'view_count_delta',
            'startRank' => 1,
            'windowSize' => 5,
        ], $dto->toArray());
    }

    public function test_region_query_candidates_are_fixed_to_display_tabs_and_seeded_regions(): void
    {
        $this->assertSame([
            'RISING',
            'ALL',
            'JP',
            'US',
            'KR',
        ], DanceShortVideoRankingPageInputDTO::ALLOWED_REGION_QUERY_VALUES);
    }
}
