<?php

namespace Tests\Unit\DanceShortsRadar\Services;

use App\Services\DanceShortsRadar\DanceShortSnapshotPeriodService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class DanceShortSnapshotPeriodServiceTest extends TestCase
{
    public function test_jst_twelve_hour_period_returns_midnight_window_as_utc_boundaries(): void
    {
        $period = (new DanceShortSnapshotPeriodService())->jstTwelveHourPeriod(
            CarbonImmutable::parse('2026-06-01 10:15:00', 'Asia/Tokyo'),
        );

        $this->assertSame('2026-05-31 15:00:00', $period['start']->format('Y-m-d H:i:s'));
        $this->assertSame('UTC', $period['start']->timezoneName);
        $this->assertSame('2026-06-01 03:00:00', $period['end']->format('Y-m-d H:i:s'));
        $this->assertSame('UTC', $period['end']->timezoneName);
    }

    public function test_jst_twelve_hour_period_returns_noon_window_as_utc_boundaries(): void
    {
        $period = (new DanceShortSnapshotPeriodService())->jstTwelveHourPeriod(
            CarbonImmutable::parse('2026-06-01 12:00:00', 'Asia/Tokyo'),
        );

        $this->assertSame('2026-06-01 03:00:00', $period['start']->format('Y-m-d H:i:s'));
        $this->assertSame('UTC', $period['start']->timezoneName);
        $this->assertSame('2026-06-01 15:00:00', $period['end']->format('Y-m-d H:i:s'));
        $this->assertSame('UTC', $period['end']->timezoneName);
    }
}
