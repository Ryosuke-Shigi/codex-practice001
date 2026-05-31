<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Queries\GetDanceShortVideoRankingCandidatesAction;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class GetDanceShortVideoRankingCandidatesActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_execute_returns_ranking_items_from_active_region_snapshots_without_calling_youtube_api(): void
    {
        $youtubeRepository = new ThrowingRankingYouTubeVideoApiRepository();
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        $jp = $this->region('JP', '日本');
        $us = $this->region('US', 'アメリカ');
        $targetVideo = $this->video('target-video', 'Target dance short');
        $missingPreviousVideo = $this->video('missing-previous-video', 'Missing previous short');
        $inactiveVideo = $this->video('inactive-video', 'Inactive short', 'inactive');

        $this->snapshot($targetVideo, $jp, 700, '2026-05-24 12:00:00');
        $this->snapshot($targetVideo, $jp, 900, '2026-05-25 12:00:00');
        $this->snapshot($targetVideo, $us, 9999, '2026-05-24 12:00:00');
        $this->snapshot($targetVideo, $jp, 1000, '2026-05-31 12:00:00');
        $this->snapshot($missingPreviousVideo, $jp, 2000, '2026-05-31 11:00:00');
        $this->snapshot($inactiveVideo, $jp, 100, '2026-05-24 12:00:00');
        $this->snapshot($inactiveVideo, $jp, 3000, '2026-05-31 12:00:00');

        $list = app(GetDanceShortVideoRankingCandidatesAction::class)->execute(
            new DanceShortVideoRankingConditionDTO(regionCode: 'JP', limit: 10),
        );

        $this->assertInstanceOf(DanceShortVideoRankingListDTO::class, $list);
        $this->assertCount(1, $list->items);

        $item = $list->items[0];
        $this->assertSame('target-video', $item->youtubeVideoId);
        $this->assertSame('Target dance short', $item->title);
        $this->assertSame('Dance Channel', $item->channelTitle);
        $this->assertSame('JP', $item->regionCode);
        $this->assertSame('日本', $item->regionName);
        $this->assertSame(1000, $item->currentViewCount);
        $this->assertSame(700, $item->previousViewCount);
        $this->assertSame(300, $item->viewCountDelta);
        $this->assertSame(300 / 700, $item->viewGrowthRate);
        $this->assertSame(300 / (7 * 24), $item->viewsPerHour);
        $this->assertSame(7, $item->comparisonDays);
        $this->assertSame('2026-05-31 12:00:00', $item->currentCollectedAt->format('Y-m-d H:i:s'));
        $this->assertSame('2026-05-24 12:00:00', $item->previousCollectedAt->format('Y-m-d H:i:s'));
        $this->assertSame(0, $youtubeRepository->callCount);
    }

    public function test_execute_sorts_by_views_per_hour_descending(): void
    {
        $jp = $this->region('JP', '日本');
        $middle = $this->video('middle-video', 'Middle per hour');
        $fast = $this->video('fast-video', 'Fast per hour');
        $slowBigDelta = $this->video('slow-big-delta-video', 'Slow big delta');

        $this->snapshot($middle, $jp, 900, '2026-05-31 12:00:00');
        $this->snapshot($middle, $jp, 1000, '2026-06-01 12:00:00');
        $this->snapshot($fast, $jp, 760, '2026-05-31 12:00:00');
        $this->snapshot($fast, $jp, 1000, '2026-06-01 12:00:00');
        $this->snapshot($slowBigDelta, $jp, 200, '2026-05-28 12:00:00');
        $this->snapshot($slowBigDelta, $jp, 1000, '2026-06-01 12:00:00');

        $list = app(GetDanceShortVideoRankingCandidatesAction::class)->execute(
            new DanceShortVideoRankingConditionDTO(
                regionCode: 'JP',
                comparisonDays: 1,
                limit: 10,
                sortKey: 'views_per_hour',
            ),
        );

        $this->assertSame([
            'Fast per hour',
            'Slow big delta',
            'Middle per hour',
        ], array_map(fn ($item): string => $item->title, $list->items));
    }

    public function test_execute_sorts_by_view_count_delta_descending_and_applies_limit(): void
    {
        $jp = $this->region('JP', '日本');
        $middle = $this->video('middle-video', 'Middle delta');
        $fast = $this->video('fast-video', 'Fast delta');
        $slowBigDelta = $this->video('slow-big-delta-video', 'Slow big delta');

        $this->snapshot($middle, $jp, 900, '2026-05-31 12:00:00');
        $this->snapshot($middle, $jp, 1000, '2026-06-01 12:00:00');
        $this->snapshot($fast, $jp, 760, '2026-05-31 12:00:00');
        $this->snapshot($fast, $jp, 1000, '2026-06-01 12:00:00');
        $this->snapshot($slowBigDelta, $jp, 200, '2026-05-28 12:00:00');
        $this->snapshot($slowBigDelta, $jp, 1000, '2026-06-01 12:00:00');

        $list = app(GetDanceShortVideoRankingCandidatesAction::class)->execute(
            new DanceShortVideoRankingConditionDTO(
                regionCode: 'JP',
                comparisonDays: 1,
                limit: 2,
                sortKey: 'view_count_delta',
            ),
        );

        $this->assertSame([
            'Slow big delta',
            'Fast delta',
        ], array_map(fn ($item): string => $item->title, $list->items));
    }

    public function test_execute_applies_limit_after_metric_sort_not_before_current_candidate_collection(): void
    {
        $jp = $this->region('JP', '日本');
        $newerSmallDelta = $this->video('newer-small-delta-video', 'Newer small delta');
        $olderLargeDelta = $this->video('older-large-delta-video', 'Older large delta');

        /*
         * newerSmallDelta は current collected_at が新しいため、Repository の返却順だけを見ると先頭に来ます。
         * ただしランキング指標では olderLargeDelta の view_count_delta が大きいので、
         * Action が全候補の metric 計算と sort を終えてから limit=1 を適用することを確認します。
         */
        $this->snapshot($newerSmallDelta, $jp, 900, '2026-05-31 12:00:00');
        $this->snapshot($newerSmallDelta, $jp, 1000, '2026-06-01 12:00:00');
        $this->snapshot($olderLargeDelta, $jp, 100, '2026-05-30 12:00:00');
        $this->snapshot($olderLargeDelta, $jp, 1000, '2026-06-01 11:00:00');

        $list = app(GetDanceShortVideoRankingCandidatesAction::class)->execute(
            new DanceShortVideoRankingConditionDTO(
                regionCode: 'JP',
                comparisonDays: 1,
                limit: 1,
                sortKey: 'view_count_delta',
            ),
        );

        $this->assertCount(1, $list->items);
        $this->assertSame('Older large delta', $list->items[0]->title);
        $this->assertSame(900, $list->items[0]->viewCountDelta);
    }

    public function test_execute_sorts_by_view_growth_rate_descending(): void
    {
        $jp = $this->region('JP', '日本');
        $highGrowth = $this->video('high-growth-video', 'High growth');
        $lowGrowth = $this->video('low-growth-video', 'Low growth');

        $this->snapshot($lowGrowth, $jp, 1000, '2026-05-31 12:00:00');
        $this->snapshot($lowGrowth, $jp, 1500, '2026-06-01 12:00:00');
        $this->snapshot($highGrowth, $jp, 100, '2026-05-31 12:00:00');
        $this->snapshot($highGrowth, $jp, 300, '2026-06-01 12:00:00');

        $list = app(GetDanceShortVideoRankingCandidatesAction::class)->execute(
            new DanceShortVideoRankingConditionDTO(
                regionCode: 'JP',
                comparisonDays: 1,
                limit: 10,
                sortKey: 'view_growth_rate',
            ),
        );

        $this->assertSame([
            'High growth',
            'Low growth',
        ], array_map(fn ($item): string => $item->title, $list->items));
    }

    private function region(string $code, string $name): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => $code,
            'name' => $name,
        ]);
    }

    private function video(
        string $youtubeVideoId,
        string $title,
        string $trackingStatus = 'active',
    ): DanceShortVideo {
        return DanceShortVideo::query()->create([
            'youtube_video_id' => $youtubeVideoId,
            'title' => $title,
            'channel_title' => 'Dance Channel',
            'thumbnail_url' => 'https://example.test/thumb.jpg',
            'published_at' => '2026-05-30 09:00:00',
            'url' => 'https://www.youtube.com/shorts/'.$youtubeVideoId,
            'tracking_status' => $trackingStatus,
        ]);
    }

    private function snapshot(
        DanceShortVideo $video,
        DanceShortRegion $region,
        int $viewCount,
        string $collectedAt,
    ): DanceShortVideoSnapshot {
        return DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => $viewCount,
            'collected_at' => $collectedAt,
        ]);
    }
}

class ThrowingRankingYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    public int $callCount = 0;

    /**
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        $this->callCount++;

        throw new RuntimeException('Ranking Query should not call YouTube search.');
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        $this->callCount++;

        throw new RuntimeException('Ranking Query should not call YouTube details.');
    }
}
