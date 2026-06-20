<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\RefreshDanceShortVideoSnapshotsAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailFetchResultDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Events\DanceShortsRadar\DanceShortRankingReadModelRefreshRequested;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoRegion;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoDetailFetchResultRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

class RefreshDanceShortVideoSnapshotsActionTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_execute_uses_only_active_saved_videos_and_fetches_details_once_without_search(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 10:45:00', 'Asia/Tokyo'));
        config(['dance_short.snapshot_refresh.max_videos_per_run' => 8000]);

        $region = $this->region();
        $activeYoutubeVideoIds = [];

        foreach (range(1, 51) as $index) {
            $youtubeVideoId = sprintf('active-video-%03d', $index);
            $activeYoutubeVideoIds[] = $youtubeVideoId;
            $this->snapshot(
                $video = $this->video($youtubeVideoId, 'active'),
                $region,
                '2026-05-31 00:00:00',
            );
            $this->videoRegion($video, $region, '2026-05-31 00:00:00');
        }

        $inactive = $this->video('inactive-video', 'inactive');
        $archived = $this->video('archived-video', 'archived');
        $this->snapshot($inactive, $region, '2026-05-31 00:00:00');
        $this->snapshot($archived, $region, '2026-05-31 00:00:00');
        $this->videoRegion($inactive, $region, '2026-05-31 00:00:00');
        $this->videoRegion($archived, $region, '2026-05-31 00:00:00');

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoDetailFetchResultRepositoryInterface::class, $youtubeRepository);
        Event::fake([DanceShortRankingReadModelRefreshRequested::class]);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(51, $result->fetchedVideoCount);
        $this->assertSame(51, $result->fetchedVideoDetailCount);
        $this->assertSame(51, $result->savedSnapshotCount);
        $this->assertSame(0, $result->failedCount);
        $this->assertSame([
            $activeYoutubeVideoIds,
        ], $youtubeRepository->fetchVideoIdsCalls);
        $this->assertSame(0, $youtubeRepository->searchVideosCallCount);
        $this->assertSame(0, $youtubeRepository->searchVideoPageCallCount);
        $this->assertSame(1, DanceShortVideoSnapshot::query()
            ->where('video_id', $inactive->getKey())
            ->count());
        $this->assertSame(1, DanceShortVideoSnapshot::query()
            ->where('video_id', $archived->getKey())
            ->count());
        Event::assertDispatched(
            DanceShortRankingReadModelRefreshRequested::class,
            fn (DanceShortRankingReadModelRefreshRequested $event): bool => $event->source === 'snapshots_saved',
        );
    }

    public function test_execute_updates_existing_snapshot_in_same_jst_12_hour_period_and_creates_when_missing(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 11:30:00', 'Asia/Tokyo'));

        $region = $this->region();
        $updateTarget = $this->video('same-period-video', 'active');
        $createTarget = $this->video('new-period-video', 'active');
        $this->videoRegion($updateTarget, $region, '2026-06-01 01:00:00');
        $this->videoRegion($createTarget, $region, '2026-05-31 23:59:59');

        $existingInPeriod = $this->snapshot($updateTarget, $region, '2026-06-01 01:00:00', 100);
        $outsidePeriod = $this->snapshot($createTarget, $region, '2026-05-31 23:59:59', 200);

        $this->app->instance(
            YouTubeVideoDetailFetchResultRepositoryInterface::class,
            new SnapshotRefreshFakeYouTubeVideoApiRepository,
        );

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(2, $result->fetchedVideoCount);
        $this->assertSame(2, $result->savedSnapshotCount);
        $this->assertDatabaseCount('dance_short_video_snapshots', 3);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $existingInPeriod->getKey(),
            'video_id' => $updateTarget->getKey(),
            'view_count' => 1234,
            'like_count' => 123,
            'comment_count' => 12,
            'collected_at' => '2026-06-01 11:30:00',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $outsidePeriod->getKey(),
            'video_id' => $createTarget->getKey(),
            'view_count' => 200,
            'collected_at' => '2026-05-31 23:59:59',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $createTarget->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 1234,
            'like_count' => 123,
            'comment_count' => 12,
            'collected_at' => '2026-06-01 11:30:00',
        ]);
    }

    public function test_execute_creates_snapshots_for_active_videos_after_all_snapshots_are_deleted(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 11:30:00', 'Asia/Tokyo'));

        $region = $this->region();
        $active = $this->video('active-without-snapshot', 'active');
        $inactive = $this->video('inactive-without-snapshot', 'inactive');
        $archived = $this->video('archived-without-snapshot', 'archived');
        $this->videoRegion($active, $region, '2026-06-01 00:00:00');
        $this->videoRegion($inactive, $region, '2026-06-01 00:00:00');
        $this->videoRegion($archived, $region, '2026-06-01 00:00:00');

        $this->assertDatabaseCount('dance_short_video_snapshots', 0);

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoDetailFetchResultRepositoryInterface::class, $youtubeRepository);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(1, $result->fetchedVideoCount);
        $this->assertSame(1, $result->fetchedVideoDetailCount);
        $this->assertSame(1, $result->savedSnapshotCount);
        $this->assertSame([['active-without-snapshot']], $youtubeRepository->fetchVideoIdsCalls);
        $this->assertSame(0, $youtubeRepository->searchVideosCallCount);
        $this->assertSame(0, $youtubeRepository->searchVideoPageCallCount);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $active->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 1234,
            'like_count' => 123,
            'comment_count' => 12,
            'collected_at' => '2026-06-01 11:30:00',
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $inactive->getKey(),
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $archived->getKey(),
        ]);
    }

    public function test_execute_creates_snapshots_only_for_regions_stored_in_video_regions(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 11:30:00', 'Asia/Tokyo'));

        $jp = $this->region('JP', '日本');
        $us = $this->region('US', 'アメリカ');
        $kr = $this->region('KR', '韓国');
        $jpOnly = $this->video('jp-only-video', 'active');
        $jpUs = $this->video('jp-us-video', 'active');

        $this->videoRegion($jpOnly, $jp, '2026-06-01 00:00:00');
        $this->videoRegion($jpUs, $jp, '2026-06-01 00:00:00');
        $this->videoRegion($jpUs, $us, '2026-06-01 00:00:00');

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoDetailFetchResultRepositoryInterface::class, $youtubeRepository);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(2, $result->fetchedVideoCount);
        $this->assertSame(2, $result->fetchedVideoDetailCount);
        $this->assertSame(3, $result->savedSnapshotCount);
        $this->assertSame([['jp-only-video', 'jp-us-video']], $youtubeRepository->fetchVideoIdsCalls);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $jpOnly->getKey(),
            'region_id' => $jp->getKey(),
            'view_count' => 1234,
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $jpOnly->getKey(),
            'region_id' => $us->getKey(),
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $jpOnly->getKey(),
            'region_id' => $kr->getKey(),
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $jpUs->getKey(),
            'region_id' => $jp->getKey(),
            'view_count' => 1234,
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $jpUs->getKey(),
            'region_id' => $us->getKey(),
            'view_count' => 1234,
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $jpUs->getKey(),
            'region_id' => $kr->getKey(),
        ]);
    }

    public function test_execute_counts_failed_video_detail_chunk_targets_without_treating_missing_details_as_failures(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 11:30:00', 'Asia/Tokyo'));

        $region = $this->region();
        $saved = $this->video('saved-video', 'active');
        $notReturnedBySuccessfulChunk = $this->video('not-returned-video', 'active');
        $failedChunkTarget = $this->video('failed-chunk-video', 'active');
        $this->videoRegion($saved, $region, '2026-06-01 00:00:00');
        $this->videoRegion($notReturnedBySuccessfulChunk, $region, '2026-06-01 00:00:00');
        $this->videoRegion($failedChunkTarget, $region, '2026-06-01 00:00:00');

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository;
        $youtubeRepository->returnedVideoIds = ['saved-video'];
        $youtubeRepository->failedChunkCount = 1;
        $youtubeRepository->failedTargetVideoIdCount = 1;
        $this->app->instance(YouTubeVideoDetailFetchResultRepositoryInterface::class, $youtubeRepository);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(3, $result->fetchedVideoCount);
        $this->assertSame(1, $result->fetchedVideoDetailCount);
        $this->assertSame(1, $result->savedSnapshotCount);
        $this->assertSame(1, $result->failedCount);
        $this->assertSame([[
            'saved-video',
            'not-returned-video',
            'failed-chunk-video',
        ]], $youtubeRepository->fetchVideoIdsCalls);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $saved->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 1234,
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $notReturnedBySuccessfulChunk->getKey(),
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $failedChunkTarget->getKey(),
        ]);
    }

    public function test_execute_returns_zero_when_video_regions_are_empty(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 11:30:00', 'Asia/Tokyo'));

        $this->region();
        $this->video('active-without-relation', 'active');

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository;
        $this->app->instance(YouTubeVideoDetailFetchResultRepositoryInterface::class, $youtubeRepository);
        Event::fake([DanceShortRankingReadModelRefreshRequested::class]);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(0, $result->fetchedVideoCount);
        $this->assertSame(0, $result->fetchedVideoDetailCount);
        $this->assertSame(0, $result->savedSnapshotCount);
        $this->assertSame([], $youtubeRepository->fetchVideoIdsCalls);
        $this->assertSame(0, $youtubeRepository->searchVideosCallCount);
        $this->assertSame(0, $youtubeRepository->searchVideoPageCallCount);
        $this->assertDatabaseCount('dance_short_video_snapshots', 0);
        Event::assertNotDispatched(DanceShortRankingReadModelRefreshRequested::class);
    }

    public function test_execute_does_not_request_read_model_refresh_when_all_detail_fetches_fail(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 11:30:00', 'Asia/Tokyo'));

        $region = $this->region();
        $target = $this->video('detail-fetch-failure-video', 'active');
        $this->videoRegion($target, $region, '2026-06-01 00:00:00');

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository;
        $youtubeRepository->throwsOnFetchVideoDetailsResult = true;
        $this->app->instance(YouTubeVideoDetailFetchResultRepositoryInterface::class, $youtubeRepository);
        Event::fake([DanceShortRankingReadModelRefreshRequested::class]);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(1, $result->fetchedVideoCount);
        $this->assertSame(0, $result->fetchedVideoDetailCount);
        $this->assertSame(0, $result->savedSnapshotCount);
        $this->assertSame(1, $result->failedCount);
        Event::assertNotDispatched(DanceShortRankingReadModelRefreshRequested::class);
    }

    public function test_execute_does_not_request_read_model_refresh_when_no_snapshot_is_saved(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 11:30:00', 'Asia/Tokyo'));

        $region = $this->region();
        $target = $this->video('not-returned-video', 'active');
        $this->videoRegion($target, $region, '2026-06-01 00:00:00');

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository;
        $youtubeRepository->returnedVideoIds = [];
        $this->app->instance(YouTubeVideoDetailFetchResultRepositoryInterface::class, $youtubeRepository);
        Event::fake([DanceShortRankingReadModelRefreshRequested::class]);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(1, $result->fetchedVideoCount);
        $this->assertSame(0, $result->fetchedVideoDetailCount);
        $this->assertSame(0, $result->savedSnapshotCount);
        $this->assertSame(0, $result->failedCount);
        Event::assertNotDispatched(DanceShortRankingReadModelRefreshRequested::class);
    }

    private function region(string $code = 'JP', string $name = '日本'): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => $code,
            'name' => $name,
        ]);
    }

    private function video(string $youtubeVideoId, string $trackingStatus): DanceShortVideo
    {
        return DanceShortVideo::query()->create([
            'youtube_video_id' => $youtubeVideoId,
            'title' => 'Dance short '.$youtubeVideoId,
            'published_at' => '2026-05-31 12:00:00',
            'tracking_status' => $trackingStatus,
        ]);
    }

    private function snapshot(
        DanceShortVideo $video,
        DanceShortRegion $region,
        string $collectedAt,
        int $viewCount = 100,
    ): DanceShortVideoSnapshot {
        return DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => $viewCount,
            'like_count' => 10,
            'comment_count' => 1,
            'collected_at' => $collectedAt,
        ]);
    }

    private function videoRegion(
        DanceShortVideo $video,
        DanceShortRegion $region,
        string $detectedAt,
    ): DanceShortVideoRegion {
        return DanceShortVideoRegion::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => $detectedAt,
            'last_detected_at' => $detectedAt,
        ]);
    }
}

class SnapshotRefreshFakeYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface, YouTubeVideoDetailFetchResultRepositoryInterface
{
    public int $searchVideosCallCount = 0;

    public int $searchVideoPageCallCount = 0;

    /**
     * @var array<int, array<int, string>>
     */
    public array $fetchVideoIdsCalls = [];

    /**
     * @var array<int, string>|null
     */
    public ?array $returnedVideoIds = null;

    public int $failedChunkCount = 0;

    public int $failedTargetVideoIdCount = 0;

    public bool $throwsOnFetchVideoDetailsResult = false;

    /**
     * @return array<int, YouTubeVideoSearchItemDTO>
     */
    public function searchVideos(DanceShortSearchConditionDTO $condition): array
    {
        $this->searchVideosCallCount++;

        throw new RuntimeException('Snapshot refresh should not call search.list.');
    }

    public function searchVideoPage(
        DanceShortSearchConditionDTO $condition,
        ?string $pageToken = null,
    ): YouTubeVideoSearchResultDTO {
        $this->searchVideoPageCallCount++;

        throw new RuntimeException('Snapshot refresh should not call search.list.');
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    public function fetchVideoDetails(array $youtubeVideoIds): array
    {
        return $this->detailsFor($this->returnedVideoIds ?? array_values($youtubeVideoIds));
    }

    public function fetchVideoDetailsResult(array $youtubeVideoIds): YouTubeVideoDetailFetchResultDTO
    {
        $this->fetchVideoIdsCalls[] = array_values($youtubeVideoIds);

        if ($this->throwsOnFetchVideoDetailsResult) {
            throw new RuntimeException('YouTube details fetch failed.');
        }

        $details = $this->detailsFor($this->returnedVideoIds ?? array_values($youtubeVideoIds));

        return new YouTubeVideoDetailFetchResultDTO(
            details: $details,
            targetVideoIdCount: count($youtubeVideoIds),
            apiCallCount: $youtubeVideoIds === [] ? 0 : 1,
            successfulChunkCount: $youtubeVideoIds === [] ? 0 : 1,
            failedChunkCount: $this->failedChunkCount,
            failedTargetVideoIdCount: $this->failedTargetVideoIdCount,
        );
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     * @return array<int, YouTubeVideoDetailDTO>
     */
    private function detailsFor(array $youtubeVideoIds): array
    {
        return array_map(
            fn (string $youtubeVideoId): YouTubeVideoDetailDTO => $this->detail($youtubeVideoId),
            $youtubeVideoIds,
        );
    }

    private function detail(string $youtubeVideoId): YouTubeVideoDetailDTO
    {
        return new YouTubeVideoDetailDTO(
            youtubeVideoId: $youtubeVideoId,
            title: 'Saved '.$youtubeVideoId,
            description: 'Dance description.',
            channelId: 'channel-001',
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/high.jpg',
            publishedAt: '2026-05-31T12:00:00Z',
            categoryId: '10',
            tags: ['dance', 'shorts'],
            duration: 'PT58S',
            defaultLanguage: 'ja',
            defaultAudioLanguage: 'ja',
            liveBroadcastContent: 'none',
            embeddable: true,
            viewCount: 1234,
            likeCount: 123,
            commentCount: 12,
        );
    }
}
