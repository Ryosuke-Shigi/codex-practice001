<?php

namespace Tests\Unit\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryDTO;
use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use App\Factories\Earthquake\EarthquakeVisualPreviewFactory;
use PHPUnit\Framework\TestCase;

class EarthquakeVisualPreviewFactoryTest extends TestCase
{
    public function test_make_default_keeps_the_static_design_preview_shape(): void
    {
        $factory = new EarthquakeVisualPreviewFactory();

        $preview = $factory->makeDefault()->toArray();

        $this->assertCount(4, $preview['pins']);
        $this->assertSame('震度7', $preview['pins'][0]['label']);
        $this->assertSame('#ef4444', $preview['pins'][0]['color']);
        $this->assertCount(3, $preview['ripples']);
        $this->assertSame('強い波紋', $preview['ripples'][0]['label']);
    }

    public function test_make_accepts_extracted_entries_without_running_extraction_or_xml_fetching(): void
    {
        $factory = new EarthquakeVisualPreviewFactory();
        $entries = new EarthquakeExtractedEntryListDTO([
            new EarthquakeExtractedEntryDTO(
                id: 'urn:jma:earthquake:latest',
                title: '震源・震度に関する情報',
                updatedAt: '2026-05-11T09:00:00+09:00',
                publishedAt: null,
                xmlUrl: 'https://example.test/latest.xml',
                rawCategory: '地震情報',
                rawAuthor: '気象庁',
            ),
        ]);

        $preview = $factory->make($entries)->toArray();

        $this->assertSame('最新地震entry', $preview['pins'][0]['label']);
        $this->assertSame('7', $preview['pins'][0]['maxIntensity']);
        $this->assertSame('1.6s', $preview['ripples'][0]['duration']);
    }
}
