<?php

namespace Tests\Feature\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoCategory;
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
            collected_at: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
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

    public function test_update_latest_in_period_or_create_updates_only_latest_snapshot_in_period(): void
    {
        $region = $this->region();
        $video = $this->video();
        $olderInPeriod = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'like_count' => 10,
            'comment_count' => 1,
            'collected_at' => '2026-06-01 00:30:00',
        ]);
        $latestInPeriod = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 200,
            'like_count' => 20,
            'comment_count' => 2,
            'collected_at' => '2026-06-01 01:00:00',
        ]);
        $outsidePeriod = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 300,
            'collected_at' => '2026-06-01 12:00:00',
        ]);

        $saved = $this->repository()->updateLatestInPeriodOrCreate(
            new DanceShortVideoSnapshotCreateDTO(
                video_id: (int) $video->getKey(),
                region_id: (int) $region->getKey(),
                view_count: 456,
                like_count: 45,
                comment_count: 6,
                collected_at: CarbonImmutable::parse('2026-06-01 02:30:00', 'Asia/Tokyo'),
            ),
            CarbonImmutable::parse('2026-06-01 00:00:00', 'Asia/Tokyo'),
            CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
        );

        $this->assertTrue($latestInPeriod->is($saved));
        $this->assertDatabaseCount('dance_short_video_snapshots', 3);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $latestInPeriod->getKey(),
            'view_count' => 456,
            'like_count' => 45,
            'comment_count' => 6,
            'collected_at' => '2026-06-01 02:30:00',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $olderInPeriod->getKey(),
            'view_count' => 100,
            'collected_at' => '2026-06-01 00:30:00',
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $outsidePeriod->getKey(),
            'view_count' => 300,
            'collected_at' => '2026-06-01 12:00:00',
        ]);
    }

    public function test_update_latest_in_period_or_create_creates_when_period_has_no_snapshot(): void
    {
        $region = $this->region();
        $video = $this->video();
        DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'collected_at' => '2026-05-31 23:59:59',
        ]);

        $saved = $this->repository()->updateLatestInPeriodOrCreate(
            new DanceShortVideoSnapshotCreateDTO(
                video_id: (int) $video->getKey(),
                region_id: (int) $region->getKey(),
                view_count: 789,
                like_count: 70,
                comment_count: 8,
                collected_at: CarbonImmutable::parse('2026-06-01 02:30:00', 'Asia/Tokyo'),
            ),
            CarbonImmutable::parse('2026-06-01 00:00:00', 'Asia/Tokyo'),
            CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
        );

        $this->assertDatabaseCount('dance_short_video_snapshots', 2);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $saved->getKey(),
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 789,
            'like_count' => 70,
            'comment_count' => 8,
            'collected_at' => '2026-06-01 02:30:00',
        ]);
    }

    public function test_delete_collected_before_physically_deletes_only_old_snapshots(): void
    {
        $region = $this->region();
        DanceShortSearchKeyword::query()->create([
            'region_id' => $region->getKey(),
            'keyword' => 'dance shorts',
        ]);
        DanceShortVideoCategory::query()->create([
            'youtube_category_id' => '10',
            'region_code' => $region->code,
            'title' => 'Music',
        ]);
        $video = $this->video();

        $oldSnapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 100,
            'collected_at' => '2026-04-26 23:59:59',
        ]);
        $cutoffSnapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 200,
            'collected_at' => '2026-04-27 00:00:00',
        ]);
        $recentSnapshot = DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => 300,
            'collected_at' => '2026-05-01 00:00:00',
        ]);

        $deletedCount = $this->repository()->deleteCollectedBefore(
            CarbonImmutable::parse('2026-04-27 00:00:00', 'Asia/Tokyo'),
        );

        $this->assertSame(1, $deletedCount);
        $this->assertDatabaseMissing('dance_short_video_snapshots', [
            'id' => $oldSnapshot->getKey(),
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $cutoffSnapshot->getKey(),
        ]);
        $this->assertDatabaseHas('dance_short_video_snapshots', [
            'id' => $recentSnapshot->getKey(),
        ]);
        $this->assertDatabaseHas('dance_short_videos', [
            'id' => $video->getKey(),
        ]);
        $this->assertDatabaseHas('dance_short_regions', [
            'id' => $region->getKey(),
        ]);
        $this->assertDatabaseHas('dance_short_search_keywords', [
            'region_id' => $region->getKey(),
            'keyword' => 'dance shorts',
        ]);
        $this->assertDatabaseHas('dance_short_video_categories', [
            'youtube_category_id' => '10',
            'region_code' => $region->code,
        ]);
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
