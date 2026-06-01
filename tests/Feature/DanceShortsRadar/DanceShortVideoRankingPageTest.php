<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Queries\GetDanceShortVideoRankingPageAction;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Database\Seeders\DanceShortRegionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

/*
 * DanceShortsRadar 通常ランキング本画面の Feature テストです。
 *
 * このテストでは、画面接続工程で壊したくない境界を HTTP / Inertia props から固定します。
 * 具体的には、Request の許可値、未指定時の初期値、region / comparison_days による条件変更、
 * Responder が DTO の metric 値をそのまま props 化すること、そして表示接続時に YouTube API を
 * 呼ばないことを確認します。
 */
class DanceShortVideoRankingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_page_uses_default_filters_and_passes_ranking_props_without_calling_youtube_api(): void
    {
        $youtubeRepository = new ThrowingRankingPageYouTubeVideoApiRepository();
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        /*
         * 通常ランキング画面の region tab は React の固定値ではなく、
         * DanceShortRegionSeeder が投入する active region から作られることを固定します。
         */
        $this->seed(DanceShortRegionSeeder::class);

        $jp = DanceShortRegion::query()->where('code', 'JP')->firstOrFail();
        $video = $this->video('jp-ranking-video', 'JP ranking short');

        $this->snapshot($video, $jp, 700, '2026-05-25 12:00:00');
        $this->snapshot($video, $jp, 1000, '2026-06-01 12:00:00', 789, 12);

        $this
            ->get('/dance-shorts-radar')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsRadar/Index', false)
                ->where('filters.region', 'JP')
                ->where('filters.comparisonDays', 7)
                ->where('filters.sortKey', 'views_per_hour')
                ->where('filters.limit', 20)
                ->has('regionTabs', 3)
                ->where('regionTabs.0.code', 'JP')
                ->where('regionTabs.0.label', '日本')
                ->where('regionTabs.0.isActive', true)
                ->where('regionTabs.1.code', 'US')
                ->where('regionTabs.1.label', 'アメリカ')
                ->where('regionTabs.2.code', 'KR')
                ->where('regionTabs.2.label', '韓国')
                ->has('regions', 3)
                ->where('regions.0.code', 'JP')
                ->where('regions.0.label', '日本')
                ->where('comparisonDayOptions.0.value', 1)
                ->where('comparisonDayOptions.2.value', 7)
                ->where('comparisonDayOptions.2.isActive', true)
                ->where('sortKeyOptions.0.value', 'views_per_hour')
                ->where('sortKeyOptions.0.isActive', true)
                ->has('ranking.items', 1)
                ->where('ranking.total', 1)
                ->where('ranking.items.0.youtubeVideoId', 'jp-ranking-video')
                ->where('ranking.items.0.title', 'JP ranking short')
                ->where('ranking.items.0.region.code', 'JP')
                ->where('ranking.items.0.currentViewCount', 1000)
                ->where('ranking.items.0.previousViewCount', 700)
                ->where('ranking.items.0.viewCountDelta', 300)
                ->where('ranking.items.0.viewsPerHour', 300 / (7 * 24))
                ->where('ranking.items.0.likeCount', 789)
                ->where('ranking.items.0.commentCount', 12)
                ->where('candidatesByRegion.JP.0.youtube_video_id', 'jp-ranking-video')
                ->where('candidatesByRegion.JP.0.view_count', 1000)
                ->where('candidatesByRegion.JP.0.previous_view_count', 700)
                ->where('candidatesByRegion.JP.0.view_diff', 300)
                ->where('candidatesByRegion.JP.0.like_count', 789)
                ->where('candidatesByRegion.JP.0.comment_count', 12)
                ->where('allCandidates.0.youtube_video_id', 'jp-ranking-video')
            );

        $this->assertSame(0, $youtubeRepository->callCount);
    }

    public function test_page_shows_seeded_region_tabs_and_empty_ranking_without_snapshots(): void
    {
        $youtubeRepository = new ThrowingRankingPageYouTubeVideoApiRepository();
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        /*
         * snapshot が未投入でも、地域マスタだけでタブは表示され、ランキング部分は空配列として
         * 安全に返る必要があります。この画面表示確認では YouTube API を呼びません。
         */
        $this->seed(DanceShortRegionSeeder::class);

        $this
            ->get('/dance-shorts-radar')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsRadar/Index', false)
                ->where('filters.region', 'JP')
                ->has('regionTabs', 3)
                ->where('regionTabs.0.code', 'JP')
                ->where('regionTabs.0.label', '日本')
                ->where('regionTabs.0.isActive', true)
                ->where('regionTabs.1.code', 'US')
                ->where('regionTabs.1.label', 'アメリカ')
                ->where('regionTabs.2.code', 'KR')
                ->where('regionTabs.2.label', '韓国')
                ->has('ranking.items', 0)
                ->where('ranking.total', 0)
                ->where('emptyMessage', '比較元 snapshot がある通常ランキング候補はまだありません。')
            );

        $this->assertSame(0, $youtubeRepository->callCount);
    }

    public function test_region_and_comparison_days_query_change_the_ranking_condition(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $us = $this->region('US', 'アメリカ', 20);
        $jpVideo = $this->video('jp-video', 'JP short');
        $usVideo = $this->video('us-video', 'US short');

        $this->snapshot($jpVideo, $jp, 100, '2026-05-31 12:00:00');
        $this->snapshot($jpVideo, $jp, 1000, '2026-06-01 12:00:00');
        $this->snapshot($usVideo, $us, 900, '2026-05-31 12:00:00');
        $this->snapshot($usVideo, $us, 1000, '2026-06-01 12:00:00');
        $this->snapshot($usVideo, $us, 300, '2026-05-25 12:00:00');

        $this
            ->get('/dance-shorts-radar?region=US&comparisonDays=1&sort=view_count_delta&limit=10')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.region', 'US')
                ->where('filters.comparisonDays', 1)
                ->where('filters.sortKey', 'view_count_delta')
                ->where('ranking.items.0.youtubeVideoId', 'us-video')
                ->where('ranking.items.0.region.code', 'US')
                ->where('ranking.items.0.previousViewCount', 900)
                ->where('ranking.items.0.viewCountDelta', 100)
                ->where('ranking.items.0.comparisonDays', 1)
                ->where('candidatesByRegion.US.0.youtube_video_id', 'us-video')
                ->where('candidatesByRegion.US.0.previous_view_count', 900)
                ->where('candidatesByRegion.US.0.view_diff', 100)
            );
    }

    public function test_request_allows_only_expected_comparison_days(): void
    {
        $this->region('JP', '日本', 10);

        foreach ([1, 3, 7, 14, 30] as $comparisonDays) {
            $this
                ->get('/dance-shorts-radar?comparison_days='.$comparisonDays)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('filters.comparisonDays', $comparisonDays)
                );

            $this
                ->get('/dance-shorts-radar?comparisonDays='.$comparisonDays)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('filters.comparisonDays', $comparisonDays)
                );
        }

        $this
            ->from('/dance-shorts-radar')
            ->get('/dance-shorts-radar?comparison_days=8')
            ->assertRedirect('/dance-shorts-radar')
            ->assertSessionHasErrors('comparison_days');
    }

    public function test_request_rejects_unknown_sort_key(): void
    {
        $this->region('JP', '日本', 10);

        $this
            ->from('/dance-shorts-radar')
            ->get('/dance-shorts-radar?sort_key=invalid')
            ->assertRedirect('/dance-shorts-radar')
            ->assertSessionHasErrors('sort_key');

        $this
            ->from('/dance-shorts-radar')
            ->get('/dance-shorts-radar?sort=invalid')
            ->assertRedirect('/dance-shorts-radar')
            ->assertSessionHasErrors('sort');
    }

    public function test_responder_uses_ranking_dto_metric_values_without_recalculating(): void
    {
        $this->app->instance(
            GetDanceShortVideoRankingPageAction::class,
            new class extends GetDanceShortVideoRankingPageAction
            {
                public function __construct()
                {
                }

                public function execute(DanceShortVideoRankingPageInputDTO $input): DanceShortVideoRankingPageDTO
                {
                    $rankingList = new DanceShortVideoRankingListDTO([
                        new DanceShortVideoRankingItemDTO(
                            videoId: 10,
                            youtubeVideoId: 'metric-source-video',
                            title: 'Metric source short',
                            channelTitle: 'Metric Channel',
                            thumbnailUrl: null,
                            url: null,
                            publishedAt: CarbonImmutable::parse('2026-05-30 09:00:00', 'UTC'),
                            regionCode: 'JP',
                            regionName: '日本',
                            currentViewCount: 1000,
                            previousViewCount: 700,
                            viewCountDelta: 999,
                            viewGrowthRate: 1.25,
                            viewsPerHour: 44.4,
                            likeCount: 123,
                            commentCount: 45,
                            currentCollectedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'UTC'),
                            previousCollectedAt: CarbonImmutable::parse('2026-05-25 12:00:00', 'UTC'),
                            comparisonDays: 7,
                        ),
                    ]);

                    return new DanceShortVideoRankingPageDTO(
                        regions: [
                            new DanceShortVideoRankingRegionDTO('JP', '日本'),
                        ],
                        rankingList: $rankingList,
                        rankingListsByRegion: [
                            'JP' => $rankingList,
                        ],
                        selectedRegionCode: 'JP',
                        comparisonDays: 7,
                        limit: 20,
                        sortKey: 'views_per_hour',
                        comparisonDayOptions: [1, 3, 7, 14, 30],
                        sortKeyOptions: [
                            'views_per_hour',
                            'view_count_delta',
                            'view_growth_rate',
                            'current_view_count',
                        ],
                    );
                }
            },
        );

        $this
            ->get('/dance-shorts-radar')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('ranking.items.0.currentViewCount', 1000)
                ->where('ranking.items.0.previousViewCount', 700)
                ->where('ranking.items.0.viewCountDelta', 999)
                ->where('ranking.items.0.viewGrowthRate', 1.25)
                ->where('ranking.items.0.viewsPerHour', 44.4)
                ->where('ranking.items.0.likeCount', 123)
                ->where('ranking.items.0.commentCount', 45)
                ->where('candidatesByRegion.JP.0.view_diff', 999)
                ->where('candidatesByRegion.JP.0.view_growth_rate', 1.25)
                ->where('candidatesByRegion.JP.0.views_per_hour', 44.4)
                ->where('candidatesByRegion.JP.0.like_count', 123)
                ->where('candidatesByRegion.JP.0.comment_count', 45)
            );
    }

    private function region(string $code, string $name, int $sortOrder): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => $code,
            'name' => $name,
            'sort_order' => $sortOrder,
            'is_active' => true,
        ]);
    }

    private function video(string $youtubeVideoId, string $title): DanceShortVideo
    {
        return DanceShortVideo::query()->create([
            'youtube_video_id' => $youtubeVideoId,
            'title' => $title,
            'channel_title' => 'Dance Channel',
            'thumbnail_url' => 'https://example.test/thumb.jpg',
            'published_at' => '2026-05-30 09:00:00',
            'url' => 'https://www.youtube.com/shorts/'.$youtubeVideoId,
            'tracking_status' => 'active',
        ]);
    }

    private function snapshot(
        DanceShortVideo $video,
        DanceShortRegion $region,
        int $viewCount,
        string $collectedAt,
        ?int $likeCount = null,
        ?int $commentCount = null,
    ): DanceShortVideoSnapshot {
        return DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => $viewCount,
            'like_count' => $likeCount,
            'comment_count' => $commentCount,
            'collected_at' => $collectedAt,
        ]);
    }
}

class ThrowingRankingPageYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    public int $callCount = 0;

    /**
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        $this->callCount++;

        throw new RuntimeException('Ranking page should not call YouTube search.');
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        $this->callCount++;

        throw new RuntimeException('Ranking page should not call YouTube details.');
    }
}
