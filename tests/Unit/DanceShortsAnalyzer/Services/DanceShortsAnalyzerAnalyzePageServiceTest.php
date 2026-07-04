<?php

namespace Tests\Unit\DanceShortsAnalyzer\Services;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSelectedVideoDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;
use App\Services\DanceShortsAnalyzer\DanceShortsAnalyzerAnalyzePageService;
use App\Services\DanceShortsAnalyzer\DanceShortsAnalyzerSnapshotMetricService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortsAnalyzerAnalyzePageServiceTest extends TestCase
{
    public function test_it_builds_latest_snapshots_active_video_latest_region_and_region_analyses(): void
    {
        $video = $this->video(1, 'Active Video');
        $otherVideo = $this->video(2, 'Other Video');

        $result = $this->service()->buildResult(
            selectedVideos: [$video, $otherVideo],
            snapshots: [
                $this->snapshot(
                    snapshotId: 1,
                    videoId: 1,
                    regionId: 1,
                    viewCount: 100,
                    collectedAt: '2026-06-01 00:00:00',
                ),
                $this->snapshot(
                    snapshotId: 2,
                    videoId: 1,
                    regionId: 1,
                    viewCount: 120,
                    collectedAt: '2026-06-01 01:00:00',
                ),
                $this->snapshot(
                    snapshotId: 3,
                    videoId: 1,
                    regionId: 2,
                    regionCode: 'US',
                    regionName: 'アメリカ',
                    viewCount: 200,
                    collectedAt: '2026-06-01 02:00:00',
                ),
                $this->snapshot(
                    snapshotId: 4,
                    videoId: 2,
                    regionId: 1,
                    viewCount: 300,
                    collectedAt: '2026-06-01 03:00:00',
                ),
                $this->snapshot(
                    snapshotId: 5,
                    videoId: 2,
                    regionId: 1,
                    viewCount: 320,
                    collectedAt: '2026-06-01 03:00:00',
                ),
            ],
            requestedActiveVideoId: 999,
        );

        $this->assertSame(1, $result->activeVideoId);
        $this->assertSame(1, $result->activeVideo?->videoId);
        $this->assertSame(3, $result->selectedVideos[0]->latestSnapshot?->snapshotId);
        $this->assertSame(5, $result->selectedVideos[1]->latestSnapshot?->snapshotId);
        $this->assertSame(2, $result->activeRegionId);

        $this->assertCount(2, $result->videoAnalyses);
        $this->assertSame(2, $result->videoAnalyses[0]->regionId);
        $this->assertSame([3], array_map(
            fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): int => $snapshot->snapshotId,
            $result->videoAnalyses[0]->snapshots,
        ));

        $this->assertCount(2, $result->regionAnalyses);
        $this->assertSame(1, $result->regionAnalyses[0]->regionId);
        $this->assertSame(2, $result->regionAnalyses[1]->regionId);
    }

    public function test_it_rebuilds_comparison_periods_from_latest_video_analysis_snapshot(): void
    {
        $result = $this->service()->buildResult(
            selectedVideos: [$this->video(1, 'Period Video')],
            snapshots: [
                $this->snapshot(
                    snapshotId: 1,
                    videoId: 1,
                    regionId: 1,
                    viewCount: 10,
                    collectedAt: '2026-05-01 00:00:00',
                ),
                $this->snapshot(
                    snapshotId: 2,
                    videoId: 1,
                    regionId: 1,
                    viewCount: 20,
                    collectedAt: '2026-05-15 12:00:00',
                ),
                $this->snapshot(
                    snapshotId: 3,
                    videoId: 1,
                    regionId: 1,
                    viewCount: 40,
                    collectedAt: '2026-06-04 12:00:00',
                ),
                $this->snapshot(
                    snapshotId: 4,
                    videoId: 1,
                    regionId: 1,
                    viewCount: 70,
                    collectedAt: '2026-06-09 13:00:00',
                ),
                $this->snapshot(
                    snapshotId: 5,
                    videoId: 1,
                    regionId: 1,
                    viewCount: 100,
                    collectedAt: '2026-06-10 12:00:00',
                ),
            ],
            requestedActiveVideoId: null,
        );

        $this->assertSame([4, 5], $this->snapshotIds($result->comparisonPeriodVideoAnalyses['day'][0]->snapshots));
        $this->assertSame([3, 4, 5], $this->snapshotIds($result->comparisonPeriodVideoAnalyses['week'][0]->snapshots));
        $this->assertSame([2, 3, 4, 5], $this->snapshotIds($result->comparisonPeriodVideoAnalyses['month'][0]->snapshots));
        $this->assertSame([1, 2, 3, 4, 5], $this->snapshotIds($result->comparisonPeriodVideoAnalyses['all'][0]->snapshots));
        $this->assertSame(30, $result->comparisonPeriodVideoAnalyses['day'][0]->deltaRows[0]->viewDelta);
    }

    public function test_empty_result_keeps_all_comparison_period_keys(): void
    {
        $result = $this->service()->emptyResult();

        $this->assertSame([], $result->selectedVideos);
        $this->assertSame([
            'day' => [],
            'week' => [],
            'month' => [],
            'all' => [],
        ], $result->comparisonPeriodVideoAnalyses);
    }

    private function service(): DanceShortsAnalyzerAnalyzePageService
    {
        return new DanceShortsAnalyzerAnalyzePageService(
            new DanceShortsAnalyzerSnapshotMetricService,
        );
    }

    private function video(int $videoId, string $title): DanceShortsAnalyzerSelectedVideoDTO
    {
        return new DanceShortsAnalyzerSelectedVideoDTO(
            videoId: $videoId,
            youtubeVideoId: 'youtube-video-'.$videoId,
            title: $title,
            channelTitle: 'Dance Channel',
            thumbnailUrl: 'https://example.test/thumb-'.$videoId.'.jpg',
            publishedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
            trackingStatus: 'active',
            latestSnapshot: null,
        );
    }

    private function snapshot(
        int $snapshotId,
        int $videoId,
        int $regionId,
        int $viewCount,
        string $collectedAt,
        string $regionCode = 'JP',
        string $regionName = '日本',
    ): DanceShortsAnalyzerSnapshotPointDTO {
        return new DanceShortsAnalyzerSnapshotPointDTO(
            snapshotId: $snapshotId,
            videoId: $videoId,
            regionId: $regionId,
            regionCode: $regionCode,
            regionName: $regionName,
            viewCount: $viewCount,
            likeCount: 1,
            commentCount: 1,
            collectedAt: CarbonImmutable::parse($collectedAt, 'Asia/Tokyo'),
        );
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, int>
     */
    private function snapshotIds(array $snapshots): array
    {
        return array_map(
            fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): int => $snapshot->snapshotId,
            $snapshots,
        );
    }
}
