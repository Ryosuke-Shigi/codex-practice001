<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortSnapshotMetricServiceTest extends TestCase
{
    public function test_it_calculates_snapshot_derived_metrics(): void
    {
        $metrics = $this->service()->calculateSnapshotMetrics(
            previousViewCount: 700,
            previousCollectedAt: CarbonImmutable::parse('2026-05-30 12:00:00', 'Asia/Tokyo'),
            currentViewCount: 1000,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
        );

        $this->assertSame(300, $metrics['viewCountDelta']);
        $this->assertSame(300 / 700, $metrics['viewGrowthRate']);
        $this->assertSame(300 / 24, $metrics['viewsPerHour']);
    }

    public function test_growth_rate_is_null_when_previous_view_count_is_zero(): void
    {
        $metrics = $this->service()->calculateSnapshotMetrics(
            previousViewCount: 0,
            previousCollectedAt: CarbonImmutable::parse('2026-05-30 12:00:00', 'Asia/Tokyo'),
            currentViewCount: 1000,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
        );

        $this->assertSame(1000, $metrics['viewCountDelta']);
        $this->assertNull($metrics['viewGrowthRate']);
        $this->assertSame(1000 / 24, $metrics['viewsPerHour']);
    }

    public function test_views_per_hour_is_null_when_time_diff_is_zero_or_negative(): void
    {
        $zeroDiff = $this->service()->calculateSnapshotMetrics(
            previousViewCount: 700,
            previousCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
            currentViewCount: 1000,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
        );
        $negativeDiff = $this->service()->calculateSnapshotMetrics(
            previousViewCount: 700,
            previousCollectedAt: CarbonImmutable::parse('2026-05-31 13:00:00', 'Asia/Tokyo'),
            currentViewCount: 1000,
            currentCollectedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
        );

        $this->assertNull($zeroDiff['viewsPerHour']);
        $this->assertNull($negativeDiff['viewsPerHour']);
    }

    public function test_metrics_are_null_when_previous_snapshot_is_missing(): void
    {
        $metrics = $this->service()->calculateSnapshotMetrics(
            previousViewCount: null,
            previousCollectedAt: null,
            currentViewCount: 1000,
            currentCollectedAt: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
        );

        $this->assertNull($metrics['viewCountDelta']);
        $this->assertNull($metrics['viewGrowthRate']);
        $this->assertNull($metrics['viewsPerHour']);
    }

    public function test_comparison_days_candidates_and_default_are_fixed(): void
    {
        $service = $this->service();

        $this->assertSame([1, 3, 7, 14, 30], $service->allowedComparisonDays());
        $this->assertSame(1, $service->normalizeComparisonDays(1));
        $this->assertSame(3, $service->normalizeComparisonDays(3));
        $this->assertSame(7, $service->normalizeComparisonDays(7));
        $this->assertSame(14, $service->normalizeComparisonDays(14));
        $this->assertSame(30, $service->normalizeComparisonDays(30));
        $this->assertSame(1, $service->normalizeComparisonDays(8));
        $this->assertSame(1, $service->normalizeComparisonDays(null));
    }

    public function test_sort_key_candidates_and_default_are_fixed(): void
    {
        $service = $this->service();

        $this->assertSame([
            'views_per_hour',
            'view_count_delta',
            'view_growth_rate',
            'current_view_count',
        ], $service->allowedSortKeys());
        $this->assertSame('views_per_hour', $service->normalizeSortKey('views_per_hour'));
        $this->assertSame('view_count_delta', $service->normalizeSortKey('view_count_delta'));
        $this->assertSame('view_growth_rate', $service->normalizeSortKey('view_growth_rate'));
        $this->assertSame('current_view_count', $service->normalizeSortKey('current_view_count'));
        $this->assertSame('views_per_hour', $service->normalizeSortKey('invalid'));
        $this->assertSame('views_per_hour', $service->normalizeSortKey(null));
    }

    private function service(): DanceShortSnapshotMetricService
    {
        return new DanceShortSnapshotMetricService;
    }
}
