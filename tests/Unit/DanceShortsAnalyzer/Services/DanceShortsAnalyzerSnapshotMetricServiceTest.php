<?php

namespace Tests\Unit\DanceShortsAnalyzer\Services;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;
use App\Services\DanceShortsAnalyzer\DanceShortsAnalyzerSnapshotMetricService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortsAnalyzerSnapshotMetricServiceTest extends TestCase
{
    public function test_it_calculates_view_like_comment_delta_and_per_hour(): void
    {
        $metrics = $this->service()->calculate([
            $this->snapshot(
                snapshotId: 1,
                viewCount: 100,
                likeCount: 10,
                commentCount: 1,
                collectedAt: '2026-06-01 00:00:00',
            ),
            $this->snapshot(
                snapshotId: 2,
                viewCount: 160,
                likeCount: 16,
                commentCount: 4,
                collectedAt: '2026-06-01 03:00:00',
            ),
        ]);

        $this->assertNull($metrics[0]->viewDelta);
        $this->assertNull($metrics[0]->viewPerHour);
        $this->assertSame(60, $metrics[1]->viewDelta);
        $this->assertSame(6, $metrics[1]->likeDelta);
        $this->assertSame(3, $metrics[1]->commentDelta);
        $this->assertSame(3.0, $metrics[1]->hours);
        $this->assertSame(20.0, $metrics[1]->viewPerHour);
        $this->assertSame(2.0, $metrics[1]->likePerHour);
        $this->assertSame(1.0, $metrics[1]->commentPerHour);
    }

    public function test_per_hour_is_null_when_hours_are_zero_or_negative(): void
    {
        $metrics = $this->service()->calculate([
            $this->snapshot(
                snapshotId: 1,
                viewCount: 100,
                likeCount: 10,
                commentCount: 1,
                collectedAt: '2026-06-01 03:00:00',
            ),
            $this->snapshot(
                snapshotId: 2,
                viewCount: 160,
                likeCount: 16,
                commentCount: 4,
                collectedAt: '2026-06-01 03:00:00',
            ),
            $this->snapshot(
                snapshotId: 3,
                viewCount: 180,
                likeCount: 18,
                commentCount: 5,
                collectedAt: '2026-06-01 02:00:00',
            ),
        ]);

        $this->assertSame(60, $metrics[1]->viewDelta);
        $this->assertNull($metrics[1]->viewPerHour);
        $this->assertSame(20, $metrics[2]->viewDelta);
        $this->assertNull($metrics[2]->viewPerHour);
    }

    public function test_null_like_or_comment_count_makes_that_metric_uncalculable(): void
    {
        $metrics = $this->service()->calculate([
            $this->snapshot(
                snapshotId: 1,
                viewCount: 100,
                likeCount: null,
                commentCount: 1,
                collectedAt: '2026-06-01 00:00:00',
            ),
            $this->snapshot(
                snapshotId: 2,
                viewCount: 160,
                likeCount: 16,
                commentCount: null,
                collectedAt: '2026-06-01 02:00:00',
            ),
        ]);

        $this->assertSame(60, $metrics[1]->viewDelta);
        $this->assertNull($metrics[1]->likeDelta);
        $this->assertNull($metrics[1]->likePerHour);
        $this->assertNull($metrics[1]->commentDelta);
        $this->assertNull($metrics[1]->commentPerHour);
    }

    private function service(): DanceShortsAnalyzerSnapshotMetricService
    {
        return new DanceShortsAnalyzerSnapshotMetricService;
    }

    private function snapshot(
        int $snapshotId,
        int $viewCount,
        ?int $likeCount,
        ?int $commentCount,
        string $collectedAt,
    ): DanceShortsAnalyzerSnapshotPointDTO {
        return new DanceShortsAnalyzerSnapshotPointDTO(
            snapshotId: $snapshotId,
            videoId: 1,
            regionId: 1,
            regionCode: 'JP',
            regionName: '日本',
            viewCount: $viewCount,
            likeCount: $likeCount,
            commentCount: $commentCount,
            collectedAt: CarbonImmutable::parse($collectedAt, 'UTC'),
        );
    }
}
