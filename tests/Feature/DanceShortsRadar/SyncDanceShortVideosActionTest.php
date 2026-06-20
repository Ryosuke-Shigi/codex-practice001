<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortVideosAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoRegion;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class SyncDanceShortVideosActionTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_execute_searches_active_targets_fetches_details_and_saves_video_and_snapshot(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'));
        config([
            'services.youtube.discover_max_results' => 50,
            'services.youtube.discover_published_after_days' => 7,
        ]);

        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'dance shorts',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'dance challenge',
            'sort_order' => 20,
            'is_active' => true,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'inactive keyword',
            'sort_order' => 30,
            'is_active' => false,
        ]);
        $inactiveRegion = DanceShortRegion::query()->create([
            'code' => 'US',
            'name' => 'アメリカ',
            'sort_order' => 20,
            'is_active' => false,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $inactiveRegion->getKey(),
            'keyword' => 'should not search',
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $youtubeRepository = new FakeDanceShortYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        $result = app(SyncDanceShortVideosAction::class)->execute();

        $this->assertSame(1, $result->searchedRegionCount);
        $this->assertSame(2, $result->searchedKeywordCount);
        $this->assertSame(2, $result->fetchedVideoCount);
        $this->assertSame(2, $result->fetchedVideoDetailCount);
        $this->assertSame(1, $result->insertedVideoCount);
        $this->assertSame(0, $result->updatedVideoCount);
        $this->assertSame(1, $result->savedVideoCount);
        $this->assertSame(1, $result->savedSnapshotCount);
        $this->assertSame(0, $result->skippedVideoCount);
        $this->assertSame(0, $result->skippedSnapshotByTrackingCount);
        $this->assertSame(1, $result->excludedByShortsCount);
        $this->assertSame(0, $result->skippedPersistenceCount);
        $this->assertSame(0, $result->cleanedUpSnapshotCount);
        $this->assertSame(0, $result->failedCount);

        $this->assertSame(['dance shorts', 'dance challenge'], array_map(
            fn (DanceShortSearchConditionDTO $condition): string => $condition->keyword,
            $youtubeRepository->searchConditions,
        ));
        $this->assertSame('JP', $youtubeRepository->searchConditions[0]->regionCode);
        $this->assertSame('ja', $youtubeRepository->searchConditions[0]->relevanceLanguage);
        $this->assertSame(50, $youtubeRepository->searchConditions[0]->maxResults);
        $this->assertSame('2026-05-24T12:00:00+09:00', $youtubeRepository->searchConditions[0]->toArray()['publishedAfter']);
        $this->assertSame([['short-video-001', 'long-video-001']], $youtubeRepository->fetchVideoIdsCalls);

        $this->assertDatabaseHas('dance_short_videos', [
            'youtube_video_id' => 'short-video-001',
            'title' => 'Saved dance short',
            'duration' => 'PT58S',
        ]);
        $video = DanceShortVideo::query()->where('youtube_video_id', 'short-video-001')->firstOrFail();
        $this->assertDatabaseHas('dance_short_video_regions', [
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-05-31 12:00:00',
            'last_detected_at' => '2026-05-31 12:00:00',
        ]);
        $this->assertDatabaseMissing('dance_short_videos', [
            'youtube_video_id' => 'long-video-001',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'region_id' => $region->getKey(),
            'view_count' => 123456,
            'like_count' => 789,
            'comment_count' => 12,
            'collected_at' => '2026-05-31 12:00:00',
        ]);
    }

    public function test_execute_skips_snapshot_for_inactive_video_and_runs_cleanup_after_sync(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'));
        config([
            'services.youtube.discover_max_results' => 50,
            'services.youtube.discover_published_after_days' => 7,
            'dance_short.snapshot_retention_days' => 35,
        ]);

        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'dance shorts',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-001',
            'title' => 'Inactive dance short',
            'tracking_status' => 'inactive',
            'tracking_disabled_at' => '2026-05-30 00:00:00',
            'tracking_reason' => 'no longer used for observation',
        ]);
        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'collected_at' => '2026-04-25 00:00:00',
        ]);

        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, new FakeDanceShortYouTubeVideoApiRepository);

        $result = app(SyncDanceShortVideosAction::class)->execute();

        $this->assertSame(0, $result->insertedVideoCount);
        $this->assertSame(1, $result->updatedVideoCount);
        $this->assertSame(0, $result->savedSnapshotCount);
        $this->assertSame(1, $result->skippedSnapshotByTrackingCount);
        $this->assertSame(1, $result->excludedByShortsCount);
        $this->assertSame(1, $result->cleanedUpSnapshotCount);
        $this->assertSame(0, $result->failedCount);

        $this->assertDatabaseHas('dance_short_videos', [
            'id' => $video->getKey(),
            'youtube_video_id' => 'short-video-001',
            'tracking_status' => 'inactive',
        ]);
        $this->assertDatabaseHas('dance_short_video_regions', [
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-05-31 12:00:00',
            'last_detected_at' => '2026-05-31 12:00:00',
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
        ]);
    }

    public function test_execute_updates_snapshot_in_same_jst_12_hour_period_instead_of_creating_another_row(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 02:00:00', 'Asia/Tokyo'));
        config([
            'services.youtube.discover_max_results' => 50,
            'services.youtube.discover_published_after_days' => 7,
        ]);

        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'dance shorts',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'short-video-001',
            'title' => 'Saved dance short',
            'tracking_status' => 'active',
        ]);
        $existingSnapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'like_count' => 10,
            'comment_count' => 1,
            'collected_at' => '2026-06-01 01:00:00',
        ]);
        $existingRelation = DanceShortVideoRegion::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-06-01 01:00:00',
            'last_detected_at' => '2026-06-01 01:00:00',
        ]);

        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, new FakeDanceShortYouTubeVideoApiRepository);

        $result = app(SyncDanceShortVideosAction::class)->execute();

        $this->assertSame(1, $result->savedSnapshotCount);
        $this->assertSame(1, DanceShortVideoRegion::query()
            ->where('video_id', $video->getKey())
            ->where('region_id', $region->getKey())
            ->count());
        $this->assertDatabaseHas('dance_short_video_regions', [
            'id' => $existingRelation->getKey(),
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-06-01 01:00:00',
            'last_detected_at' => '2026-06-01 02:00:00',
        ]);
        $this->assertSame(1, DanceShortVideoSnapshot::query()
            ->where('video_id', $video->getKey())
            ->where('region_id', $region->getKey())
            ->count());
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $existingSnapshot->getKey(),
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 123456,
            'like_count' => 789,
            'comment_count' => 12,
            'collected_at' => '2026-06-01 02:00:00',
        ]);
    }

    public function test_execute_counts_search_api_failure_as_sync_failure_without_saving_data(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'));

        $region = DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
            'sort_order' => 10,
            'is_active' => true,
        ]);
        DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'dance shorts',
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $this->app->instance(
            YouTubeVideoApiRepositoryInterface::class,
            new FailingSearchDanceShortYouTubeVideoApiRepository,
        );

        $result = app(SyncDanceShortVideosAction::class)->execute();

        $this->assertSame(1, $result->searchedRegionCount);
        $this->assertSame(1, $result->searchedKeywordCount);
        $this->assertSame(0, $result->fetchedVideoCount);
        $this->assertSame(0, $result->fetchedVideoDetailCount);
        $this->assertSame(0, $result->savedVideoCount);
        $this->assertSame(0, $result->savedSnapshotCount);
        $this->assertSame(1, $result->failedCount);
        $this->assertDatabaseCount('dance_short_videos', 0);
        $this->assertDatabaseCount('dance_short_video_snapshots', 0);
    }
}

class FakeDanceShortYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    /**
     * @var array<int, DanceShortSearchConditionDTO>
     */
    public array $searchConditions = [];

    /**
     * @var array<int, array<int, string>>
     */
    public array $fetchVideoIdsCalls = [];

    /**
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        $this->searchConditions[] = $condition;

        return match ($condition->keyword) {
            'dance shorts' => [
                $this->searchItem('short-video-001'),
                $this->searchItem('long-video-001'),
            ],
            'dance challenge' => [
                $this->searchItem('short-video-001'),
            ],
            default => [],
        };
    }

    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        throw new RuntimeException('Regular sync should not call page-aware search.');
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        $this->fetchVideoIdsCalls[] = array_values($youtubeVideoIds);

        $details = [];

        foreach ($youtubeVideoIds as $youtubeVideoId) {
            if ($youtubeVideoId === 'short-video-001') {
                $details[] = $this->detail(
                    youtubeVideoId: 'short-video-001',
                    title: 'Saved dance short',
                    duration: 'PT58S',
                    viewCount: 123456,
                );
            }

            if ($youtubeVideoId === 'long-video-001') {
                $details[] = $this->detail(
                    youtubeVideoId: 'long-video-001',
                    title: 'Long dance video',
                    duration: 'PT3M1S',
                    viewCount: 999999,
                );
            }
        }

        return $details;
    }

    private function searchItem(string $youtubeVideoId): YouTubeVideoSearchItemDTO
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

    private function detail(
        string $youtubeVideoId,
        string $title,
        string $duration,
        int $viewCount,
    ): YouTubeVideoDetailDTO {
        return new YouTubeVideoDetailDTO(
            youtubeVideoId: $youtubeVideoId,
            title: $title,
            description: 'Dance description.',
            channelId: 'channel-001',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/high.jpg',
            publishedAt: '2026-05-31T12:00:00+09:00',
            categoryId: '10',
            tags: ['dance', 'shorts'],
            duration: $duration,
            defaultLanguage: 'ja',
            defaultAudioLanguage: 'ja',
            liveBroadcastContent: 'none',
            embeddable: true,
            viewCount: $viewCount,
            likeCount: 789,
            commentCount: 12,
        );
    }
}

class FailingSearchDanceShortYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        throw new RuntimeException('YouTube search failed.');
    }

    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        throw new RuntimeException('Regular sync should not call page-aware search.');
    }

    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        throw new RuntimeException('YouTube details should not be fetched after search failure.');
    }
}
