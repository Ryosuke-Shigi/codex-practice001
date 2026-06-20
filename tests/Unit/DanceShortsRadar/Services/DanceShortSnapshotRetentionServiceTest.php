<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\Services\DanceShortsRadar\DanceShortSnapshotRetentionService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

/**
 * snapshot cleanup の保持期間と JST cutoff 境界を固定する Unit Test です。
 *
 * Repository の削除 query ではなく、Service が担う日数判断と時刻変換だけを確認します。
 */
class DanceShortSnapshotRetentionServiceTest extends TestCase
{
    public function test_retention_days_default_to_thirty_five_days_for_thirty_day_comparison_with_buffer(): void
    {
        $service = new DanceShortSnapshotRetentionService;

        $this->assertSame(30, $service->maxComparisonDays());
        $this->assertSame(35, $service->retentionDays());
        $this->assertSame(35, $service->retentionDays(35));
        $this->assertSame(45, $service->retentionDays(45));
    }

    public function test_invalid_or_too_short_retention_is_forced_to_safe_default(): void
    {
        $service = new DanceShortSnapshotRetentionService;

        $this->assertSame(35, $service->retentionDays(29));
        $this->assertSame(35, $service->retentionDays(0));
        $this->assertSame(35, $service->retentionDays('invalid'));
    }

    public function test_cutoff_date_is_calculated_from_retention_days(): void
    {
        $service = new DanceShortSnapshotRetentionService;

        $cutoff = $service->cutoffAt(
            now: CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
            configuredRetentionDays: 35,
        );

        $this->assertSame('2026-04-27 12:00:00', $cutoff->format('Y-m-d H:i:s'));
        $this->assertSame('Asia/Tokyo', $cutoff->timezoneName);
    }
}
