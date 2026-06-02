<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Queries\GetDanceShortVideoRankingPageAction;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateListDTO;
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
        $us = DanceShortRegion::query()->where('code', 'US')->firstOrFail();
        $video = $this->video('jp-ranking-video', 'JP ranking short');
        $usRisingVideo = $this->video('us-rising-video', 'US rising short');

        $this->snapshot($video, $jp, 700, '2026-05-31 12:00:00');
        $this->snapshot($video, $jp, 1000, '2026-06-01 12:00:00', 789, 12);
        $this->snapshot($usRisingVideo, $us, 1000, '2026-05-31 12:00:00');
        $this->snapshot($usRisingVideo, $us, 1200, '2026-06-01 12:00:00');

        $this
            ->get('/dance-shorts-radar')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsRadar/Index', false)
                ->where('displaySelectField.selectedTab', 'RISING')
                ->where('displaySelectField.comparisonDays', 1)
                ->where('displaySelectField.sortKey', 'views_per_hour')
                ->where('displaySelectField.showSortKeyOptions', false)
                ->has('displaySelectField.regionTabs', 5)
                ->where('displaySelectField.regionTabs.0.code', 'RISING')
                ->where('displaySelectField.regionTabs.0.label', '上昇候補')
                ->where('displaySelectField.regionTabs.0.href', '/dance-shorts-radar?region=RISING&comparisonDays=1&sort=views_per_hour&limit=20')
                ->where('displaySelectField.regionTabs.0.isActive', true)
                ->where('displaySelectField.regionTabs.1.code', 'ALL')
                ->where('displaySelectField.regionTabs.1.label', 'まとめ')
                ->where('displaySelectField.regionTabs.1.href', '/dance-shorts-radar?region=ALL&comparisonDays=1&sort=views_per_hour&limit=20')
                ->where('displaySelectField.regionTabs.1.isActive', false)
                ->where('displaySelectField.regionTabs.2.code', 'JP')
                ->where('displaySelectField.regionTabs.2.label', '日本')
                ->where('displaySelectField.regionTabs.2.isActive', false)
                ->where('displaySelectField.regionTabs.3.code', 'US')
                ->where('displaySelectField.regionTabs.3.label', 'アメリカ')
                ->where('displaySelectField.regionTabs.4.code', 'KR')
                ->where('displaySelectField.regionTabs.4.label', '韓国')
                ->where('displaySelectField.comparisonDayOptions.0.value', 1)
                ->where('displaySelectField.comparisonDayOptions.0.href', '/dance-shorts-radar?region=RISING&comparisonDays=1&sort=views_per_hour&limit=20')
                ->where('displaySelectField.comparisonDayOptions.0.isActive', true)
                ->where('displaySelectField.comparisonDayOptions.2.value', 7)
                ->where('displaySelectField.comparisonDayOptions.2.isActive', false)
                ->where('displaySelectField.sortKeyOptions.0.value', 'views_per_hour')
                ->where('displaySelectField.sortKeyOptions.0.isActive', true)
                ->where('displaySelectField.sortKeyOptions.1.href', '/dance-shorts-radar?region=RISING&comparisonDays=1&sort=view_count_delta&limit=20')
                ->where('displayHeaderField.title', '上昇候補')
                ->where('displayHeaderField.description', '海外先行で伸びている候補')
                ->where('displayHeaderField.selectedTabLabel', '上昇候補')
                ->where('displayHeaderField.comparisonDaysLabel', '1日比較')
                ->where('displayHeaderField.cardCountLabel', '1件')
                ->where('displayHeaderField.sortLabel', '上昇候補順')
                ->where('displayCardField.type', 'rising')
                ->has('displayCardField.cards', 1)
                ->where('displayCardField.cards.0.youtube_video_id', 'us-rising-video')
                ->where('displayCardField.cards.0.source_region', 'US')
                ->where('displayCardField.cards.0.view_count_delta', 200)
                ->where('displayCardField.emptyMessage', '表示できる上昇候補はまだありません。')
                ->missing('filters')
                ->missing('regionTabs')
                ->missing('comparisonDayOptions')
                ->missing('sortKeyOptions')
                ->missing('candidatesByRegion')
                ->missing('allCandidates')
                ->missing('risingCandidates')
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
                ->where('displaySelectField.selectedTab', 'RISING')
                ->where('displaySelectField.showSortKeyOptions', false)
                ->has('displaySelectField.regionTabs', 5)
                ->where('displaySelectField.regionTabs.0.code', 'RISING')
                ->where('displaySelectField.regionTabs.0.label', '上昇候補')
                ->where('displaySelectField.regionTabs.0.isActive', true)
                ->where('displaySelectField.regionTabs.1.code', 'ALL')
                ->where('displaySelectField.regionTabs.1.label', 'まとめ')
                ->where('displaySelectField.regionTabs.1.isActive', false)
                ->where('displaySelectField.regionTabs.2.code', 'JP')
                ->where('displaySelectField.regionTabs.2.label', '日本')
                ->where('displaySelectField.regionTabs.3.code', 'US')
                ->where('displaySelectField.regionTabs.3.label', 'アメリカ')
                ->where('displaySelectField.regionTabs.4.code', 'KR')
                ->where('displaySelectField.regionTabs.4.label', '韓国')
                ->where('displayHeaderField.title', '上昇候補')
                ->where('displayHeaderField.comparisonDaysLabel', '1日比較')
                ->where('displayHeaderField.cardCountLabel', '0件')
                ->where('displayHeaderField.sortLabel', '上昇候補順')
                ->where('displayCardField.type', 'rising')
                ->has('displayCardField.cards', 0)
                ->where('displayCardField.emptyMessage', '表示できる上昇候補はまだありません。')
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
                ->where('displaySelectField.selectedTab', 'US')
                ->where('displaySelectField.comparisonDays', 1)
                ->where('displaySelectField.sortKey', 'view_count_delta')
                ->where('displaySelectField.showSortKeyOptions', true)
                ->where('displayHeaderField.title', 'アメリカ')
                ->where('displayHeaderField.comparisonDaysLabel', '1日比較')
                ->where('displayHeaderField.cardCountLabel', '1件')
                ->where('displayHeaderField.sortLabel', '視聴増加数')
                ->where('displayCardField.type', 'ranking')
                ->where('displayCardField.cards.0.youtube_video_id', 'us-video')
                ->where('displayCardField.cards.0.region', 'US')
                ->where('displayCardField.cards.0.previous_view_count', 900)
                ->where('displayCardField.cards.0.view_diff', 100)
            );
    }

    public function test_page_passes_current_only_fallback_props_as_null_without_zero_values(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $video = $this->video('initial-only-video', 'Initial only short');

        $this->snapshot($video, $jp, 1500, '2026-06-01 12:00:00', 25, 3);

        $this
            ->get('/dance-shorts-radar?region=JP&comparisonDays=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('displaySelectField.selectedTab', 'JP')
                ->where('displaySelectField.comparisonDays', 1)
                ->where('displayHeaderField.title', '日本')
                ->where('displayHeaderField.cardCountLabel', '1件')
                ->where('displayCardField.type', 'ranking')
                ->where('displayCardField.cards.0.youtube_video_id', 'initial-only-video')
                ->where('displayCardField.cards.0.view_count', 1500)
                ->where('displayCardField.cards.0.previous_view_count', null)
                ->where('displayCardField.cards.0.view_diff', null)
                ->where('displayCardField.cards.0.view_growth_rate', null)
                ->where('displayCardField.cards.0.views_per_hour', null)
                ->where('displayCardField.cards.0.has_previous_snapshot', false)
                ->where('displayCardField.cards.0.comparison_status', '比較元なし')
            );
    }

    public function test_summary_tab_uses_all_candidates_sorted_by_selected_ranking_key(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $us = $this->region('US', 'アメリカ', 20);
        $kr = $this->region('KR', '韓国', 30);
        $jpVideo = $this->video('jp-summary-video', 'JP summary short');
        $usVideo = $this->video('us-summary-video', 'US summary short');
        $krVideo = $this->video('kr-summary-video', 'KR summary short');

        $this->snapshot($jpVideo, $jp, 900, '2026-05-31 12:00:00');
        $this->snapshot($jpVideo, $jp, 1000, '2026-06-01 12:00:00');
        $this->snapshot($usVideo, $us, 500, '2026-05-31 12:00:00');
        $this->snapshot($usVideo, $us, 1000, '2026-06-01 12:00:00');
        $this->snapshot($krVideo, $kr, 700, '2026-05-31 12:00:00');
        $this->snapshot($krVideo, $kr, 1000, '2026-06-01 12:00:00');

        $this
            ->get('/dance-shorts-radar?region=ALL&sort=view_count_delta')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('displaySelectField.selectedTab', 'ALL')
                ->where('displaySelectField.sortKey', 'view_count_delta')
                ->where('displaySelectField.showSortKeyOptions', true)
                ->where('displaySelectField.regionTabs.0.code', 'RISING')
                ->where('displaySelectField.regionTabs.0.label', '上昇候補')
                ->where('displaySelectField.regionTabs.0.isActive', false)
                ->where('displaySelectField.regionTabs.1.code', 'ALL')
                ->where('displaySelectField.regionTabs.1.label', 'まとめ')
                ->where('displaySelectField.regionTabs.1.isActive', true)
                ->where('displayHeaderField.title', 'まとめ')
                ->where('displayHeaderField.cardCountLabel', '3件')
                ->where('displayHeaderField.sortLabel', '視聴増加数')
                ->where('displayCardField.type', 'ranking')
                ->where('displayCardField.cards.0.youtube_video_id', 'us-summary-video')
                ->where('displayCardField.cards.1.youtube_video_id', 'kr-summary-video')
                ->where('displayCardField.cards.2.youtube_video_id', 'jp-summary-video')
            );
    }

    public function test_rising_candidates_use_us_or_kr_source_and_smaller_japan_delta(): void
    {
        $jp = $this->region('JP', '日本', 10);
        $us = $this->region('US', 'アメリカ', 20);
        $kr = $this->region('KR', '韓国', 30);
        $usVideo = $this->video('us-rising-candidate', 'US rising candidate');
        $krVideo = $this->video('kr-rising-candidate', 'KR rising candidate');
        $notCandidateVideo = $this->video('jp-already-large', 'JP already large');

        $this->snapshot($usVideo, $us, 1000, '2026-05-31 12:00:00');
        $this->snapshot($usVideo, $us, 1800, '2026-06-01 12:00:00');

        $this->snapshot($krVideo, $kr, 1000, '2026-05-31 12:00:00');
        $this->snapshot($krVideo, $kr, 1500, '2026-06-01 12:00:00');
        $this->snapshot($krVideo, $jp, 1000, '2026-05-31 12:00:00');
        $this->snapshot($krVideo, $jp, 1100, '2026-06-01 12:00:00');

        $this->snapshot($notCandidateVideo, $us, 1000, '2026-05-31 12:00:00');
        $this->snapshot($notCandidateVideo, $us, 1200, '2026-06-01 12:00:00');
        $this->snapshot($notCandidateVideo, $jp, 1000, '2026-05-31 12:00:00');
        $this->snapshot($notCandidateVideo, $jp, 1600, '2026-06-01 12:00:00');

        $this
            ->get('/dance-shorts-radar?region=RISING&comparisonDays=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('displaySelectField.selectedTab', 'RISING')
                ->where('displaySelectField.regionTabs.0.code', 'RISING')
                ->where('displaySelectField.regionTabs.0.isActive', true)
                ->where('displaySelectField.showSortKeyOptions', false)
                ->where('displayHeaderField.title', '上昇候補')
                ->where('displayHeaderField.cardCountLabel', '2件')
                ->where('displayHeaderField.sortLabel', '上昇候補順')
                ->where('displayCardField.type', 'rising')
                ->where('displayCardField.cards.0.youtube_video_id', 'us-rising-candidate')
                ->where('displayCardField.cards.0.source_region', 'US')
                ->where('displayCardField.cards.1.youtube_video_id', 'kr-rising-candidate')
                ->where('displayCardField.cards.1.japan_view_count_delta', 100)
                ->missing('displayCardField.cards.2')
            );
    }

    public function test_rising_candidates_ignore_user_sort_key_and_keep_null_growth_rate(): void
    {
        $us = $this->region('US', 'アメリカ', 20);
        $highCurrentSmallDelta = $this->video('high-current-small-delta', 'High current small delta');
        $lowerCurrentLargeDelta = $this->video('lower-current-large-delta', 'Lower current large delta');
        $nullGrowthVideo = $this->video('null-growth-rising', 'Null growth rising');

        $this->snapshot($highCurrentSmallDelta, $us, 9900, '2026-05-31 12:00:00');
        $this->snapshot($highCurrentSmallDelta, $us, 10000, '2026-06-01 12:00:00');

        $this->snapshot($lowerCurrentLargeDelta, $us, 1000, '2026-05-31 12:00:00');
        $this->snapshot($lowerCurrentLargeDelta, $us, 1800, '2026-06-01 12:00:00');

        $this->snapshot($nullGrowthVideo, $us, 0, '2026-05-31 12:00:00');
        $this->snapshot($nullGrowthVideo, $us, 500, '2026-06-01 12:00:00');

        $this
            ->get('/dance-shorts-radar?region=RISING&comparisonDays=1&sort=current_view_count')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('displaySelectField.selectedTab', 'RISING')
                ->where('displaySelectField.sortKey', 'current_view_count')
                ->where('displaySelectField.showSortKeyOptions', false)
                ->where('displayHeaderField.sortLabel', '上昇候補順')
                ->where('displayCardField.type', 'rising')
                ->where('displayCardField.cards.0.youtube_video_id', 'lower-current-large-delta')
                ->where('displayCardField.cards.1.youtube_video_id', 'null-growth-rising')
                ->where('displayCardField.cards.1.view_growth_rate', null)
                ->where('displayCardField.cards.2.youtube_video_id', 'high-current-small-delta')
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
                    ->where('displaySelectField.comparisonDays', $comparisonDays)
                    ->where('displayHeaderField.comparisonDaysLabel', $comparisonDays.'日比較')
                );

            $this
                ->get('/dance-shorts-radar?comparisonDays='.$comparisonDays)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('displaySelectField.comparisonDays', $comparisonDays)
                    ->where('displayHeaderField.comparisonDaysLabel', $comparisonDays.'日比較')
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

    public function test_request_allows_only_expected_region_query_values(): void
    {
        $this->region('JP', '日本', 10);
        $this->region('US', 'アメリカ', 20);
        $this->region('KR', '韓国', 30);

        foreach (['RISING', 'ALL', 'JP', 'US', 'KR'] as $regionCode) {
            $this
                ->get('/dance-shorts-radar?region='.$regionCode)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('displaySelectField.selectedTab', $regionCode)
                );
        }

        $this
            ->from('/dance-shorts-radar')
            ->get('/dance-shorts-radar?region=INVALID')
            ->assertRedirect('/dance-shorts-radar')
            ->assertSessionHasErrors('region');
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
                            hasPreviousSnapshot: true,
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
                        allRankingList: $rankingList,
                        risingCandidateList: new DanceShortVideoRisingCandidateListDTO([]),
                        displayCardField: new DanceShortDisplayCardFieldDTO(
                            type: DanceShortDisplayCardFieldDTO::TYPE_RANKING,
                            cards: new DanceShortDisplayCardListDTO([
                                new DanceShortRankingDisplayCardDTO($rankingList->items[0]),
                            ]),
                            emptyMessage: 'DTOから渡した空状態メッセージ',
                        ),
                        selectedTabCode: 'JP',
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
                ->where('displaySelectField.selectedTab', 'JP')
                ->where('displaySelectField.comparisonDays', 7)
                ->where('displaySelectField.sortKey', 'views_per_hour')
                ->where('displaySelectField.showSortKeyOptions', true)
                ->where('displayHeaderField.title', '日本')
                ->where('displayHeaderField.comparisonDaysLabel', '7日比較')
                ->where('displayHeaderField.cardCountLabel', '1件')
                ->where('displayHeaderField.sortLabel', '1時間あたり')
                ->where('displayCardField.type', 'ranking')
                ->where('displayCardField.emptyMessage', 'DTOから渡した空状態メッセージ')
                ->where('displayCardField.cards.0.view_diff', 999)
                ->where('displayCardField.cards.0.view_growth_rate', 1.25)
                ->where('displayCardField.cards.0.views_per_hour', 44.4)
                ->where('displayCardField.cards.0.like_count', 123)
                ->where('displayCardField.cards.0.comment_count', 45)
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
