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
            likeCount: 789,
            commentCount: 12,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
            previousCollectedAt: CarbonImmutable::parse('2026-05-30 12:00:00', 'UTC'),
            comparisonDays: 1,
            hasPreviousSnapshot: true,
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
            'likeCount' => 789,
            'commentCount' => 12,
            'currentCollectedAt' => '2026-05-31T12:00:00+00:00',
            'previousCollectedAt' => '2026-05-30T12:00:00+00:00',
            'comparisonDays' => 1,
            'hasPreviousSnapshot' => true,
        ], $dto->toArray());

        $this->assertArrayNotHasKey('view_count_delta', $dto->toArray());
        $this->assertArrayNotHasKey('view_growth_rate', $dto->toArray());
        $this->assertArrayNotHasKey('views_per_hour', $dto->toArray());
        $this->assertArrayNotHasKey('like_count', $dto->toArray());
        $this->assertArrayNotHasKey('comment_count', $dto->toArray());
    }

    public function test_to_array_keeps_null_metrics_for_items_without_previous_snapshot(): void
    {
        $dto = new DanceShortVideoRankingItemDTO(
            videoId: 11,
            youtubeVideoId: 'youtube-002',
            title: 'Initial observed short',
            channelTitle: null,
            thumbnailUrl: null,
            url: null,
            publishedAt: null,
            regionCode: 'JP',
            regionName: '日本',
            currentViewCount: 1200,
            previousViewCount: null,
            viewCountDelta: null,
            viewGrowthRate: null,
            viewsPerHour: null,
            likeCount: null,
            commentCount: null,
            currentCollectedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'UTC'),
            previousCollectedAt: null,
            comparisonDays: 1,
            hasPreviousSnapshot: false,
        );

        $array = $dto->toArray();

        $this->assertSame(1200, $array['currentViewCount']);
        $this->assertNull($array['previousViewCount']);
        $this->assertNull($array['viewCountDelta']);
        $this->assertNull($array['viewGrowthRate']);
        $this->assertNull($array['viewsPerHour']);
        $this->assertNull($array['previousCollectedAt']);
        $this->assertFalse($array['hasPreviousSnapshot']);
    }
}
