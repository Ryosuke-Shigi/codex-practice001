<?php

namespace Tests\Feature\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DanceShortVideoSnapshotRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_persists_snapshot_without_derived_growth_columns(): void
    {
        $region = $this->region();
        $video = $this->video();

        $snapshot = $this->repository()->create(new DanceShortVideoSnapshotCreateDTO(
            video_id: (int) $video->getKey(),
            region_id: (int) $region->getKey(),
            view_count: 123456,
            like_count: 789,
            comment_count: 12,
            collected_at: CarbonImmutable::parse('2026-05-31 12:00:00', 'UTC'),
        ));

        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $snapshot->getKey(),
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 123456,
            'like_count' => 789,
            'comment_count' => 12,
            'collected_at' => '2026-05-31 12:00:00',
        ]);
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'view_count_delta'));
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'view_growth_rate'));
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'views_per_hour'));
    }

    public function test_latest_for_video_and_region_returns_latest_snapshot_only_for_target_region(): void
    {
        $region = $this->region();
        $otherRegion = DanceShortRegion::query()->create([
            'code' => 'US',
            'name' => 'アメリカ',
        ]);
        $video = $this->video();

        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'collected_at' => '2026-05-31 00:00:00',
        ]);
        $latest = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 250,
            'collected_at' => '2026-05-31 06:00:00',
        ]);
        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $otherRegion->getKey(),
            'view_count' => 999,
            'collected_at' => '2026-05-31 08:00:00',
        ]);

        $found = $this->repository()->latestForVideoAndRegion((int) $video->getKey(), (int) $region->getKey());

        $this->assertNotNull($found);
        $this->assertTrue($latest->is($found));
    }

    private function repository(): DanceShortVideoSnapshotRepositoryInterface
    {
        return app(DanceShortVideoSnapshotRepositoryInterface::class);
    }

    private function region(): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => 'JP',
            'name' => '日本',
        ]);
    }

    private function video(): DanceShortVideo
    {
        return DanceShortVideo::query()->create([
            'youtube_video_id' => 'video-001',
            'title' => 'Dance short',
        ]);
    }
}
