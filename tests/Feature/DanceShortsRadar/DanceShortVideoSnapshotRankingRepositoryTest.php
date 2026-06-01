<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Models\DanceShortRegion;
use App\Models\DanceShortVideo;
use App\Models\DanceShortVideoSnapshot;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DanceShortVideoSnapshotRankingRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_latest_ranking_snapshots_by_region_code_returns_current_snapshots_for_active_videos_only(): void
    {
        $jp = $this->region('JP', '日本');
        $us = $this->region('US', 'アメリカ');
        $activeVideo = $this->video('active-video', 'Active video');
        $secondActiveVideo = $this->video('second-active-video', 'Second active video');
        $inactiveVideo = $this->video('inactive-video', 'Inactive video', 'inactive');
        $archivedVideo = $this->video('archived-video', 'Archived video', 'archived');

        $this->snapshot($activeVideo, $jp, 100, '2026-05-30 00:00:00');
        $activeCurrent = $this->snapshot($activeVideo, $jp, 250, '2026-05-31 00:00:00');
        $secondActiveCurrent = $this->snapshot($secondActiveVideo, $jp, 150, '2026-05-31 01:00:00');
        $inactiveCurrent = $this->snapshot($inactiveVideo, $jp, 999, '2026-05-31 02:00:00');
        $archivedCurrent = $this->snapshot($archivedVideo, $jp, 888, '2026-05-31 03:00:00');
        $otherRegionCurrent = $this->snapshot($activeVideo, $us, 777, '2026-05-31 04:00:00');

        $snapshots = $this->repository()->latestRankingSnapshotsByRegionCode('JP');
        $snapshotIds = $snapshots->pluck('id')->all();

        $this->assertContains($activeCurrent->getKey(), $snapshotIds);
        $this->assertContains($secondActiveCurrent->getKey(), $snapshotIds);
        $this->assertNotContains($inactiveCurrent->getKey(), $snapshotIds);
        $this->assertNotContains($archivedCurrent->getKey(), $snapshotIds);
        $this->assertNotContains($otherRegionCurrent->getKey(), $snapshotIds);
        $this->assertCount(2, $snapshots);
        $this->assertTrue($snapshots->firstWhere('id', $activeCurrent->getKey())?->relationLoaded('video'));
        $this->assertTrue($snapshots->firstWhere('id', $activeCurrent->getKey())?->relationLoaded('region'));
    }

    public function test_latest_ranking_snapshots_by_region_code_does_not_apply_display_limit_before_ranking(): void
    {
        $jp = $this->region('JP', '日本');

        /*
         * Repository は current 候補を集める境界です。
         * ランキング表示件数の limit を持たないため、取得順が collected_at / id 順でも、
         * active な current snapshot はここで落とさず全件返すことを固定します。
         */
        $first = $this->snapshot($this->video('first-video', 'First video'), $jp, 100, '2026-05-31 00:00:00');
        $second = $this->snapshot($this->video('second-video', 'Second video'), $jp, 200, '2026-05-31 01:00:00');
        $third = $this->snapshot($this->video('third-video', 'Third video'), $jp, 300, '2026-05-31 02:00:00');

        $snapshots = $this->repository()->latestRankingSnapshotsByRegionCode('JP');

        $this->assertSame([
            $third->getKey(),
            $second->getKey(),
            $first->getKey(),
        ], $snapshots->pluck('id')->all());
    }

    public function test_latest_snapshot_at_or_before_returns_latest_snapshot_not_newer_than_cutoff(): void
    {
        $jp = $this->region('JP', '日本');
        $video = $this->video('active-video', 'Active video');

        $older = $this->snapshot($video, $jp, 100, '2026-05-23 23:59:59');
        $cutoff = $this->snapshot($video, $jp, 200, '2026-05-24 00:00:00');
        $newer = $this->snapshot($video, $jp, 300, '2026-05-24 00:00:01');

        $found = $this->repository()->latestSnapshotAtOrBefore(
            (int) $video->getKey(),
            (int) $jp->getKey(),
            CarbonImmutable::parse('2026-05-24 00:00:00', 'UTC'),
        );

        $this->assertNotNull($found);
        $this->assertTrue($cutoff->is($found));
        $this->assertFalse($older->is($found));
        $this->assertFalse($newer->is($found));
    }

    public function test_latest_snapshot_at_or_before_returns_null_when_previous_snapshot_does_not_exist(): void
    {
        $jp = $this->region('JP', '日本');
        $video = $this->video('active-video', 'Active video');

        $this->snapshot($video, $jp, 300, '2026-05-24 00:00:01');

        $found = $this->repository()->latestSnapshotAtOrBefore(
            (int) $video->getKey(),
            (int) $jp->getKey(),
            CarbonImmutable::parse('2026-05-24 00:00:00', 'UTC'),
        );

        $this->assertNull($found);
    }

    public function test_latest_snapshot_before_returns_immediate_previous_snapshot_excluding_current_row(): void
    {
        $jp = $this->region('JP', '日本');
        $video = $this->video('active-video', 'Active video');

        $older = $this->snapshot($video, $jp, 100, '2026-06-01 04:08:24');
        $immediatePrevious = $this->snapshot($video, $jp, 200, '2026-06-01 04:09:16');
        $current = $this->snapshot($video, $jp, 300, '2026-06-01 04:09:17');

        $found = $this->repository()->latestSnapshotBefore(
            (int) $video->getKey(),
            (int) $jp->getKey(),
            $current->collected_at,
            (int) $current->getKey(),
        );

        $this->assertNotNull($found);
        $this->assertTrue($immediatePrevious->is($found));
        $this->assertFalse($older->is($found));
        $this->assertFalse($current->is($found));
    }

    public function test_snapshot_table_keeps_derived_metrics_out_of_db(): void
    {
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'view_count_delta'));
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'view_growth_rate'));
        $this->assertFalse(Schema::hasColumn('dance_short_video_snapshots', 'views_per_hour'));
    }

    private function repository(): DanceShortVideoSnapshotRepositoryInterface
    {
        return app(DanceShortVideoSnapshotRepositoryInterface::class);
    }

    private function region(string $code, string $name): DanceShortRegion
    {
        return DanceShortRegion::query()->create([
            'code' => $code,
            'name' => $name,
        ]);
    }

    private function video(
        string $youtubeVideoId,
        string $title,
        string $trackingStatus = 'active',
    ): DanceShortVideo {
        return DanceShortVideo::query()->create([
            'youtube_video_id' => $youtubeVideoId,
            'title' => $title,
            'tracking_status' => $trackingStatus,
        ]);
    }

    private function snapshot(
        DanceShortVideo $video,
        DanceShortRegion $region,
        int $viewCount,
        string $collectedAt,
    ): DanceShortVideoSnapshot {
        return DanceShortVideoSnapshot::query()->create([
            'video_id' => $video->getKey(),
            'region_id' => $region->getKey(),
            'view_count' => $viewCount,
            'collected_at' => $collectedAt,
        ]);
    }
}
