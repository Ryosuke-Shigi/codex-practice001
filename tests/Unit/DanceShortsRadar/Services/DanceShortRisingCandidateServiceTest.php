<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\Services\DanceShortsRadar\DanceShortRisingCandidateService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortRisingCandidateServiceTest extends TestCase
{
    public function test_us_or_kr_source_with_large_delta_and_unobserved_japan_becomes_rising_candidate(): void
    {
        $list = $this->service()->buildRisingCandidates(
            sourceItems: [
                $this->item(
                    youtubeVideoId: 'us-source-video',
                    title: 'US source',
                    regionCode: 'US',
                    regionName: 'アメリカ',
                    currentViewCount: 1500,
                    previousViewCount: 1000,
                    viewCountDelta: 500,
                    viewGrowthRate: 0.5,
                ),
            ],
            japanItems: [],
            limit: 20,
        );

        $this->assertCount(1, $list->items);
        $this->assertSame('us-source-video', $list->items[0]->youtubeVideoId);
        $this->assertSame('US', $list->items[0]->sourceRegionCode);
        $this->assertSame(500, $list->items[0]->sourceViewCountDelta);
        $this->assertNull($list->items[0]->japanViewCountDelta);
        $this->assertSame(DanceShortRisingCandidateService::JAPAN_STATUS_UNOBSERVED, $list->items[0]->japanComparisonStatus);
    }

    public function test_source_with_large_delta_and_smaller_japan_delta_becomes_rising_candidate(): void
    {
        $list = $this->service()->buildRisingCandidates(
            sourceItems: [
                $this->item(
                    youtubeVideoId: 'shared-video',
                    title: 'Shared video',
                    regionCode: 'KR',
                    regionName: '韓国',
                    currentViewCount: 2000,
                    previousViewCount: 1000,
                    viewCountDelta: 1000,
                    viewGrowthRate: 1.0,
                ),
            ],
            japanItems: [
                $this->item(
                    youtubeVideoId: 'shared-video',
                    title: 'Shared video',
                    regionCode: 'JP',
                    regionName: '日本',
                    currentViewCount: 1200,
                    previousViewCount: 1000,
                    viewCountDelta: 200,
                    viewGrowthRate: 0.2,
                ),
            ],
            limit: 20,
        );

        $this->assertCount(1, $list->items);
        $this->assertSame('shared-video', $list->items[0]->youtubeVideoId);
        $this->assertSame(1000, $list->items[0]->sourceViewCountDelta);
        $this->assertSame(200, $list->items[0]->japanViewCountDelta);
        $this->assertSame(DanceShortRisingCandidateService::JAPAN_STATUS_SMALLER_DELTA, $list->items[0]->japanComparisonStatus);
    }

    public function test_japan_comparison_status_for_candidate_keeps_service_state_definition(): void
    {
        $service = $this->service();

        $this->assertSame(
            DanceShortRisingCandidateService::JAPAN_STATUS_UNOBSERVED,
            $service->japanComparisonStatusForCandidate(
                sourceViewCountDelta: 500,
                hasJapanCurrentSnapshot: false,
                japanViewCountDelta: null,
            ),
        );
        $this->assertSame(
            DanceShortRisingCandidateService::JAPAN_STATUS_SMALLER_DELTA,
            $service->japanComparisonStatusForCandidate(
                sourceViewCountDelta: 500,
                hasJapanCurrentSnapshot: true,
                japanViewCountDelta: 200,
            ),
        );
        $this->assertNull($service->japanComparisonStatusForCandidate(
            sourceViewCountDelta: 500,
            hasJapanCurrentSnapshot: true,
            japanViewCountDelta: null,
        ));
        $this->assertNull($service->japanComparisonStatusForCandidate(
            sourceViewCountDelta: 500,
            hasJapanCurrentSnapshot: true,
            japanViewCountDelta: 500,
        ));
        $this->assertNull($service->japanComparisonStatusForCandidate(
            sourceViewCountDelta: 0,
            hasJapanCurrentSnapshot: false,
            japanViewCountDelta: null,
        ));
        $this->assertNull($service->japanComparisonStatusForCandidate(
            sourceViewCountDelta: null,
            hasJapanCurrentSnapshot: false,
            japanViewCountDelta: null,
        ));
    }

    public function test_source_null_delta_is_not_candidate_and_is_not_converted_to_zero(): void
    {
        $list = $this->service()->buildRisingCandidates(
            sourceItems: [
                $this->item(
                    youtubeVideoId: 'null-delta-video',
                    title: 'Null delta',
                    regionCode: 'US',
                    regionName: 'アメリカ',
                    currentViewCount: 1500,
                    previousViewCount: null,
                    viewCountDelta: null,
                    viewGrowthRate: null,
                ),
            ],
            japanItems: [],
            limit: 20,
        );

        $this->assertCount(0, $list->items);
    }

    public function test_null_growth_rate_is_kept_as_null_for_candidate(): void
    {
        $list = $this->service()->buildRisingCandidates(
            sourceItems: [
                $this->item(
                    youtubeVideoId: 'zero-previous-video',
                    title: 'Zero previous',
                    regionCode: 'US',
                    regionName: 'アメリカ',
                    currentViewCount: 1000,
                    previousViewCount: 0,
                    viewCountDelta: 1000,
                    viewGrowthRate: null,
                ),
            ],
            japanItems: [],
            limit: 20,
        );

        $this->assertCount(1, $list->items);
        $this->assertSame(1000, $list->items[0]->sourceViewCountDelta);
        $this->assertNull($list->items[0]->sourceViewGrowthRate);
    }

    public function test_candidates_are_sorted_by_fixed_rising_candidate_order(): void
    {
        $list = $this->service()->buildRisingCandidates(
            sourceItems: [
                $this->item(
                    youtubeVideoId: 'older-same-metrics',
                    title: 'Older same metrics',
                    regionCode: 'US',
                    regionName: 'アメリカ',
                    currentViewCount: 1800,
                    previousViewCount: 1000,
                    viewCountDelta: 800,
                    viewGrowthRate: 0.8,
                    collectedAt: '2026-06-01 10:00:00',
                ),
                $this->item(
                    youtubeVideoId: 'higher-delta',
                    title: 'Higher delta',
                    regionCode: 'KR',
                    regionName: '韓国',
                    currentViewCount: 3000,
                    previousViewCount: 1000,
                    viewCountDelta: 2000,
                    viewGrowthRate: 0.3,
                    collectedAt: '2026-06-01 09:00:00',
                ),
                $this->item(
                    youtubeVideoId: 'higher-growth',
                    title: 'Higher growth',
                    regionCode: 'US',
                    regionName: 'アメリカ',
                    currentViewCount: 1800,
                    previousViewCount: 1000,
                    viewCountDelta: 800,
                    viewGrowthRate: 1.2,
                    collectedAt: '2026-06-01 08:00:00',
                ),
                $this->item(
                    youtubeVideoId: 'newer-same-metrics',
                    title: 'Newer same metrics',
                    regionCode: 'KR',
                    regionName: '韓国',
                    currentViewCount: 1800,
                    previousViewCount: 1000,
                    viewCountDelta: 800,
                    viewGrowthRate: 0.8,
                    collectedAt: '2026-06-01 12:00:00',
                ),
            ],
            japanItems: [
                $this->item(
                    youtubeVideoId: 'higher-delta',
                    title: 'Higher delta',
                    regionCode: 'JP',
                    regionName: '日本',
                    currentViewCount: 1100,
                    previousViewCount: 1000,
                    viewCountDelta: 100,
                    viewGrowthRate: 0.1,
                ),
                $this->item(
                    youtubeVideoId: 'higher-growth',
                    title: 'Higher growth',
                    regionCode: 'JP',
                    regionName: '日本',
                    currentViewCount: 1150,
                    previousViewCount: 1000,
                    viewCountDelta: 150,
                    viewGrowthRate: 0.15,
                ),
                $this->item(
                    youtubeVideoId: 'newer-same-metrics',
                    title: 'Newer same metrics',
                    regionCode: 'JP',
                    regionName: '日本',
                    currentViewCount: 1300,
                    previousViewCount: 1000,
                    viewCountDelta: 300,
                    viewGrowthRate: 0.3,
                ),
                $this->item(
                    youtubeVideoId: 'older-same-metrics',
                    title: 'Older same metrics',
                    regionCode: 'JP',
                    regionName: '日本',
                    currentViewCount: 1300,
                    previousViewCount: 1000,
                    viewCountDelta: 300,
                    viewGrowthRate: 0.3,
                ),
            ],
            limit: 20,
        );

        $this->assertSame([
            'higher-delta',
            'higher-growth',
            'newer-same-metrics',
            'older-same-metrics',
        ], array_map(fn ($item): string => $item->youtubeVideoId, $list->items));
    }

    private function service(): DanceShortRisingCandidateService
    {
        return new DanceShortRisingCandidateService;
    }

    private function item(
        string $youtubeVideoId,
        string $title,
        string $regionCode,
        string $regionName,
        int $currentViewCount,
        ?int $previousViewCount,
        ?int $viewCountDelta,
        ?float $viewGrowthRate,
        string $collectedAt = '2026-06-01 12:00:00',
    ): DanceShortVideoRankingItemDTO {
        return new DanceShortVideoRankingItemDTO(
            videoId: crc32($youtubeVideoId),
            youtubeVideoId: $youtubeVideoId,
            title: $title,
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/thumb.jpg',
            url: 'https://www.youtube.com/shorts/'.$youtubeVideoId,
            publishedAt: CarbonImmutable::parse('2026-05-30 09:00:00', 'UTC'),
            regionCode: $regionCode,
            regionName: $regionName,
            currentViewCount: $currentViewCount,
            previousViewCount: $previousViewCount,
            viewCountDelta: $viewCountDelta,
            viewGrowthRate: $viewGrowthRate,
            viewsPerHour: $viewCountDelta === null ? null : $viewCountDelta / 24,
            likeCount: null,
            commentCount: null,
            currentCollectedAt: CarbonImmutable::parse($collectedAt, 'UTC'),
            previousCollectedAt: $previousViewCount === null ? null : CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
            comparisonDays: 1,
            hasPreviousSnapshot: $previousViewCount !== null,
        );
    }
}
