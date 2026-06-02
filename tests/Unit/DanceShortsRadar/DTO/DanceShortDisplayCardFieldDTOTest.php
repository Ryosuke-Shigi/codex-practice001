<?php

namespace Tests\Unit\DanceShortsRadar\DTO;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
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
            cards: new DanceShortDisplayCardListDTO([
                new DanceShortRankingDisplayCardDTO($this->rankingItem()),
            ]),
            emptyMessage: '表示できる通常ランキング候補はまだありません。',
        );

        $array = $dto->toArray();

        $this->assertSame('ranking', $array['type']);
        $this->assertSame('表示できる通常ランキング候補はまだありません。', $array['emptyMessage']);
        $this->assertArrayNotHasKey('selectedTab', $array);
        $this->assertArrayNotHasKey('comparisonDays', $array);
        $this->assertArrayNotHasKey('sortKey', $array);
        $this->assertSame('ranking', $array['cards'][0]['type']);
        $this->assertSame('ranking-video', $array['cards'][0]['rankingItem']['youtubeVideoId']);
        $this->assertSame(300, $array['cards'][0]['rankingItem']['viewCountDelta']);
    }

    public function test_to_array_keeps_rising_display_card_shape(): void
    {
        $dto = new DanceShortDisplayCardFieldDTO(
            type: DanceShortDisplayCardFieldDTO::TYPE_RISING,
            cards: new DanceShortDisplayCardListDTO([
                new DanceShortRisingDisplayCardDTO($this->risingCandidate()),
            ]),
            emptyMessage: '表示できる上昇候補はまだありません。',
        );

        $array = $dto->toArray();

        $this->assertSame('rising', $array['type']);
        $this->assertSame('表示できる上昇候補はまだありません。', $array['emptyMessage']);
        $this->assertArrayNotHasKey('selectedTab', $array);
        $this->assertArrayNotHasKey('comparisonDays', $array);
        $this->assertArrayNotHasKey('sortKey', $array);
        $this->assertSame('rising', $array['cards'][0]['type']);
        $this->assertSame('rising-video', $array['cards'][0]['risingCandidate']['youtubeVideoId']);
        $this->assertSame('US', $array['cards'][0]['risingCandidate']['sourceRegionCode']);
        $this->assertSame('unobserved', $array['cards'][0]['risingCandidate']['japanComparisonStatus']);
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
            publishedAt: CarbonImmutable::parse('2026-05-30 09:00:00', 'UTC'),
            regionCode: 'JP',
            regionName: 'Japan',
            currentViewCount: 1000,
            previousViewCount: 700,
            viewCountDelta: 300,
            viewGrowthRate: 300 / 700,
            viewsPerHour: 12.5,
            likeCount: 10,
            commentCount: 2,
            currentCollectedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'UTC'),
            previousCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
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
            publishedAt: CarbonImmutable::parse('2026-05-30 09:00:00', 'UTC'),
            sourceRegionCode: 'US',
            sourceRegionName: 'United States',
            sourceCurrentViewCount: 1200,
            sourcePreviousViewCount: 1000,
            sourceViewCountDelta: 200,
            sourceViewGrowthRate: 0.2,
            sourceViewsPerHour: 8.3,
            sourceCurrentCollectedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'UTC'),
            sourcePreviousCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
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
