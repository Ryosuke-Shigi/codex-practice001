<?php

namespace Tests\Feature\DanceShortsAnalyzer;

use App\Actions\DanceShortsAnalyzer\Queries\GetDanceShortsAnalyzerSearchPageAction;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchInputDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchPageResultDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerVideoDTO;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerVideoListDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Models\DanceShortVideo;
use App\Repositories\DanceShortsAnalyzer\DanceShortsAnalyzerVideoRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Database\Seeders\DanceShortRegionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

/*
 * DanceShortsAnalyzer PRODUCT の Search + Cards 画面テストです。
 *
 * PR1 では保存済み dance_short_videos の keyword 検索だけを固定します。
 * snapshot / region / YouTube API / graph / table は対象外なので、このテストでも呼ばないことを確認します。
 */
class DanceShortsAnalyzerSearchPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_page_is_available_without_keyword_and_does_not_search_database(): void
    {
        /*
         * 初期表示で Repository が呼ばれると、全件取得や React 側絞り込みへ流れやすくなります。
         * fake Repository の callCount で「keyword 未入力時は検索しない」を直接守ります。
         */
        $repository = new CountingDanceShortsAnalyzerVideoRepository;
        $this->app->instance(DanceShortsAnalyzerVideoRepositoryInterface::class, $repository);

        $this
            ->get('/dance-shorts-analyzer')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsAnalyzer/Index', false)
                ->where('searchField.keyword', '')
                ->where('searchField.action', '/dance-shorts-analyzer')
                ->where('searchField.button_label', 'Search')
                ->has('cardsField.videos', 0)
                ->where('cardsField.empty_message', 'キーワードを入力してください。')
                ->where('cardsField.has_searched', false)
                ->where('cardsField.has_more', false)
                ->where('cardsField.next_page', null)
                ->where('cardsField.current_page', 1)
                ->where('cardsField.per_page', 20)
                ->where('cardsField.sort', 'published_desc')
                ->where('cardsField.sort_options.0.value', 'published_desc')
                ->where('cardsField.sort_options.0.label', '登録日 ↓')
                ->where('cardsField.sort_options.1.value', 'published_asc')
                ->where('cardsField.sort_options.1.label', '登録日 ↑')
            );

        $this->assertSame(0, $repository->callCount);
    }

    public function test_search_matches_video_id_title_description_channel_title_and_tags(): void
    {
        $this->video([
            'youtube_video_id' => 'dance-target-video-id',
            'title' => 'Other title',
            'description' => 'Other description',
            'channel_title' => 'Other channel',
            'tags' => ['other'],
            'published_at' => '2026-06-01 12:00:00',
        ]);
        $this->video([
            'youtube_video_id' => 'other-title-id',
            'title' => 'Stored dance-target title',
            'description' => 'Other description',
            'channel_title' => 'Other channel',
            'tags' => ['other'],
            'published_at' => '2026-06-02 12:00:00',
        ]);
        $this->video([
            'youtube_video_id' => 'other-description-id',
            'title' => 'Other title',
            'description' => 'Stored dance-target description',
            'channel_title' => 'Other channel',
            'tags' => ['other'],
            'published_at' => '2026-06-03 12:00:00',
        ]);
        $this->video([
            'youtube_video_id' => 'other-channel-id',
            'title' => 'Other title',
            'description' => 'Other description',
            'channel_title' => 'Dance-target Channel',
            'tags' => ['other'],
            'published_at' => '2026-06-04 12:00:00',
        ]);
        $this->video([
            'youtube_video_id' => 'other-tags-id',
            'title' => 'Other title',
            'description' => 'Other description',
            'channel_title' => 'Other channel',
            'tags' => ['dance-target-tag'],
            'published_at' => '2026-06-05 12:00:00',
        ]);
        $this->video([
            'youtube_video_id' => 'not-matched',
            'title' => 'Other title',
            'description' => 'Other description',
            'channel_title' => 'Other channel',
            'tags' => ['other'],
            'published_at' => '2026-06-06 12:00:00',
        ]);

        $this
            ->get('/dance-shorts-analyzer?keyword=dance-target')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsAnalyzer/Index', false)
                ->where('searchField.keyword', 'dance-target')
                ->has('cardsField.videos', 5)
                ->where('cardsField.videos.0.youtube_video_id', 'other-tags-id')
                ->where('cardsField.videos.1.youtube_video_id', 'other-channel-id')
                ->where('cardsField.videos.2.youtube_video_id', 'other-description-id')
                ->where('cardsField.videos.3.youtube_video_id', 'other-title-id')
                ->where('cardsField.videos.4.youtube_video_id', 'dance-target-video-id')
                ->where('cardsField.has_more', false)
                ->where('cardsField.next_page', null)
                ->where('cardsField.empty_message', null)
            );
    }

    public function test_search_returns_twenty_results_and_pagination_props(): void
    {
        foreach (range(1, 21) as $index) {
            $this->video([
                'youtube_video_id' => sprintf('page-keyword-%02d', $index),
                'title' => 'Dance page keyword',
                'published_at' => CarbonImmutable::parse('2026-06-01 12:00:00')
                    ->addMinutes($index)
                    ->format('Y-m-d H:i:s'),
            ]);
        }

        $this
            ->get('/dance-shorts-analyzer?keyword=page-keyword')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('cardsField.videos', 20)
                ->missing('cardsField.videos.20')
                ->where('cardsField.videos.0.youtube_video_id', 'page-keyword-21')
                ->where('cardsField.videos.19.youtube_video_id', 'page-keyword-02')
                ->where('cardsField.has_more', true)
                ->where('cardsField.next_page', 2)
                ->where('cardsField.current_page', 1)
                ->where('cardsField.per_page', 20)
            );

        $this
            ->get('/dance-shorts-analyzer?keyword=page-keyword&page=2')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('cardsField.videos', 1)
                ->where('cardsField.videos.0.youtube_video_id', 'page-keyword-01')
                ->where('cardsField.has_more', false)
                ->where('cardsField.next_page', null)
                ->where('cardsField.current_page', 2)
                ->where('cardsField.per_page', 20)
            );

        $this
            ->get('/dance-shorts-analyzer?keyword=page-keyword&sort=published_asc')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('cardsField.videos', 20)
                ->where('cardsField.videos.0.youtube_video_id', 'page-keyword-01')
                ->where('cardsField.videos.19.youtube_video_id', 'page-keyword-20')
                ->where('cardsField.has_more', true)
                ->where('cardsField.next_page', 2)
                ->where('cardsField.current_page', 1)
                ->where('cardsField.sort', 'published_asc')
            );
    }

    public function test_search_builds_shorts_url_in_responder_without_using_saved_url(): void
    {
        $this->video([
            'youtube_video_id' => 'shorts-url-source',
            'title' => 'Shorts URL source',
            'url' => 'https://example.test/not-used',
        ]);

        $this
            ->get('/dance-shorts-analyzer?keyword=shorts-url-source')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('cardsField.videos', 1)
                ->where('cardsField.videos.0.youtube_video_id', 'shorts-url-source')
                ->where('cardsField.videos.0.youtube_url', 'https://www.youtube.com/shorts/shorts-url-source')
            );
    }

    public function test_search_does_not_call_youtube_api_and_works_without_snapshots_or_regions(): void
    {
        /*
         * PRODUCT 検索は保存済み dance_short_videos だけを読むため、
         * YouTube API repository が呼ばれた時点でテストを落とします。
         */
        $youtubeRepository = new ThrowingAnalyzerPageYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        $this->video([
            'youtube_video_id' => 'no-snapshot-region',
            'title' => 'No snapshot region keyword',
        ]);

        $this
            ->get('/dance-shorts-analyzer?keyword=no-snapshot-region')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsAnalyzer/Index', false)
                ->has('cardsField.videos', 1)
                ->where('cardsField.videos.0.youtube_video_id', 'no-snapshot-region')
            );

        $this->assertSame(0, $youtubeRepository->callCount);
    }

    public function test_responder_shapes_search_field_cards_field_and_youtube_url_from_dto(): void
    {
        $this->app->instance(
            GetDanceShortsAnalyzerSearchPageAction::class,
            new class extends GetDanceShortsAnalyzerSearchPageAction
            {
                public function __construct() {}

                public function execute(DanceShortsAnalyzerSearchInputDTO $input): DanceShortsAnalyzerSearchPageResultDTO
                {
                    return new DanceShortsAnalyzerSearchPageResultDTO(
                        keyword: 'responder-keyword',
                        sort: 'published_asc',
                        hasSearched: true,
                        videoList: new DanceShortsAnalyzerVideoListDTO(
                            videos: [
                                new DanceShortsAnalyzerVideoDTO(
                                    videoId: 123,
                                    youtubeVideoId: 'responder-video',
                                    title: 'Responder Video',
                                    channelTitle: 'Responder Channel',
                                    thumbnailUrl: 'https://example.test/thumb.jpg',
                                    publishedAt: CarbonImmutable::parse('2026-06-01 12:00:00'),
                                    trackingStatus: 'active',
                                ),
                            ],
                            hasMore: true,
                            currentPage: 1,
                            perPage: 20,
                        ),
                    );
                }
            },
        );

        $this
            ->get('/dance-shorts-analyzer?keyword=ignored-by-fake')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('searchField.keyword', 'responder-keyword')
                ->where('searchField.action', '/dance-shorts-analyzer')
                ->where('searchField.button_label', 'Search')
                ->has('cardsField.videos', 1)
                ->where('cardsField.videos.0.video_id', 123)
                ->where('cardsField.videos.0.youtube_video_id', 'responder-video')
                ->where('cardsField.videos.0.youtube_url', 'https://www.youtube.com/shorts/responder-video')
                ->where('cardsField.empty_message', null)
                ->where('cardsField.has_more', true)
                ->where('cardsField.next_page', 2)
                ->where('cardsField.current_page', 1)
                ->where('cardsField.per_page', 20)
                ->where('cardsField.sort', 'published_asc')
            );
    }

    public function test_existing_lab_mock_and_radar_pages_remain_available(): void
    {
        $this->seed(DanceShortRegionSeeder::class);

        $this
            ->get('/lab/dance-shorts-analyzer-mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Lab/DanceShortsAnalyzerMock', false)
            );

        $this
            ->get('/dance-shorts-radar')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('DanceShortsRadar/Index', false)
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
}

class CountingDanceShortsAnalyzerVideoRepository implements DanceShortsAnalyzerVideoRepositoryInterface
{
    public int $callCount = 0;

    public function searchByKeyword(DanceShortsAnalyzerSearchInputDTO $input): DanceShortsAnalyzerVideoListDTO
    {
        $this->callCount++;

        return new DanceShortsAnalyzerVideoListDTO(
            videos: [],
            hasMore: false,
            currentPage: $input->page,
            perPage: DanceShortsAnalyzerSearchInputDTO::PER_PAGE,
        );
    }
}

class ThrowingAnalyzerPageYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    public int $callCount = 0;

    /**
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        $this->callCount++;

        throw new RuntimeException('DanceShortsAnalyzer should not call YouTube search.');
    }

    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        $this->callCount++;

        throw new RuntimeException('DanceShortsAnalyzer should not call YouTube search page.');
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        $this->callCount++;

        throw new RuntimeException('DanceShortsAnalyzer should not call YouTube details.');
    }
}
