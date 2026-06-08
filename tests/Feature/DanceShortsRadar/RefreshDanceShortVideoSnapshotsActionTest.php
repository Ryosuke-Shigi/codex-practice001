<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\RefreshDanceShortVideoSnapshotsAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchItemDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoSearchResultDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_execute_uses_only_active_saved_videos_and_fetches_details_in_50_id_chunks_without_search(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 01:45:00', 'UTC'));
        config(['dance_short.snapshot_refresh.max_videos_per_run' => 8000]);

        $region = $this->region();
        $activeYoutubeVideoIds = [];

        foreach (range(1, 51) as $index) {
            $youtubeVideoId = sprintf('active-video-%03d', $index);
            $activeYoutubeVideoIds[] = $youtubeVideoId;
            $this->snapshot(
                $this->video($youtubeVideoId, 'active'),
                $region,
                '2026-05-31 00:00:00',
            );
        }

        $inactive = $this->video('inactive-video', 'inactive');
        $archived = $this->video('archived-video', 'archived');
        $this->snapshot($inactive, $region, '2026-05-31 00:00:00');
        $this->snapshot($archived, $region, '2026-05-31 00:00:00');

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository();
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

        $result = app(RefreshDanceShortVideoSnapshotsAction::class)->execute();

        $this->assertSame(51, $result->fetchedVideoCount);
        $this->assertSame(51, $result->fetchedVideoDetailCount);
        $this->assertSame(51, $result->savedSnapshotCount);
        $this->assertSame(0, $result->failedCount);
        $this->assertSame([
            array_slice($activeYoutubeVideoIds, 0, 50),
            array_slice($activeYoutubeVideoIds, 50, 1),
        ], $youtubeRepository->fetchVideoIdsCalls);
        $this->assertSame(0, $youtubeRepository->searchVideosCallCount);
        $this->assertSame(0, $youtubeRepository->searchVideoPageCallCount);
        $this->assertSame(1, DanceShortVideoSnapshot::query()
            ->where('video_id', $inactive->getKey())
            ->count());
        $this->assertSame(1, DanceShortVideoSnapshot::query()
            ->where('video_id', $archived->getKey())
            ->count());
    }

    public function test_execute_updates_existing_snapshot_in_same_jst_12_hour_period_and_creates_when_missing(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 02:30:00', 'UTC'));

        $region = $this->region();
        $updateTarget = $this->video('same-period-video', 'active');
        $createTarget = $this->video('new-period-video', 'active');

        $existingInPeriod = $this->snapshot($updateTarget, $region, '2026-05-31 16:00:00', 100);
        $outsidePeriod = $this->snapshot($createTarget, $region, '2026-05-31 14:59:59', 200);

        $this->app->instance(
            YouTubeVideoApiRepositoryInterface::class,
            new SnapshotRefreshFakeYouTubeVideoApiRepository(),
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
            'collected_at' => '2026-06-01 02:30:00',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $outsidePeriod->getKey(),
            'video_id' => $createTarget->getKey(),
            'view_count' => 200,
            'collected_at' => '2026-05-31 14:59:59',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'video_id' => $createTarget->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 1234,
            'like_count' => 123,
            'comment_count' => 12,
            'collected_at' => '2026-06-01 02:30:00',
        ]);
    }

    public function test_execute_creates_snapshots_for_active_videos_after_all_snapshots_are_deleted(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 02:30:00', 'UTC'));

        $region = $this->region();
        $active = $this->video('active-without-snapshot', 'active');
        $inactive = $this->video('inactive-without-snapshot', 'inactive');
        $archived = $this->video('archived-without-snapshot', 'archived');

        $this->assertDatabaseCount('dance_short_video_snapshots', 0);

        $youtubeRepository = new SnapshotRefreshFakeYouTubeVideoApiRepository();
        $this->app->instance(YouTubeVideoApiRepositoryInterface::class, $youtubeRepository);

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
            'collected_at' => '2026-06-01 02:30:00',
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $inactive->getKey(),
        ]);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'video_id' => $archived->getKey(),
        ]);
    }

    private function region(): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
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
}

class SnapshotRefreshFakeYouTubeVideoApiRepository implements YouTubeVideoApiRepositoryInterface
{
    public int $searchVideosCallCount = 0;

    public int $searchVideoPageCallCount = 0;

    /**
     * @var array<int, array<int, string>>
     */
    public array $fetchVideoIdsCalls = [];

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
        $this->fetchVideoIdsCalls[] = array_values($youtubeVideoIds);

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
