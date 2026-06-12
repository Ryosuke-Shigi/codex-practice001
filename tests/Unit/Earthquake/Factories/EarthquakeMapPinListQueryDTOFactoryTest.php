<?php

namespace Tests\Unit\Earthquake\Factories;

use App\Factories\Earthquake\EarthquakeMapPinListQueryDTOFactory;
use Carbon\CarbonImmutable;
use Tests\TestCase;

class EarthquakeMapPinListQueryDTOFactoryTest extends TestCase
{
    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_from_date_range_uses_received_dates(): void
    {
        $query = $this->factory()->fromDateRange(
            startDate: ' 2026-05-11 ',
            endDate: '2026-05-12',
        );

        $this->assertSame(100, $query->limit);
        $this->assertSame('2026-05-11', $query->startDate);
        $this->assertSame('2026-05-12', $query->endDate);
    }

    public function test_from_date_range_uses_app_timezone_for_default_date_range(): void
    {
        config(['app.timezone' => 'Asia/Tokyo']);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-14 00:30:00', 'Asia/Tokyo'));

        $query = $this->factory()->fromDateRange(
            startDate: null,
            endDate: null,
        );

        $this->assertSame('2026-05-11', $query->startDate);
        $this->assertSame('2026-05-14', $query->endDate);
    }

    public function test_from_date_range_defaults_missing_dates_independently(): void
    {
        config(['app.timezone' => 'Asia/Tokyo']);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-14 12:00:00', 'Asia/Tokyo'));

        $missingEndDate = $this->factory()->fromDateRange(
            startDate: '2026-05-12',
            endDate: null,
        );
        $missingStartDate = $this->factory()->fromDateRange(
            startDate: null,
            endDate: '2026-05-13',
        );

        $this->assertSame('2026-05-12', $missingEndDate->startDate);
        $this->assertSame('2026-05-14', $missingEndDate->endDate);
        $this->assertSame('2026-05-11', $missingStartDate->startDate);
        $this->assertSame('2026-05-13', $missingStartDate->endDate);
    }

    public function test_from_date_range_keeps_received_limit(): void
    {
        $query = $this->factory()->fromDateRange(
            startDate: '2026-05-11',
            endDate: '2026-05-14',
            limit: 123,
        );

        $this->assertSame(123, $query->limit);
    }

    private function factory(): EarthquakeMapPinListQueryDTOFactory
    {
        return new EarthquakeMapPinListQueryDTOFactory;
    }
}
