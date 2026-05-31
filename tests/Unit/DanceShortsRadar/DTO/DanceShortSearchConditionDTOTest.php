<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortSearchConditionDTOTest extends TestCase
{
    public function test_to_array_returns_youtube_search_query_conditions(): void
    {
        $publishedAfter = CarbonImmutable::parse('2026-05-24 00:00:00', 'UTC');

        $dto = new DanceShortSearchConditionDTO(
            keyword: 'dance shorts',
            regionCode: 'JP',
            relevanceLanguage: 'ja',
            maxResults: 25,
            publishedAfter: $publishedAfter,
            videoDuration: 'short',
        );

        $this->assertSame([
            'q' => 'dance shorts',
            'regionCode' => 'JP',
            'relevanceLanguage' => 'ja',
            'maxResults' => 25,
            'publishedAfter' => '2026-05-24T00:00:00+00:00',
            'videoDuration' => 'short',
        ], $dto->toArray());
    }
}
