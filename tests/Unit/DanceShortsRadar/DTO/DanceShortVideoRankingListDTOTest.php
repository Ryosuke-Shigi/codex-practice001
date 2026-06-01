<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortVideoRankingListDTOTest extends TestCase
{
    public function test_to_array_returns_items(): void
    {
        $list = new DanceShortVideoRankingListDTO([
            $this->item(videoId: 1, title: 'First short'),
            $this->item(videoId: 2, title: 'Second short'),
        ]);

        $array = $list->toArray();

        $this->assertCount(2, $array['items']);
        $this->assertSame('First short', $array['items'][0]['title']);
        $this->assertSame('Second short', $array['items'][1]['title']);
        $this->assertSame(1, $array['items'][0]['videoId']);
        $this->assertSame(2, $array['items'][1]['videoId']);
    }

    private function item(int $videoId, string $title): DanceShortVideoRankingItemDTO
    {
        return new DanceShortVideoRankingItemDTO(
            videoId: $videoId,
            youtubeVideoId: 'youtube-'.$videoId,
            title: $title,
            channelTitle: 'Dance Channel',
            thumbnailUrl: null,
            url: null,
            publishedAt: null,
            regionCode: 'JP',
            regionName: '日本',
            currentViewCount: 1000,
            previousViewCount: 700,
            viewCountDelta: 300,
            viewGrowthRate: 300 / 700,
            viewsPerHour: 12.5,
            likeCount: null,
            commentCount: null,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
            previousCollectedAt: CarbonImmutable::parse('2026-05-30 12:00:00', 'UTC'),
            comparisonDays: 1,
            hasPreviousSnapshot: true,
        );
    }
}
