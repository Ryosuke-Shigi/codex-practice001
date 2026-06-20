<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortPage2VideosAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Enums\DanceShortsRadar\DanceShortSearchScope;
use App\Events\DanceShortsRadar\DanceShortRankingReadModelRefreshRequested;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Models\DanceShortVideo;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

class SyncDanceShortPage2VideosActionTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_execute_uses_only_expanded_keywords_deduplicates_page2_ids_and_persists_details(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'));
        config([
            'services.youtube.discover_max_results' => 50,
            'services.youtube.discover_published_after_days' => 7,
        ]);

        $jp = $this->region('JP', '日本', true);
        $us = $this->region('US', 'アメリカ', true);
        $this->keyword($jp, 'standard keyword', DanceShortSearchScope::Standard, 1, 10, true);
        $this->keyword($jp, 'expanded keyword', DanceShortSearchScope::Expanded, 2, 20, true);
        $this->keyword($jp, 'inactive expanded keyword', DanceShortSearchScope::Expanded, 2, 30, false);
        $this->keyword($jp, 'one page expanded keyword', DanceShortSearchScope::Expanded, 1, 40, true);
        $this->keyword($us, 'us expanded keyword', DanceShortSearchScope::Expanded, 2, 10, true);

        $youtubeRepository = new Page2FakeDanceShortYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);
        Event::fake([DanceShortRankingReadModelRefreshRequested::class]);

        $result = app(SyncDanceShortPage2VideosAction::class)->execute();

        $this->assertSame(2, $result->searchedRegionCount);
        $this->assertSame(2, $result->searchedKeywordCount);
        $this->assertSame(3, $result->fetchedVideoCount);
        $this->assertSame(3, $result->fetchedVideoDetailCount);
        $this->assertSame(3, $result->insertedVideoCount);
        $this->assertSame(3, $result->savedSnapshotCount);
        $this->assertSame(0, $result->failedCount);
        $this->assertSame([
            ['keyword' => 'expanded keyword', 'pageToken' => null],
            ['keyword' => 'expanded keyword', 'pageToken' => 'jp-page-2'],
            ['keyword' => 'us expanded keyword', 'pageToken' => null],
            ['keyword' => 'us expanded keyword', 'pageToken' => 'us-page-2'],
        ], $youtubeRepository->searchPageCalls);
        $this->assertSame([
            ['jp-page2-video-001', 'jp-page2-video-002'],
            ['us-page2-video-001'],
        ], $youtubeRepository->fetchVideoIdsCalls);

        $this->assertDatabaseHas('dance_short_videos', [
            'youtube_video_id' => 'jp-page2-video-001',
            'title' => 'Saved jp-page2-video-001',
        ]);
        $jpVideo = DanceShortVideo::query()->where('youtube_video_id', 'jp-page2-video-001')->firstOrFail();
        $usVideo = DanceShortVideo::query()->where('youtube_video_id', 'us-page2-video-001')->firstOrFail();
        $this->assertDatabaseHas('dance_short_video_regions', [
            'video_id' => $jpVideo->getKey(),
            'region_id' => $jp->getKey(),
            'first_detected_at' => '2026-06-01 12:00:00',
            'last_detected_at' => '2026-06-01 12:00:00',
        ]);
        $this->assertDatabaseHas('dance_short_video_regions', [
            'video_id' => $usVideo->getKey(),
            'region_id' => $us->getKey(),
            'first_detected_at' => '2026-06-01 12:00:00',
            'last_detected_at' => '2026-06-01 12:00:00',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'region_id' => $jp->getKey(),
            'view_count' => 1000,
            'collected_at' => '2026-06-01 12:00:00',
        ]);
        $this->assertDatabaseMissing('dance_short_videos', [
            'youtube_video_id' => 'jp-page1-video-ignored',
        ]);
        Event::assertDispatched(
            DanceShortRankingReadModelRefreshRequested::class,
            fn (DanceShortRankingReadModelRefreshRequested $event): bool => $event->source === 'page2_video_search_completed',
        );
    }

    public function test_execute_does_not_fetch_page2_when_first_page_has_no_next_token(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'));
        $jp = $this->region('JP', '日本', true);
        $this->keyword($jp, 'no token keyword', DanceShortSearchScope::Expanded, 2, 10, true);

        $youtubeRepository = new Page2NoTokenDanceShortYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        $result = app(SyncDanceShortPage2VideosAction::class)->execute();

        $this->assertSame(1, $result->searchedKeywordCount);
        $this->assertSame(0, $result->fetchedVideoCount);
        $this->assertSame(0, $result->fetchedVideoDetailCount);
        $this->assertSame([
            ['keyword' => 'no token keyword', 'pageToken' => null],
        ], $youtubeRepository->searchPageCalls);
        $this->assertSame([], $youtubeRepository->fetchVideoIdsCalls);
    }

    public function test_execute_never_fetches_beyond_keyword_max_search_pages(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'));
        $jp = $this->region('JP', '日本', true);
        $this->keyword($jp, 'three page keyword', DanceShortSearchScope::Expanded, 3, 10, true);

        $youtubeRepository = new Page2MaxPageDanceShortYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        $result = app(SyncDanceShortPage2VideosAction::class)->execute();

        $this->assertSame(2, $result->fetchedVideoCount);
        $this->assertSame([
            ['keyword' => 'three page keyword', 'pageToken' => null],
            ['keyword' => 'three page keyword', 'pageToken' => 'page-2'],
            ['keyword' => 'three page keyword', 'pageToken' => 'page-3'],
        ], $youtubeRepository->searchPageCalls);
        $this->assertSame([
            ['page2-video', 'page3-video'],
        ], $youtubeRepository->fetchVideoIdsCalls);
    }

    private function region(string $code, string $name, bool $isActive): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => $code,
            'name' => $name,
            'is_active' => $isActive,
        ]);
    }

    private function keyword(
        DanceShortRegion $region,
        string $keyword,
        DanceShortSearchScope $scope,
        int $maxSearchPages,
        int $sortOrder,
        bool $isActive,
    ): DanceShortSearchKeyword {
        return DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => $keyword,
            'search_scope' => $scope->value,
            'max_search_pages' => $maxSearchPages,
            'sort_order' => $sortOrder,
            'is_active' => $isActive,
        ]);
    }
}

class Page2FakeDanceShortYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    /**
     * @var array<int, array{keyword: string, pageToken: string|null}>
     */
    public array $searchPageCalls = [];

    /**
     * @var array<int, array<int, string>>
     */
    public array $fetchVideoIdsCalls = [];

    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        throw new RuntimeException('Page2 sync should use page-aware search.');
    }

    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        $this->searchPageCalls[] = [
            'keyword' => $condition->keyword,
            'pageToken' => $pageToken,
        ];

        return match ([$condition->keyword, $pageToken]) {
            ['expanded keyword', null] => new YouTubeVideoSearchResultDTO(
                items: [$this->searchItem('jp-page1-video-ignored')],
                nextPageToken: 'jp-page-2',
            ),
            ['expanded keyword', 'jp-page-2'] => new YouTubeVideoSearchResultDTO(
                items: [
                    $this->searchItem('jp-page2-video-001'),
                    $this->searchItem('jp-page2-video-002'),
                    $this->searchItem('jp-page2-video-001'),
                ],
                nextPageToken: 'jp-page-3-ignored',
            ),
            ['us expanded keyword', null] => new YouTubeVideoSearchResultDTO(
                items: [],
                nextPageToken: 'us-page-2',
            ),
            ['us expanded keyword', 'us-page-2'] => new YouTubeVideoSearchResultDTO(
                items: [$this->searchItem('us-page2-video-001')],
                nextPageToken: null,
            ),
            default => new YouTubeVideoSearchResultDTO(items: [], nextPageToken: null),
        };
    }

    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        $this->fetchVideoIdsCalls[] = array_values($youtubeVideoIds);

        return array_map(
            fn (string $youtubeVideoId): YouTubeVideoDetailDTO => $this->detail($youtubeVideoId),
            $youtubeVideoIds,
        );
    }

    protected function searchItem(string $youtubeVideoId): YouTubeVideoSearchItemDTO
    {
        return new YouTubeVideoSearchItemDTO(
            youtubeVideoId: $youtubeVideoId,
            title: null,
            description: null,
            channelId: null,
            channelTitle: null,
            publishedAt: null,
            thumbnailUrl: null,
        );
    }

    protected function detail(string $youtubeVideoId): YouTubeVideoDetailDTO
    {
        return new YouTubeVideoDetailDTO(
            youtubeVideoId: $youtubeVideoId,
            title: 'Saved '.$youtubeVideoId,
            description: 'Dance description.',
            channelId: 'channel-001',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/high.jpg',
            publishedAt: '2026-06-01T12:00:00Z',
            categoryId: '10',
            tags: ['dance', 'shorts'],
            duration: 'PT58S',
            defaultLanguage: 'ja',
            defaultAudioLanguage: 'ja',
            liveBroadcastContent: 'none',
            embeddable: true,
            viewCount: 1000,
            likeCount: 50,
            commentCount: 5,
        );
    }
}

class Page2NoTokenDanceShortYouTubeVideoApiRepository extends Page2FakeDanceShortYouTubeVideoApiRepository
{
    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        $this->searchPageCalls[] = [
            'keyword' => $condition->keyword,
            'pageToken' => $pageToken,
        ];

        return new YouTubeVideoSearchResultDTO(
            items: [$this->searchItem('page1-only-video')],
            nextPageToken: null,
        );
    }
}

class Page2MaxPageDanceShortYouTubeVideoApiRepository extends Page2FakeDanceShortYouTubeVideoApiRepository
{
    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        $this->searchPageCalls[] = [
            'keyword' => $condition->keyword,
            'pageToken' => $pageToken,
        ];

        return match ($pageToken) {
            null => new YouTubeVideoSearchResultDTO(items: [], nextPageToken: 'page-2'),
            'page-2' => new YouTubeVideoSearchResultDTO(
                items: [$this->searchItem('page2-video')],
                nextPageToken: 'page-3',
            ),
            'page-3' => new YouTubeVideoSearchResultDTO(
                items: [$this->searchItem('page3-video')],
                nextPageToken: 'page-4-should-not-be-called',
            ),
            default => throw new RuntimeException('Page2 sync exceeded max_search_pages.'),
        };
    }
}
