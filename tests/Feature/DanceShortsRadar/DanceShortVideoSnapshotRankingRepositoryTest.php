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

    public function test_ranking_rows_window_by_region_codes_returns_window_with_one_lookahead(): void
    {
        $jp = $this->region('JP', '日本');

        foreach (range(1, 6) as $rank) {
            $this->rankingVideoWithDelta(
                region: $jp,
                youtubeVideoId: sprintf('jp-window-%02d', $rank),
                delta: 700 - ($rank * 100),
            );
        }

        $rows = $this->repository()->rankingRowsWindowByRegionCodes(
            regionCodes: ['JP'],
            comparisonDays: 1,
            sortKey: 'view_count_delta',
            startRank: 1,
            windowSize: 5,
        );

        $this->assertCount(6, $rows);
        $this->assertSame('jp-window-01', $rows[0]->youtube_video_id);
        $this->assertSame('jp-window-05', $rows[4]->youtube_video_id);
        $this->assertSame('jp-window-06', $rows[5]->youtube_video_id);
        $this->assertSame(600, (int) $rows[0]->view_count_delta);
    }

    public function test_ranking_rows_window_handles_decreased_view_count(): void
    {
        $jp = $this->region('JP', '日本');
        $video = $this->video('jp-decreased-view-count', 'JP decreased view count');

        $this->snapshot($video, $jp, 1000, '2026-05-31 12:00:00');
        $this->snapshot($video, $jp, 900, '2026-06-01 12:00:00');

        $rows = $this->repository()->rankingRowsWindowByRegionCodes(
            regionCodes: ['JP'],
            comparisonDays: 1,
            sortKey: 'view_count_delta',
            startRank: 1,
            windowSize: 5,
        );

        $this->assertCount(1, $rows);
        $this->assertSame('jp-decreased-view-count', $rows[0]->youtube_video_id);
        $this->assertSame(-100, (int) $rows[0]->view_count_delta);
        $this->assertEqualsWithDelta(-0.1, (float) $rows[0]->view_growth_rate, 0.000001);
        $this->assertEqualsWithDelta(-100 / 24, (float) $rows[0]->views_per_hour, 0.000001);
    }

    public function test_rising_rows_window_returns_source_candidates_with_japan_status_conditions(): void
    {
        $jp = $this->region('JP', '日本');
        $us = $this->region('US', 'アメリカ');
        $kr = $this->region('KR', '韓国');
        $usUnobserved = $this->video('us-unobserved-rising', 'US unobserved rising');
        $krSmallerJapan = $this->video('kr-smaller-japan-rising', 'KR smaller Japan rising');
        $notCandidate = $this->video('not-rising', 'Not rising');

        $this->snapshot($usUnobserved, $us, 1000, '2026-05-31 12:00:00');
        $this->snapshot($usUnobserved, $us, 1800, '2026-06-01 12:00:00');

        $this->snapshot($krSmallerJapan, $kr, 1000, '2026-05-31 12:00:00');
        $this->snapshot($krSmallerJapan, $kr, 1500, '2026-06-01 12:00:00');
        $this->snapshot($krSmallerJapan, $jp, 1000, '2026-05-31 12:00:00');
        $this->snapshot($krSmallerJapan, $jp, 1100, '2026-06-01 12:00:00');

        $this->snapshot($notCandidate, $us, 1000, '2026-05-31 12:00:00');
        $this->snapshot($notCandidate, $us, 1200, '2026-06-01 12:00:00');
        $this->snapshot($notCandidate, $jp, 1000, '2026-05-31 12:00:00');
        $this->snapshot($notCandidate, $jp, 1600, '2026-06-01 12:00:00');

        $rows = $this->repository()->risingRowsWindow(
            sourceRegionCodes: ['US', 'KR'],
            comparisonDays: 1,
            startRank: 1,
            windowSize: 5,
        );

        $this->assertCount(2, $rows);
        $this->assertSame('us-unobserved-rising', $rows[0]->youtube_video_id);
        $this->assertSame('US', $rows[0]->source_region_code);
        $this->assertNull($rows[0]->japan_current_snapshot_id);
        $this->assertSame('kr-smaller-japan-rising', $rows[1]->youtube_video_id);
        $this->assertSame(100, (int) $rows[1]->japan_view_count_delta);
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
            CarbonImmutable::parse('2026-05-24 00:00:00', 'Asia/Tokyo'),
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
            CarbonImmutable::parse('2026-05-24 00:00:00', 'Asia/Tokyo'),
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

    private function rankingVideoWithDelta(
        DanceShortRegion $region,
        string $youtubeVideoId,
        int $delta,
    ): void {
        $video = $this->video($youtubeVideoId, $youtubeVideoId);

        $this->snapshot($video, $region, 1000, '2026-05-31 12:00:00');
        $this->snapshot($video, $region, 1000 + $delta, '2026-06-01 12:00:00');
    }
}
