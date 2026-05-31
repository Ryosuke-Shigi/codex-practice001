<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortVideoRankingItemDTOTest extends TestCase
{
    public function test_to_array_returns_display_camel_case_keys(): void
    {
        $dto = new DanceShortVideoRankingItemDTO(
            videoId: 10,
            youtubeVideoId: 'youtube-001',
            title: 'Dance short',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/thumb.jpg',
            url: 'https://www.youtube.com/shorts/youtube-001',
            publishedAt: CarbonImmutable::parse('2026-05-30 09:00:00', 'UTC'),
            regionCode: 'JP',
            regionName: '日本',
            currentViewCount: 1000,
            previousViewCount: 700,
            viewCountDelta: 300,
            viewGrowthRate: 300 / 700,
            viewsPerHour: 12.5,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
            previousCollectedAt: CarbonImmutable::parse('2026-05-30 12:00:00', 'UTC'),
            comparisonDays: 1,
        );

        $this->assertSame([
            'videoId' => 10,
            'youtubeVideoId' => 'youtube-001',
            'title' => 'Dance short',
            'channelTitle' => 'Dance Channel',
            'thumbnailUrl' => 'https://example.test/thumb.jpg',
            'url' => 'https://www.youtube.com/shorts/youtube-001',
            'publishedAt' => '2026-05-30T09:00:00+00:00',
            'regionCode' => 'JP',
            'regionName' => '日本',
            'currentViewCount' => 1000,
            'previousViewCount' => 700,
            'viewCountDelta' => 300,
            'viewGrowthRate' => 300 / 700,
            'viewsPerHour' => 12.5,
            'currentCollectedAt' => '2026-05-31T12:00:00+00:00',
            'previousCollectedAt' => '2026-05-30T12:00:00+00:00',
            'comparisonDays' => 1,
        ], $dto->toArray());

        $this->assertArrayNotHasKey('view_count_delta', $dto->toArray());
        $this->assertArrayNotHasKey('view_growth_rate', $dto->toArray());
        $this->assertArrayNotHasKey('views_per_hour', $dto->toArray());
    }
}
