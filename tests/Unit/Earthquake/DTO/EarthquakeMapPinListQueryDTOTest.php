<?php

namespace Tests\Unit\Earthquake\DTO;

use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class EarthquakeMapPinListQueryDTOTest extends TestCase
{
    public function test_constructor_preserves_received_values(): void
    {
        $query = new EarthquakeMapPinListQueryDTO(
            limit: 0,
            startDate: '2026-05-11',
            endDate: '2026-05-14',
        );

        $this->assertSame(0, $query->limit);
        $this->assertSame('2026-05-11', $query->startDate);
        $this->assertSame('2026-05-14', $query->endDate);
        $this->assertSame([
            'startDate' => '2026-05-11',
            'endDate' => '2026-05-14',
        ], $query->filtersToArray());
    }

    public function test_dto_does_not_define_default_date_range(): void
    {
        $this->assertFalse(method_exists(EarthquakeMapPinListQueryDTO::class, 'defaultDateRange'));
        $this->assertFalse(method_exists(EarthquakeMapPinListQueryDTO::class, 'forMap'));
    }

    public function test_dto_does_not_depend_on_current_date_or_config(): void
    {
        $source = $this->source();

        $this->assertStringNotContainsString('CarbonImmutable', $source);
        $this->assertStringNotContainsString('config(', $source);
    }

    private function source(): string
    {
        $fileName = (new ReflectionClass(EarthquakeMapPinListQueryDTO::class))->getFileName();

        $this->assertIsString($fileName);

        return (string) file_get_contents($fileName);
    }
}
