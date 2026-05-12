<?php

namespace Tests\Unit\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use PHPUnit\Framework\TestCase;

class EarthquakeMapPinListDTOTest extends TestCase
{
    public function test_to_array_returns_items_and_count(): void
    {
        $dto = new EarthquakeMapPinListDTO([
            new EarthquakeMapPinDTO(
                eventId: '20260511112751',
                sourceEntryId: 123,
                title: '震源・震度情報',
                areaName: '青森県東方沖',
                headline: '１１日１１時２７分ころ、地震がありました。',
                rawCoordinate: '+41.0+142.5-50000/',
                latitude: '41.0000000',
                longitude: '142.5000000',
                depthMeter: 50000,
                magnitude: '4.0',
                maxIntensity: '5-',
                occurredAt: '2026-05-11T11:27:00+09:00',
                reportedAt: '2026-05-11T11:31:00+09:00',
                comment: '保存済み地震情報です。',
            ),
        ]);

        $this->assertSame([
            'items' => [
                [
                    'eventId' => '20260511112751',
                    'sourceEntryId' => 123,
                    'title' => '震源・震度情報',
                    'areaName' => '青森県東方沖',
                    'headline' => '１１日１１時２７分ころ、地震がありました。',
                    'rawCoordinate' => '+41.0+142.5-50000/',
                    'latitude' => '41.0000000',
                    'longitude' => '142.5000000',
                    'depthMeter' => 50000,
                    'magnitude' => '4.0',
                    'maxIntensity' => '5-',
                    'occurredAt' => '2026-05-11T11:27:00+09:00',
                    'reportedAt' => '2026-05-11T11:31:00+09:00',
                    'comment' => '保存済み地震情報です。',
                ],
            ],
            'count' => 1,
        ], $dto->toArray());
    }
}
