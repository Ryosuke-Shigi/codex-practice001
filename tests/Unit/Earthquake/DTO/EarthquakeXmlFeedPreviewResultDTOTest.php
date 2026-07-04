<?php

namespace Tests\Unit\Earthquake\DTO;

use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlEntryPreviewListDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlFeedPreviewDTO;
use App\DTO\Earthquake\Preview\EarthquakeXmlFeedPreviewResultDTO;
use Tests\TestCase;

class EarthquakeXmlFeedPreviewResultDTOTest extends TestCase
{
    public function test_to_array_keeps_xml_preview_result_shape(): void
    {
        $dto = new EarthquakeXmlFeedPreviewResultDTO(
            endpoint: 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml',
            method: 'GET',
            success: true,
            statusCode: 200,
            fetchedAt: '2026-05-11T08:30:01+09:00',
            responseTimeMs: 123.45,
            error: null,
            feed: new EarthquakeXmlFeedPreviewDTO(
                feedTitle: 'JMA Earthquake and Volcano Feed',
                feedUpdatedAt: '2026-05-11T08:30:00+09:00',
                entries: new EarthquakeXmlEntryPreviewListDTO([
                    new EarthquakeXmlEntryPreviewDTO(
                        id: 'urn:jma:example:1',
                        title: '震源・震度に関する情報',
                        updatedAt: '2026-05-11T08:30:00+09:00',
                        publishedAt: '2026-05-11T08:25:00+09:00',
                        xmlUrl: 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
                        rawCategory: '地震情報 (地震火山関連)',
                        rawAuthor: '気象庁',
                    ),
                ]),
            ),
        );

        $this->assertSame([
            'endpoint' => 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml',
            'method' => 'GET',
            'success' => true,
            'statusCode' => 200,
            'fetchedAt' => '2026-05-11T08:30:01+09:00',
            'responseTimeMs' => 123.45,
            'error' => null,
            'feed' => [
                'feedTitle' => 'JMA Earthquake and Volcano Feed',
                'feedUpdatedAt' => '2026-05-11T08:30:00+09:00',
                'entries' => [
                    'items' => [
                        [
                            'id' => 'urn:jma:example:1',
                            'title' => '震源・震度に関する情報',
                            'updatedAt' => '2026-05-11T08:30:00+09:00',
                            'publishedAt' => '2026-05-11T08:25:00+09:00',
                            'xmlUrl' => 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml',
                            'rawCategory' => '地震情報 (地震火山関連)',
                            'rawAuthor' => '気象庁',
                        ],
                    ],
                    'count' => 1,
                ],
            ],
        ], $dto->toArray());
    }

    public function test_to_array_keeps_safe_error_shape_without_feed(): void
    {
        $dto = new EarthquakeXmlFeedPreviewResultDTO(
            endpoint: 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml',
            method: 'GET',
            success: false,
            statusCode: 503,
            fetchedAt: '2026-05-11T08:30:01+09:00',
            responseTimeMs: 25.0,
            error: [
                'status' => 503,
                'message' => '気象庁 高頻度フィードを取得できませんでした。',
            ],
            feed: null,
        );

        $this->assertSame([
            'endpoint' => 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml',
            'method' => 'GET',
            'success' => false,
            'statusCode' => 503,
            'fetchedAt' => '2026-05-11T08:30:01+09:00',
            'responseTimeMs' => 25.0,
            'error' => [
                'status' => 503,
                'message' => '気象庁 高頻度フィードを取得できませんでした。',
            ],
            'feed' => null,
        ], $dto->toArray());
    }
}
