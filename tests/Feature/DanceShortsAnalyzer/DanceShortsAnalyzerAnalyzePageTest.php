<?php

namespace Tests\Feature\DanceShortsAnalyzer;

use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

/*
 * DanceShortsAnalyzer PRODUCT の Analyze 画面テストです。
 */
class DanceShortsAnalyzerAnalyzePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_analyze_page_is_available_with_empty_state(): void
    {
        $this
            ->get('/dance-shorts-analyzer/analyze')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsAnalyzer/Analyze', false)
                ->where('analyzeField.search_url', '/dance-shorts-analyzer')
                ->where('analyzeField.empty_message', '分析する動画を選択してください。')
                ->where('analyzeField.active_video_id', null)
                ->has('analyzeField.selected_videos', 0)
                ->has('analyzeField.regions', 0)
            );
    }

    public function test_video_ids_more_than_five_are_rejected(): void
    {
        $videoIds = [];

        foreach (range(1, 6) as $index) {
            $videoIds[] = $this->video([
                'youtube_video_id' => 'video-'.$index,
            ])->getKey();
        }

        $this
            ->from('/dance-shorts-analyzer')
            ->get('/dance-shorts-analyzer/analyze?'.http_build_query([
                'video_ids' => $videoIds,
            ]))
            ->assertRedirect('/dance-shorts-analyzer')
            ->assertInvalid(['video_ids']);
    }

    public function test_nonexistent_video_id_is_rejected(): void
    {
        $this
            ->from('/dance-shorts-analyzer')
            ->get('/dance-shorts-analyzer/analyze?'.http_build_query([
                'video_ids' => [9999],
            ]))
            ->assertRedirect('/dance-shorts-analyzer')
            ->assertInvalid(['video_ids.0']);
    }

    public function test_analyze_page_returns_video_snapshot_region_chart_delta_and_per_hour_props(): void
    {
        $youtubeRepository = new ThrowingAnalyzePageYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);
        $region = $this->region([
            'code' => 'JP',
            'name' => '日本',
        ]);
        $video = $this->video([
            'youtube_video_id' => 'analyze-video',
            'title' => 'Analyze Video',
            'channel_title' => 'Analyze Channel',
            'url' => 'https://example.test/not-used',
        ]);
        $otherVideo = $this->video([
            'youtube_video_id' => 'other-analyze-video',
            'title' => 'Other Analyze Video',
            'channel_title' => 'Other Analyze Channel',
        ]);

        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'like_count' => 10,
            'comment_count' => 1,
            'collected_at' => '2026-06-01 00:00:00',
        ]);
        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 160,
            'like_count' => 16,
            'comment_count' => 4,
            'collected_at' => '2026-06-01 03:00:00',
        ]);
        DanceShortVideoSnapshot::query()->create([
            'video_id' => $otherVideo->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 200,
            'like_count' => 20,
            'comment_count' => 2,
            'collected_at' => '2026-06-01 01:00:00',
        ]);
        DanceShortVideoSnapshot::query()->create([
            'video_id' => $otherVideo->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 320,
            'like_count' => 32,
            'comment_count' => 8,
            'collected_at' => '2026-06-01 03:00:00',
        ]);

        $this
            ->get('/dance-shorts-analyzer/analyze?'.http_build_query([
                'video_ids' => [$video->getKey(), $otherVideo->getKey()],
                'active_video_id' => $video->getKey(),
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsAnalyzer/Analyze', false)
                ->where('analyzeField.empty_message', null)
                ->where('analyzeField.no_snapshot_message', null)
                ->where('analyzeField.active_video_id', $video->getKey())
                ->where('analyzeField.active_region_id', $region->getKey())
                ->has('analyzeField.selected_videos', 2)
                ->where('analyzeField.selected_videos.0.video_id', $video->getKey())
                ->where('analyzeField.selected_videos.0.youtube_url', 'https://www.youtube.com/shorts/analyze-video')
                ->where('analyzeField.selected_videos.0.chart_color', '#60a5fa')
                ->where('analyzeField.selected_videos.1.video_id', $otherVideo->getKey())
                ->where('analyzeField.selected_videos.1.youtube_url', 'https://www.youtube.com/shorts/other-analyze-video')
                ->where('analyzeField.selected_videos.1.chart_color', '#22c55e')
                ->where('analyzeField.active_video.title', 'Analyze Video')
                ->where('analyzeField.active_video.channel_title', 'Analyze Channel')
                ->where('analyzeField.active_video.chart_color', '#60a5fa')
                ->has('analyzeField.regions', 1)
                ->where('analyzeField.regions.0.region_code', 'JP')
                ->where('analyzeField.regions.0.region_name', '日本')
                ->where('analyzeField.regions.0.latest_snapshot.view_count', 160)
                ->where('analyzeField.regions.0.metric_cards.0.label', 'Views増加')
                ->where('analyzeField.regions.0.metric_cards.0.value', 60)
                ->where('analyzeField.regions.0.metric_cards.1.label', '1hあたり')
                ->where('analyzeField.regions.0.metric_cards.1.value', 20)
                ->where('analyzeField.regions.0.metric_cards.2.label', 'Like増加')
                ->has('analyzeField.regions.0.charts.view_count.option.series', 1)
                ->where('analyzeField.regions.0.charts.view_count.title', 'View推移')
                ->where('analyzeField.regions.0.charts.view_count.option.series.0.data.0', 100)
                ->where('analyzeField.regions.0.charts.view_count.option.series.0.data.1', 160)
                ->where('analyzeField.regions.0.charts.like_count.title', 'Like推移')
                ->where('analyzeField.regions.0.charts.comment_count.title', 'Comment推移')
                ->has('analyzeField.regions.0.delta_rows', 1)
                ->where('analyzeField.regions.0.delta_rows.0.view_delta', 60)
                ->where('analyzeField.regions.0.delta_rows.0.like_delta', 6)
                ->has('analyzeField.regions.0.per_hour_rows', 1)
                ->where('analyzeField.regions.0.per_hour_rows.0.view_per_hour', 20)
                ->where('analyzeField.regions.0.per_hour_rows.0.like_per_hour', 2)
                ->has('analyzeField.comparison.periods.day')
                ->has('analyzeField.comparison.periods.week')
                ->has('analyzeField.comparison.periods.month')
                ->has('analyzeField.comparison.periods.all')
                ->has('analyzeField.comparison.periods.day.charts.view_count.option.series', 2)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.color.0', '#60a5fa')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.color.1', '#22c55e')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.0.name', 'Analyze Video')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.1.name', 'Other Analyze Video')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.xAxis.data.0', '00:00')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.xAxis.data.1', '01:00')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.xAxis.data.2', '03:00')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.xAxis.axisLabel.hideOverlap', true)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.0.data.0', 100)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.0.data.1', null)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.0.data.2', 160)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.1.data.0', null)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.1.data.1', 200)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.series.1.data.2', 320)
                ->has('analyzeField.comparison.periods.day.tables.delta.view_count.columns', 2)
                ->where('analyzeField.comparison.periods.day.tables.delta.view_count.columns.0.title', 'Analyze Video')
                ->where('analyzeField.comparison.periods.day.tables.delta.view_count.columns.1.title', 'Other Analyze Video')
                ->has('analyzeField.comparison.periods.day.tables.delta.view_count.rows', 1)
                ->where('analyzeField.comparison.periods.day.tables.delta.view_count.rows.0.cells.0.value_label', '60')
                ->where('analyzeField.comparison.periods.day.tables.delta.view_count.rows.0.cells.1.value_label', '120')
                ->where('analyzeField.comparison.periods.day.tables.per_hour.view_count.rows.0.cells.0.value_label', '20.00 / h')
                ->where('analyzeField.comparison.periods.day.tables.per_hour.view_count.rows.0.cells.1.value_label', '60.00 / h')
            );

        $this->assertSame(0, $youtubeRepository->callCount);
    }

    public function test_comparison_periods_use_latest_snapshot_as_anchor_and_format_axis_labels(): void
    {
        $region = $this->region();
        $video = $this->video([
            'youtube_video_id' => 'period-video',
            'title' => 'Period Video',
        ]);

        foreach ([
            ['view_count' => 10, 'collected_at' => '2026-05-01 00:00:00'],
            ['view_count' => 20, 'collected_at' => '2026-05-15 12:00:00'],
            ['view_count' => 40, 'collected_at' => '2026-06-04 12:00:00'],
            ['view_count' => 70, 'collected_at' => '2026-06-09 13:00:00'],
            ['view_count' => 100, 'collected_at' => '2026-06-10 12:00:00'],
        ] as $snapshot) {
            DanceShortVideoSnapshot::query()->create([
                'video_id' => $video->getKey(),
                'region_id' => $region->getKey(),
                'view_count' => $snapshot['view_count'],
                'like_count' => 1,
                'comment_count' => 1,
                'collected_at' => $snapshot['collected_at'],
            ]);
        }

        $this
            ->get('/dance-shorts-analyzer/analyze?'.http_build_query([
                'video_ids' => [$video->getKey()],
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('analyzeField.comparison.periods.day.charts.view_count.option.series.0.data', 2)
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.xAxis.data.0', '13:00')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.xAxis.data.1', '12:00')
                ->where('analyzeField.comparison.periods.day.charts.view_count.option.xAxis.axisLabel.rotate', 0)
                ->has('analyzeField.comparison.periods.day.tables.delta.view_count.rows', 1)
                ->where('analyzeField.comparison.periods.day.tables.delta.view_count.rows.0.cells.0.value_label', '30')
                ->has('analyzeField.comparison.periods.week.charts.view_count.option.series.0.data', 3)
                ->where('analyzeField.comparison.periods.week.charts.view_count.option.xAxis.data.0', '06/04 12:00')
                ->where('analyzeField.comparison.periods.week.charts.view_count.option.xAxis.data.2', '06/10 12:00')
                ->where('analyzeField.comparison.periods.week.charts.view_count.option.xAxis.axisLabel.rotate', 30)
                ->has('analyzeField.comparison.periods.week.tables.delta.view_count.rows', 2)
                ->has('analyzeField.comparison.periods.month.charts.view_count.option.series.0.data', 4)
                ->where('analyzeField.comparison.periods.month.charts.view_count.option.xAxis.data.0', '05/15')
                ->where('analyzeField.comparison.periods.month.charts.view_count.option.xAxis.data.3', '06/10')
                ->where('analyzeField.comparison.periods.month.charts.view_count.option.xAxis.axisLabel.rotate', 30)
                ->has('analyzeField.comparison.periods.month.tables.delta.view_count.rows', 3)
                ->has('analyzeField.comparison.periods.all.charts.view_count.option.series.0.data', 5)
                ->where('analyzeField.comparison.periods.all.charts.view_count.option.xAxis.data.0', '2026/05/01')
                ->where('analyzeField.comparison.periods.all.charts.view_count.option.xAxis.data.4', '2026/06/10')
                ->where('analyzeField.comparison.periods.all.charts.view_count.option.xAxis.axisLabel.rotate', 45)
                ->has('analyzeField.comparison.periods.all.tables.delta.view_count.rows', 4)
            );
    }

    public function test_single_snapshot_period_tables_are_empty(): void
    {
        $region = $this->region();
        $video = $this->video([
            'youtube_video_id' => 'single-snapshot-video',
        ]);

        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'like_count' => 10,
            'comment_count' => 1,
            'collected_at' => '2026-06-01 00:00:00',
        ]);

        $this
            ->get('/dance-shorts-analyzer/analyze?'.http_build_query([
                'video_ids' => [$video->getKey()],
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('analyzeField.no_snapshot_message', null)
                ->has('analyzeField.regions.0.delta_rows', 0)
                ->has('analyzeField.regions.0.per_hour_rows', 0)
                ->has('analyzeField.comparison.periods.day.tables.delta.view_count.rows', 0)
                ->has('analyzeField.comparison.periods.day.tables.per_hour.view_count.rows', 0)
                ->has('analyzeField.comparison.periods.all.tables.delta.view_count.rows', 0)
                ->has('analyzeField.comparison.periods.all.tables.per_hour.view_count.rows', 0)
            );
    }

    public function test_multiple_regions_are_kept_separate_and_latest_region_becomes_active(): void
    {
        $jp = $this->region([
            'code' => 'JP',
            'name' => '日本',
        ]);
        $us = $this->region([
            'code' => 'US',
            'name' => 'アメリカ',
        ]);
        $video = $this->video([
            'youtube_video_id' => 'multi-region-video',
        ]);

        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $jp->getKey(),
            'view_count' => 100,
            'collected_at' => '2026-06-01 00:00:00',
        ]);
        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $us->getKey(),
            'view_count' => 200,
            'collected_at' => '2026-06-01 06:00:00',
        ]);

        $this
            ->get('/dance-shorts-analyzer/analyze?'.http_build_query([
                'video_ids' => [$video->getKey()],
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('analyzeField.active_region_id', $us->getKey())
                ->has('analyzeField.regions', 2)
                ->where('analyzeField.regions.0.region_code', 'JP')
                ->where('analyzeField.regions.0.charts.view_count.option.series.0.data.0', 100)
                ->where('analyzeField.regions.1.region_code', 'US')
                ->where('analyzeField.regions.1.charts.view_count.option.series.0.data.0', 200)
            );
    }

    public function test_video_without_snapshots_returns_no_snapshot_message(): void
    {
        $video = $this->video([
            'youtube_video_id' => 'no-snapshot-video',
        ]);

        $this
            ->get('/dance-shorts-analyzer/analyze?'.http_build_query([
                'video_ids' => [$video->getKey()],
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('analyzeField.empty_message', null)
                ->where('analyzeField.no_snapshot_message', 'この動画には保存済みsnapshotがありません。')
                ->where('analyzeField.active_video.youtube_video_id', 'no-snapshot-video')
                ->has('analyzeField.regions', 0)
            );
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function video(array $overrides = []): DanceShortVideo
    {
        return DanceShortVideo::query()->create(array_merge([
            'youtube_video_id' => 'dance-short-video',
            'title' => 'Dance short title',
            'description' => 'Dance short description',
            'channel_title' => 'Dance Channel',
            'thumbnail_url' => 'https://example.test/thumb.jpg',
            'published_at' => '2026-06-01 12:00:00',
            'url' => 'https://www.youtube.com/shorts/dance-short-video',
            'tags' => ['dance', 'shorts'],
            'tracking_status' => 'active',
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function region(array $overrides = []): DanceShortRegion
    {
        return DanceShortRegion::query()->create(array_merge([
            'code' => 'JP',
            'name' => '日本',
        ], $overrides));
    }
}

class ThrowingAnalyzePageYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    public int $callCount = 0;

    /**
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        $this->callCount++;

        throw new RuntimeException('DanceShortsAnalyzer Analyze should not call YouTube search.');
    }

    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        $this->callCount++;

        throw new RuntimeException('DanceShortsAnalyzer Analyze should not call YouTube search page.');
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        $this->callCount++;

        throw new RuntimeException('DanceShortsAnalyzer Analyze should not call YouTube details.');
    }
}
