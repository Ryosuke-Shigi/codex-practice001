<?php

namespace Tests\Unit\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewListDTO;
use App\Services\Earthquake\EarthquakeEntryExtractService;
use PHPUnit\Framework\TestCase;

class EarthquakeEntryExtractServiceTest extends TestCase
{
    public function test_extract_all_filters_earthquake_related_entries_and_excludes_volcano_entries(): void
    {
        $service = new EarthquakeEntryExtractService();
        $entries = new EarthquakeXmlEntryPreviewListDTO([
            new EarthquakeXmlEntryPreviewDTO(
                id: 'urn:jma:earthquake:1',
                title: '震源・震度に関する情報',
                updatedAt: '2026-05-11T08:00:00+09:00',
                publishedAt: '2026-05-11T07:58:00+09:00',
                xmlUrl: 'https://example.test/earthquake-1.xml',
                rawCategory: '地震情報 (地震火山関連)',
                rawAuthor: '気象庁',
            ),
            new EarthquakeXmlEntryPreviewDTO(
                id: 'urn:jma:tsunami:1',
                title: '津波警報・注意報',
                updatedAt: null,
                publishedAt: '2026-05-11T09:00:00+09:00',
                xmlUrl: 'https://example.test/tsunami-1.xml',
                rawCategory: '津波情報',
                rawAuthor: '気象庁',
            ),
            new EarthquakeXmlEntryPreviewDTO(
                id: 'urn:jma:volcano:1',
                title: '火山の状況に関する解説情報',
                updatedAt: '2026-05-11T10:00:00+09:00',
                publishedAt: '2026-05-11T09:55:00+09:00',
                xmlUrl: 'https://example.test/volcano-1.xml',
                rawCategory: '火山情報',
                rawAuthor: '気象庁',
            ),
            new EarthquakeXmlEntryPreviewDTO(
                id: 'urn:jma:broad-category-only',
                title: '防災情報のお知らせ',
                updatedAt: '2026-05-11T10:30:00+09:00',
                publishedAt: '2026-05-11T10:25:00+09:00',
                xmlUrl: 'https://example.test/broad-category.xml',
                rawCategory: '地震火山関連',
                rawAuthor: '気象庁',
            ),
        ]);

        $result = $service->extractAll($entries);

        $this->assertSame(2, $result->count());
        $this->assertSame('urn:jma:earthquake:1', $result->items[0]->id);
        $this->assertSame('urn:jma:tsunami:1', $result->items[1]->id);
    }

    public function test_extract_latest_prefers_updated_at_then_published_at_and_pushes_invalid_dates_back(): void
    {
        $service = new EarthquakeEntryExtractService();
        $entries = new EarthquakeXmlEntryPreviewListDTO([
            new EarthquakeXmlEntryPreviewDTO(
                id: 'urn:jma:invalid-date',
                title: '地震情報',
                updatedAt: 'not-a-date',
                publishedAt: null,
                xmlUrl: null,
                rawCategory: '地震情報',
                rawAuthor: '気象庁',
            ),
            new EarthquakeXmlEntryPreviewDTO(
                id: 'urn:jma:published-latest',
                title: '津波に関する情報',
                updatedAt: null,
                publishedAt: '2026-05-11T09:00:00+09:00',
                xmlUrl: null,
                rawCategory: '津波情報',
                rawAuthor: '気象庁',
            ),
            new EarthquakeXmlEntryPreviewDTO(
                id: 'urn:jma:updated-older',
                title: '震度速報',
                updatedAt: '2026-05-11T08:30:00+09:00',
                publishedAt: '2026-05-11T08:20:00+09:00',
                xmlUrl: null,
                rawCategory: '地震情報',
                rawAuthor: '気象庁',
            ),
        ]);

        $latest = $service->extractLatest($entries);

        $this->assertNotNull($latest);
        $this->assertSame('urn:jma:published-latest', $latest->id);
    }
}
