<?php

namespace Tests\Feature\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSaveDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepositoryInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DanceShortVideoRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_upsert_inserts_updates_and_skips_by_youtube_video_id_without_duplicate_rows(): void
    {
        $repository = $this->repository();

        $inserted = $repository->upsert($this->dto(
            youtubeVideoId: 'video-001',
            title: 'First title',
        ));

        $this->assertSame(DanceShortVideoRepositoryInterface::UPSERT_INSERTED, $inserted['status']);
        $this->assertDatabaseHas('dance_short_videos', [
            'youtube_video_id' => 'video-001',
            'title' => 'First title',
            'duration' => 'PT58S',
        ]);

        $skipped = $repository->upsert($this->dto(
            youtubeVideoId: 'video-001',
            title: 'First title',
        ));

        $this->assertSame(DanceShortVideoRepositoryInterface::UPSERT_SKIPPED, $skipped['status']);

        $updated = $repository->upsert($this->dto(
            youtubeVideoId: 'video-001',
            title: 'Updated title',
        ));

        $this->assertSame(DanceShortVideoRepositoryInterface::UPSERT_UPDATED, $updated['status']);
        $this->assertDatabaseHas('dance_short_videos', [
            'youtube_video_id' => 'video-001',
            'title' => 'Updated title',
        ]);
        $this->assertDatabaseCount('dance_short_videos', 1);
    }

    public function test_find_by_youtube_video_id_returns_the_matching_video(): void
    {
        $video = DanceShortVideo::query()->create([
            'youtube_video_id' => 'video-find',
            'title' => 'Find target',
        ]);

        $found = $this->repository()->findByYoutubeVideoId('video-find');

        $this->assertNotNull($found);
        $this->assertTrue($video->is($found));
        $this->assertNull($this->repository()->findByYoutubeVideoId('missing-video'));
    }

    public function test_find_by_youtube_video_id_and_tracking_status_returns_only_matching_status(): void
    {
        $activeVideo = DanceShortVideo::query()->create([
            'youtube_video_id' => 'active-video',
            'title' => 'Active target',
            'tracking_status' => 'active',
        ]);
        DanceShortVideo::query()->create([
            'youtube_video_id' => 'inactive-video',
            'title' => 'Inactive target',
            'tracking_status' => 'inactive',
        ]);

        $found = $this->repository()->findByYoutubeVideoIdAndTrackingStatus('active-video', 'active');

        $this->assertNotNull($found);
        $this->assertTrue($activeVideo->is($found));
        $this->assertNull($this->repository()->findByYoutubeVideoIdAndTrackingStatus('inactive-video', 'active'));
    }

    public function test_snapshot_refresh_targets_by_tracking_status_returns_existing_snapshot_regions_in_stable_limit_order(): void
    {
        $jp = DanceShortRegion::query()->create(['code' => 'JP', 'name' => '日本']);
        $us = DanceShortRegion::query()->create(['code' => 'US', 'name' => 'アメリカ']);
        $oldest = $this->createVideo('active-oldest', 'active', '2026-06-01 08:00:00');
        $newerPublishedTie = $this->createVideo('active-newer-published', 'active', '2026-06-01 10:00:00');
        $olderPublishedTie = $this->createVideo('active-older-published', 'active', '2026-06-01 09:00:00');
        $inactive = $this->createVideo('inactive-oldest', 'inactive', '2026-06-01 12:00:00');
        $this->createVideo('active-no-snapshot', 'active', '2026-06-01 13:00:00');

        $this->snapshot($oldest, $jp, '2026-05-31 00:00:00');
        $this->snapshot($oldest, $us, '2026-05-30 00:00:00');
        $this->snapshot($newerPublishedTie, $jp, '2026-06-01 00:00:00');
        $this->snapshot($olderPublishedTie, $jp, '2026-06-01 00:00:00');
        $this->snapshot($inactive, $jp, '2026-05-01 00:00:00');

        $targets = $this->repository()->snapshotRefreshTargetsByTrackingStatus('active', 2);

        $this->assertCount(2, $targets);
        $this->assertSame('active-oldest', $targets[0]->youtube_video_id);
        $this->assertSame([(int) $jp->getKey(), (int) $us->getKey()], $targets[0]->region_ids);
        $this->assertSame('active-newer-published', $targets[1]->youtube_video_id);
    }

    private function repository(): DanceShortVideoRepositoryInterface
    {
        return app(DanceShortVideoRepositoryInterface::class);
    }

    private function createVideo(
        string $youtubeVideoId,
        string $trackingStatus,
        string $publishedAt,
    ): DanceShortVideo {
        return DanceShortVideo::query()->create([
            'youtube_video_id' => $youtubeVideoId,
            'title' => 'Dance short '.$youtubeVideoId,
            'published_at' => $publishedAt,
            'tracking_status' => $trackingStatus,
        ]);
    }

    private function snapshot(DanceShortVideo $video, DanceShortRegion $region, string $collectedAt): DanceShortVideoSnapshot
    {
        return DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'collected_at' => $collectedAt,
        ]);
    }

    private function dto(string $youtubeVideoId, string $title): DanceShortVideoSaveDTO
    {
        return new DanceShortVideoSaveDTO(
            youtube_video_id: $youtubeVideoId,
            title: $title,
            description: 'Dance description.',
            channel_id: 'channel-001',
            channel_title: 'Dance Channel',
            thumbnail_url: 'https://example.test/high.jpg',
            published_at: '2026-05-31 12:00:00',
            url: 'https://www.youtube.com/shorts/'.$youtubeVideoId,
            category_id: '10',
            tags: ['dance', 'shorts'],
            duration: 'PT58S',
            default_language: 'ja',
            default_audio_language: 'ja',
            live_broadcast_content: 'none',
            embeddable: true,
        );
    }
}
