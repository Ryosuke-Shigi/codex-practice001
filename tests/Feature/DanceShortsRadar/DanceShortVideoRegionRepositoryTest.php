<?php

namespace Tests\Feature\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoRegionSaveDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoRegion;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortVideoRegionRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DanceShortVideoRegionRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_upsert_creates_relation_and_updates_last_detected_without_duplicate_rows(): void
    {
        $repository = $this->repository();
        $region = $this->region('JP');
        $video = $this->video('video-001', 'active', '2026-06-01 12:00:00');

        $created = $repository->upsert(new DanceShortVideoRegionSaveDTO(
            video_id: (int) $video->getKey(),
            region_id: (int) $region->getKey(),
            detected_at: CarbonImmutable::parse('2026-06-01 00:00:00', 'Asia/Tokyo'),
        ));

        $updated = $repository->upsert(new DanceShortVideoRegionSaveDTO(
            video_id: (int) $video->getKey(),
            region_id: (int) $region->getKey(),
            detected_at: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
        ));

        $this->assertTrue($created->is($updated));
        $this->assertDatabaseCount('dance_short_video_regions', 1);
        $this->assertDatabaseHas('dance_short_video_regions', [
            'id' => $created->getKey(),
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-06-01 00:00:00',
            'last_detected_at' => '2026-06-01 12:00:00',
        ]);
    }

    public function test_video_region_relation_is_unique_by_video_and_region(): void
    {
        $region = $this->region('JP');
        $video = $this->video('video-unique', 'active', '2026-06-01 12:00:00');

        DanceShortVideoRegion::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-06-01 00:00:00',
            'last_detected_at' => '2026-06-01 00:00:00',
        ]);

        $this->expectException(QueryException::class);

        DanceShortVideoRegion::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'first_detected_at' => '2026-06-01 12:00:00',
            'last_detected_at' => '2026-06-01 12:00:00',
        ]);
    }

    public function test_snapshot_refresh_targets_use_video_regions_without_requiring_snapshots(): void
    {
        $jp = $this->region('JP');
        $us = $this->region('US');
        $kr = $this->region('KR');
        $jpOnly = $this->video('active-jp-only', 'active', '2026-06-01 13:00:00');
        $jpUs = $this->video('active-jp-us', 'active', '2026-06-01 12:00:00');
        $inactive = $this->video('inactive-jp', 'inactive', '2026-06-01 11:00:00');
        $archived = $this->video('archived-us', 'archived', '2026-06-01 10:00:00');

        $this->videoRegion($jpOnly, $jp, '2026-06-01 00:00:00');
        $this->videoRegion($jpUs, $jp, '2026-06-01 00:10:00');
        $this->videoRegion($jpUs, $us, '2026-06-01 00:20:00');
        $this->videoRegion($inactive, $jp, '2026-06-01 00:30:00');
        $this->videoRegion($archived, $us, '2026-06-01 00:40:00');

        $this->snapshot($jpOnly, $kr, '2026-05-31 00:00:00');

        $targets = $this->repository()->snapshotRefreshTargetsByTrackingStatus(
            trackingStatus: 'active',
            maxVideosPerRun: 10,
        );

        $this->assertCount(2, $targets);
        $this->assertSame('active-jp-only', $targets[0]->youtube_video_id);
        $this->assertSame([(int) $jp->getKey()], $targets[0]->region_ids);
        $this->assertSame('active-jp-us', $targets[1]->youtube_video_id);
        $this->assertSame([(int) $jp->getKey(), (int) $us->getKey()], $targets[1]->region_ids);
    }

    public function test_snapshot_refresh_targets_return_empty_when_video_regions_are_empty(): void
    {
        $this->video('active-without-relation', 'active', '2026-06-01 12:00:00');

        $targets = $this->repository()->snapshotRefreshTargetsByTrackingStatus(
            trackingStatus: 'active',
            maxVideosPerRun: 10,
        );

        $this->assertSame([], $targets);
    }

    private function repository(): DanceShortVideoRegionRepositoryInterface
    {
        return app(DanceShortVideoRegionRepositoryInterface::class);
    }

    private function region(string $code): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => $code,
            'name' => $code,
        ]);
    }

    private function video(
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

    private function snapshot(
        DanceShortVideo $video,
        DanceShortRegion $region,
        string $collectedAt,
    ): DanceShortVideoSnapshot {
        return DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'collected_at' => $collectedAt,
        ]);
    }
}
