<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardPaginationDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use Carbon\CarbonImmutable;
use Tests\TestCase;

class DanceShortDisplayCardFieldDTOTest extends TestCase
{
    public function test_to_array_keeps_ranking_display_card_shape(): void
    {
        $dto = new DanceShortDisplayCardFieldDTO(
            type: DanceShortDisplayCardFieldDTO::TYPE_RANKING,
            visibleCards: new DanceShortDisplayCardListDTO([
                new DanceShortRankingDisplayCardDTO($this->rankingItem()),
            ]),
            activeIndex: 0,
            activeRank: 1,
            pagination: $this->pagination(),
            emptyMessage: null,
        );

        $array = $dto->toArray();

        $this->assertSame('ranking', $array['type']);
        $this->assertNull($array['emptyMessage']);
        $this->assertSame(0, $array['activeIndex']);
        $this->assertSame(1, $array['activeRank']);
        $this->assertSame(1, $array['pagination']['startRank']);
        $this->assertSame(5, $array['pagination']['windowSize']);
        $this->assertFalse($array['pagination']['hasPrev']);
        $this->assertTrue($array['pagination']['hasNext']);
        $this->assertArrayNotHasKey('selectedTab', $array);
        $this->assertArrayNotHasKey('comparisonDays', $array);
        $this->assertArrayNotHasKey('sortKey', $array);
        $this->assertArrayNotHasKey('cards', $array);
        $this->assertSame('ranking', $array['visibleCards'][0]['type']);
        $this->assertSame('ranking-video', $array['visibleCards'][0]['rankingItem']['youtubeVideoId']);
        $this->assertSame(300, $array['visibleCards'][0]['rankingItem']['viewCountDelta']);
    }

    public function test_to_array_keeps_rising_display_card_shape(): void
    {
        $dto = new DanceShortDisplayCardFieldDTO(
            type: DanceShortDisplayCardFieldDTO::TYPE_RISING,
            visibleCards: new DanceShortDisplayCardListDTO([
                new DanceShortRisingDisplayCardDTO($this->risingCandidate()),
            ]),
            activeIndex: 0,
            activeRank: 1,
            pagination: $this->pagination(),
            emptyMessage: null,
        );

        $array = $dto->toArray();

        $this->assertSame('rising', $array['type']);
        $this->assertNull($array['emptyMessage']);
        $this->assertArrayNotHasKey('selectedTab', $array);
        $this->assertArrayNotHasKey('comparisonDays', $array);
        $this->assertArrayNotHasKey('sortKey', $array);
        $this->assertArrayNotHasKey('cards', $array);
        $this->assertSame('rising', $array['visibleCards'][0]['type']);
        $this->assertSame('rising-video', $array['visibleCards'][0]['risingCandidate']['youtubeVideoId']);
        $this->assertSame('US', $array['visibleCards'][0]['risingCandidate']['sourceRegionCode']);
        $this->assertSame('unobserved', $array['visibleCards'][0]['risingCandidate']['japanComparisonStatus']);
    }

    private function pagination(): DanceShortDisplayCardPaginationDTO
    {
        return new DanceShortDisplayCardPaginationDTO(
            startRank: 1,
            windowSize: 5,
            hasPrev: false,
            hasNext: true,
            prevStartRank: null,
            nextStartRank: 6,
        );
    }

    private function rankingItem(): DanceShortVideoRankingItemDTO
    {
        return new DanceShortVideoRankingItemDTO(
            videoId: 1,
            youtubeVideoId: 'ranking-video',
            title: 'Ranking short',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/thumb.jpg',
            url: 'https://www.youtube.com/shorts/ranking-video',
            publishedAt: CarbonImmutable::parse('2026-05-30 09:00:00', 'Asia/Tokyo'),
            regionCode: 'JP',
            regionName: 'Japan',
            currentViewCount: 1000,
            previousViewCount: 700,
            viewCountDelta: 300,
            viewGrowthRate: 300 / 700,
            viewsPerHour: 12.5,
            likeCount: 10,
            commentCount: 2,
            currentCollectedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
            previousCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
            comparisonDays: 1,
            hasPreviousSnapshot: true,
        );
    }

    private function risingCandidate(): DanceShortVideoRisingCandidateDTO
    {
        return new DanceShortVideoRisingCandidateDTO(
            videoId: 2,
            youtubeVideoId: 'rising-video',
            title: 'Rising short',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/thumb.jpg',
            url: 'https://www.youtube.com/shorts/rising-video',
            publishedAt: CarbonImmutable::parse('2026-05-30 09:00:00', 'Asia/Tokyo'),
            sourceRegionCode: 'US',
            sourceRegionName: 'United States',
            sourceCurrentViewCount: 1200,
            sourcePreviousViewCount: 1000,
            sourceViewCountDelta: 200,
            sourceViewGrowthRate: 0.2,
            sourceViewsPerHour: 8.3,
            sourceCurrentCollectedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
            sourcePreviousCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
            japanCurrentViewCount: null,
            japanPreviousViewCount: null,
            japanViewCountDelta: null,
            japanViewGrowthRate: null,
            japanViewsPerHour: null,
            japanCurrentCollectedAt: null,
            japanPreviousCollectedAt: null,
            japanComparisonStatus: 'unobserved',
            comparisonDays: 1,
        );
    }
}
