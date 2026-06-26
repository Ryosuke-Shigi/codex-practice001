<?php

namespace Tests\Unit\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use App\Repositories\Earthquake\EarthquakeDetailXmlRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Services\Earthquake\EarthquakeDetailXmlParseService;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class EarthquakeMapPinBuildServiceTest extends TestCase
{
    public function test_sync_builds_only_mappable_pins_and_counts_skipped_and_failed_entries(): void
    {
        Event::fake([ApplicationErrorOccurred::class, ApplicationIntegrationLogged::class]);

        $feedEntryRepository = new class implements EarthquakeFeedEntryRepositoryInterface
        {
            public function isStorageReady(): bool
            {
                return true;
            }

            public function upsertFromExtractedEntries($entries): array
            {
                return [
                    'totalCount' => 0,
                    'insertedCount' => 0,
                    'updatedCount' => 0,
                    'skippedCount' => 0,
                    'failedCount' => 0,
                ];
            }

            public function latest(int $limit = 20): array
            {
                return [];
            }

            public function entriesForMapPinBuild(int $limit = 100): array
            {
                return [
                    ['id' => 101, 'xmlUrl' => 'https://example.test/valid.xml', 'title' => '震源・震度に関する情報'],
                    ['id' => 102, 'xmlUrl' => 'https://example.test/no-intensity.xml', 'title' => '震度なし'],
                    ['id' => 103, 'xmlUrl' => 'https://example.test/no-coordinate.xml', 'title' => '座標なし'],
                    ['id' => 104, 'xmlUrl' => 'https://example.test/fetch-failed.xml', 'title' => '取得失敗'],
                    ['id' => 105, 'xmlUrl' => '', 'title' => 'URLなし'],
                    ['id' => 106, 'xmlUrl' => 'https://example.test/non-seismology.xml', 'title' => '津波情報'],
                ];
            }
        };
        $detailXmlRepository = new class($this->earthquakeReportXml(), $this->earthquakeReportXml(maxIntensity: null), $this->earthquakeReportXml(coordinate: null), $this->nonSeismologyReportXml()) implements EarthquakeDetailXmlRepositoryInterface
        {
            /**
             * @var array<string, string>
             */
            private array $bodies;

            public function __construct(string $validXml, string $noIntensityXml, string $noCoordinateXml, string $nonSeismologyXml)
            {
                $this->bodies = [
                    'https://example.test/valid.xml' => $validXml,
                    'https://example.test/no-intensity.xml' => $noIntensityXml,
                    'https://example.test/no-coordinate.xml' => $noCoordinateXml,
                    'https://example.test/non-seismology.xml' => $nonSeismologyXml,
                ];
            }

            public function fetch(string $url): array
            {
                if (! array_key_exists($url, $this->bodies)) {
                    return [
                        'endpoint' => $url,
                        'method' => 'GET',
                        'request_headers' => [],
                        'success' => false,
                        'status_code' => 503,
                        'fetched_at' => '2026-05-11T11:32:00+09:00',
                        'response_time_ms' => 12.3,
                        'body' => null,
                        'error_message' => 'upstream unavailable',
                    ];
                }

                return [
                    'endpoint' => $url,
                    'method' => 'GET',
                    'request_headers' => [],
                    'success' => true,
                    'status_code' => 200,
                    'fetched_at' => '2026-05-11T11:32:00+09:00',
                    'response_time_ms' => 12.3,
                    'body' => $this->bodies[$url],
                    'error_message' => null,
                ];
            }
        };
        $mapPinRepository = new class implements EarthquakeMapPinRepositoryInterface
        {
            public ?EarthquakeMapPinListDTO $receivedPins = null;

            public function isStorageReady(): bool
            {
                return true;
            }

            public function upsertFromMapPins(EarthquakeMapPinListDTO $pins): array
            {
                $this->receivedPins = $pins;

                return [
                    'totalCount' => $pins->count(),
                    'insertedCount' => $pins->count(),
                    'updatedCount' => 0,
                    'skippedCount' => 0,
                    'failedCount' => 0,
                ];
            }

            public function latest(int $limit = 50): array
            {
                return [];
            }

            public function toMapPinListDTO(EarthquakeMapPinListQueryDTO $query): EarthquakeMapPinListDTO
            {
                return new EarthquakeMapPinListDTO([]);
            }
        };
        $service = new EarthquakeMapPinBuildService(
            $feedEntryRepository,
            $detailXmlRepository,
            new EarthquakeDetailXmlParseService,
            $mapPinRepository,
        );

        $result = $service->sync(77);

        $this->assertSame(77, $result->syncRunId);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $result->status);
        $this->assertSame(6, $result->totalCount);
        $this->assertSame(1, $result->insertedCount);
        $this->assertSame(0, $result->updatedCount);
        $this->assertSame(4, $result->skippedCount);
        $this->assertSame(1, $result->failedCount);

        $this->assertNotNull($mapPinRepository->receivedPins);
        $this->assertCount(1, $mapPinRepository->receivedPins->items);
        $pin = $mapPinRepository->receivedPins->items[0];

        $this->assertSame('20260511112751', $pin->eventId);
        $this->assertSame(101, $pin->sourceEntryId);
        $this->assertSame('震源・震度情報', $pin->title);
        $this->assertSame('青森県東方沖', $pin->areaName);
        $this->assertSame('41.0000000', $pin->latitude);
        $this->assertSame('142.5000000', $pin->longitude);
        $this->assertSame('4.0', $pin->magnitude);
        $this->assertSame('5-', $pin->maxIntensity);
        $this->assertSame('2026-05-11T11:27:00+09:00', $pin->occurredAt);
        $this->assertSame('2026-05-11T11:31:00+09:00', $pin->reportedAt);
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === '個別XML取得'
                && $event->status === 'success'
                && str_contains((string) $event->message, '件数: 4件')
                && str_contains((string) $event->message, '代表URL: https://example.test/valid.xml'),
        );
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === '個別XML取得'
                && $event->status === 'failed'
                && $event->responseStatus === 503
                && str_contains((string) $event->message, '分類: 5xx'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_server_error'
                && str_contains($event->message, '分類: 5xx / 件数: 1')
                && str_contains($event->message, '対象フィードID: 104')
                && ! str_contains($event->message, 'upstream unavailable'),
        );
        Event::assertNotDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_parse_failed',
        );
    }

    public function test_sync_skips_detail_xml_404_empty_body_and_rejected_url_without_error_log(): void
    {
        Event::fake([ApplicationErrorOccurred::class, ApplicationIntegrationLogged::class]);

        $entries = [
            ['id' => 201, 'xmlUrl' => 'https://example.test/not-found.xml', 'title' => '404'],
            ['id' => 202, 'xmlUrl' => 'https://example.test/empty.xml', 'title' => '空XML'],
            ['id' => 203, 'xmlUrl' => 'https://evil.example.test/detail.xml', 'title' => 'JMA以外URL'],
        ];
        $service = new EarthquakeMapPinBuildService(
            $this->feedEntryRepositoryReturning($entries),
            $this->detailXmlRepositoryReturning([
                'https://example.test/not-found.xml' => $this->transport(
                    url: 'https://example.test/not-found.xml',
                    success: false,
                    statusCode: 404,
                    body: null,
                    errorMessage: '気象庁 個別XMLの取得先がエラーを返しました。理由：XMLファイルが見つかりません。',
                ),
                'https://example.test/empty.xml' => $this->transport(
                    url: 'https://example.test/empty.xml',
                    success: false,
                    statusCode: 200,
                    body: '',
                    errorMessage: '気象庁 個別XMLの内容が空でした。',
                ),
                'https://evil.example.test/detail.xml' => $this->transport(
                    url: 'https://evil.example.test/detail.xml',
                    success: false,
                    statusCode: null,
                    body: null,
                    errorMessage: '気象庁XML以外のURLは取得できません。',
                ),
            ]),
            new EarthquakeDetailXmlParseService,
            $this->emptyMapPinRepository(),
        );

        $result = $service->sync(88);

        $this->assertSame(3, $result->totalCount);
        $this->assertSame(3, $result->skippedCount);
        $this->assertSame(0, $result->failedCount);
        $this->assertSame(0, $result->insertedCount);
        Event::assertNotDispatched(ApplicationErrorOccurred::class);
        Event::assertDispatchedTimes(ApplicationIntegrationLogged::class, 3);
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->status === 'skipped'
                && $event->responseStatus === 404
                && str_contains((string) $event->message, '分類: 404'),
        );
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->status === 'skipped'
                && $event->responseStatus === 200
                && str_contains((string) $event->message, '分類: empty_body'),
        );
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->status === 'skipped'
                && $event->responseStatus === null
                && str_contains((string) $event->message, '分類: url_rejected'),
        );
    }

    public function test_sync_aggregates_repeated_transport_failures_by_classification(): void
    {
        Event::fake([ApplicationErrorOccurred::class, ApplicationIntegrationLogged::class]);

        $entries = [
            ['id' => 301, 'xmlUrl' => 'https://example.test/rate-limited-1.xml', 'title' => '429 1'],
            ['id' => 302, 'xmlUrl' => 'https://example.test/rate-limited-2.xml', 'title' => '429 2'],
            ['id' => 303, 'xmlUrl' => 'https://example.test/server-error.xml', 'title' => '5xx'],
            ['id' => 304, 'xmlUrl' => 'https://example.test/connection-1.xml', 'title' => '接続失敗 1'],
            ['id' => 305, 'xmlUrl' => 'https://example.test/connection-2.xml', 'title' => '接続失敗 2'],
            ['id' => 306, 'xmlUrl' => 'https://example.test/other-http-error.xml', 'title' => 'その他HTTPエラー'],
        ];
        $service = new EarthquakeMapPinBuildService(
            $this->feedEntryRepositoryReturning($entries),
            $this->detailXmlRepositoryReturning([
                'https://example.test/rate-limited-1.xml' => $this->transport(
                    url: 'https://example.test/rate-limited-1.xml',
                    success: false,
                    statusCode: 429,
                    body: null,
                    errorMessage: 'rate limit detail should stay out of the summary message',
                ),
                'https://example.test/rate-limited-2.xml' => $this->transport(
                    url: 'https://example.test/rate-limited-2.xml',
                    success: false,
                    statusCode: 429,
                    body: null,
                    errorMessage: 'rate limit detail should stay out of the summary message',
                ),
                'https://example.test/server-error.xml' => $this->transport(
                    url: 'https://example.test/server-error.xml',
                    success: false,
                    statusCode: 503,
                    body: null,
                    errorMessage: 'server error detail should stay out of the summary message',
                ),
                'https://example.test/connection-1.xml' => $this->transport(
                    url: 'https://example.test/connection-1.xml',
                    success: false,
                    statusCode: null,
                    body: null,
                    errorMessage: 'connection detail should stay out of the summary message',
                ),
                'https://example.test/connection-2.xml' => $this->transport(
                    url: 'https://example.test/connection-2.xml',
                    success: false,
                    statusCode: null,
                    body: null,
                    errorMessage: 'connection detail should stay out of the summary message',
                ),
                'https://example.test/other-http-error.xml' => $this->transport(
                    url: 'https://example.test/other-http-error.xml',
                    success: false,
                    statusCode: 403,
                    body: null,
                    errorMessage: 'other http detail should stay out of the summary message',
                ),
            ]),
            new EarthquakeDetailXmlParseService,
            $this->emptyMapPinRepository(),
        );

        $result = $service->sync(89);

        $this->assertSame(6, $result->totalCount);
        $this->assertSame(0, $result->skippedCount);
        $this->assertSame(6, $result->failedCount);
        Event::assertDispatchedTimes(ApplicationErrorOccurred::class, 4);
        Event::assertDispatchedTimes(ApplicationIntegrationLogged::class, 4);
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->status === 'failed'
                && $event->responseStatus === 429
                && str_contains((string) $event->message, '分類: 429')
                && str_contains((string) $event->message, '件数: 2件')
                && str_contains((string) $event->message, '代表URL: https://example.test/rate-limited-1.xml'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_rate_limited'
                && $event->url === 'https://example.test/rate-limited-1.xml'
                && str_contains($event->message, '分類: 429 / 件数: 2')
                && str_contains($event->message, '対象フィードID例: 301, 302')
                && ! str_contains($event->message, 'rate limit detail'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_server_error'
                && str_contains($event->message, '分類: 5xx / 件数: 1')
                && str_contains($event->message, '対象フィードID: 303')
                && ! str_contains($event->message, 'server error detail'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_connection_failed'
                && str_contains($event->message, '分類: connection_failed / 件数: 2')
                && str_contains($event->message, '対象フィードID例: 304, 305')
                && ! str_contains($event->message, 'connection detail'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_fetch_failed'
                && str_contains($event->message, '分類: http_error / 件数: 1')
                && str_contains($event->message, '対象フィードID: 306')
                && ! str_contains($event->message, 'other http detail'),
        );
    }

    public function test_sync_aggregates_repeated_parse_failures_by_classification(): void
    {
        Event::fake([ApplicationErrorOccurred::class, ApplicationIntegrationLogged::class]);

        $entries = [
            ['id' => 401, 'xmlUrl' => 'https://example.test/invalid-1.xml', 'title' => '解析失敗 1'],
            ['id' => 402, 'xmlUrl' => 'https://example.test/invalid-2.xml', 'title' => '解析失敗 2'],
        ];
        $service = new EarthquakeMapPinBuildService(
            $this->feedEntryRepositoryReturning($entries),
            $this->detailXmlRepositoryReturning([
                'https://example.test/invalid-1.xml' => $this->transport(
                    url: 'https://example.test/invalid-1.xml',
                    success: true,
                    statusCode: 200,
                    body: 'not xml payload 1',
                    errorMessage: null,
                ),
                'https://example.test/invalid-2.xml' => $this->transport(
                    url: 'https://example.test/invalid-2.xml',
                    success: true,
                    statusCode: 200,
                    body: 'not xml payload 2',
                    errorMessage: null,
                ),
            ]),
            new EarthquakeDetailXmlParseService,
            $this->emptyMapPinRepository(),
        );

        $result = $service->sync(90);

        $this->assertSame(2, $result->totalCount);
        $this->assertSame(0, $result->skippedCount);
        $this->assertSame(2, $result->failedCount);
        Event::assertDispatchedTimes(ApplicationErrorOccurred::class, 1);
        Event::assertDispatchedTimes(ApplicationIntegrationLogged::class, 1);
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->status === 'success'
                && str_contains((string) $event->message, '件数: 2件')
                && str_contains((string) $event->message, '代表URL: https://example.test/invalid-1.xml'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_parse_failed'
                && $event->url === 'https://example.test/invalid-1.xml'
                && str_contains($event->message, '分類: parse_failed / 件数: 2')
                && str_contains($event->message, '対象フィードID例: 401, 402')
                && ! str_contains($event->message, 'not xml payload'),
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $entries
     */
    private function feedEntryRepositoryReturning(array $entries): EarthquakeFeedEntryRepositoryInterface
    {
        return new class($entries) implements EarthquakeFeedEntryRepositoryInterface
        {
            /**
             * @param  array<int, array<string, mixed>>  $entries
             */
            public function __construct(private readonly array $entries) {}

            public function isStorageReady(): bool
            {
                return true;
            }

            public function upsertFromExtractedEntries($entries): array
            {
                return [
                    'totalCount' => 0,
                    'insertedCount' => 0,
                    'updatedCount' => 0,
                    'skippedCount' => 0,
                    'failedCount' => 0,
                ];
            }

            public function latest(int $limit = 20): array
            {
                return [];
            }

            public function entriesForMapPinBuild(int $limit = 100): array
            {
                return $this->entries;
            }
        };
    }

    /**
     * @param  array<string, array<string, mixed>>  $transports
     */
    private function detailXmlRepositoryReturning(array $transports): EarthquakeDetailXmlRepositoryInterface
    {
        return new class($transports) implements EarthquakeDetailXmlRepositoryInterface
        {
            /**
             * @param  array<string, array<string, mixed>>  $transports
             */
            public function __construct(private readonly array $transports) {}

            public function fetch(string $url): array
            {
                return $this->transports[$url] ?? [
                    'endpoint' => $url,
                    'method' => 'GET',
                    'request_headers' => [],
                    'success' => false,
                    'status_code' => 500,
                    'fetched_at' => '2026-05-11T11:32:00+09:00',
                    'response_time_ms' => 12.3,
                    'body' => null,
                    'error_message' => 'unexpected test URL',
                ];
            }
        };
    }

    private function emptyMapPinRepository(): EarthquakeMapPinRepositoryInterface
    {
        return new class implements EarthquakeMapPinRepositoryInterface
        {
            public function isStorageReady(): bool
            {
                return true;
            }

            public function upsertFromMapPins(EarthquakeMapPinListDTO $pins): array
            {
                return [
                    'totalCount' => $pins->count(),
                    'insertedCount' => 0,
                    'updatedCount' => 0,
                    'skippedCount' => 0,
                    'failedCount' => 0,
                ];
            }

            public function latest(int $limit = 50): array
            {
                return [];
            }

            public function toMapPinListDTO(EarthquakeMapPinListQueryDTO $query): EarthquakeMapPinListDTO
            {
                return new EarthquakeMapPinListDTO([]);
            }
        };
    }

    private function transport(
        string $url,
        bool $success,
        ?int $statusCode,
        ?string $body,
        ?string $errorMessage,
    ): array {
        return [
            'endpoint' => $url,
            'method' => 'GET',
            'request_headers' => [],
            'success' => $success,
            'status_code' => $statusCode,
            'fetched_at' => '2026-05-11T11:32:00+09:00',
            'response_time_ms' => 12.3,
            'body' => $body,
            'error_message' => $errorMessage,
        ];
    }

    private function earthquakeReportXml(
        ?string $coordinate = '+41.0+142.5-50000/',
        ?string $maxIntensity = '5-',
    ): string {
        $coordinateNode = $coordinate === null
            ? ''
            : '<jmx_eb:Coordinate description="北緯４１．０度　東経１４２．５度　深さ　５０ｋｍ">'.$coordinate.'</jmx_eb:Coordinate>';
        $intensityNode = $maxIntensity === null
            ? ''
            : <<<XML
    <Intensity>
      <Observation>
        <MaxInt>{$maxIntensity}</MaxInt>
      </Observation>
    </Intensity>
XML;

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://xml.kishou.go.jp/jmaxml1/" xmlns:jmx="http://xml.kishou.go.jp/jmaxml1/">
  <Control>
    <Title>震源・震度に関する情報</Title>
    <DateTime>2026-05-11T02:31:20Z</DateTime>
    <Status>通常</Status>
    <EditorialOffice>気象庁本庁</EditorialOffice>
    <PublishingOffice>気象庁</PublishingOffice>
  </Control>
  <Head xmlns="http://xml.kishou.go.jp/jmaxml1/informationBasis1/">
    <Title>震源・震度情報</Title>
    <ReportDateTime>2026-05-11T11:31:00+09:00</ReportDateTime>
    <TargetDateTime>2026-05-11T11:31:00+09:00</TargetDateTime>
    <EventID>20260511112751</EventID>
    <InfoType>発表</InfoType>
    <Serial>1</Serial>
    <InfoKind>地震情報</InfoKind>
    <InfoKindVersion>1.0_1</InfoKindVersion>
    <Headline>
      <Text>１１日１１時２７分ころ、地震がありました。</Text>
    </Headline>
  </Head>
  <Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/seismology1/" xmlns:jmx_eb="http://xml.kishou.go.jp/jmaxml1/elementBasis1/">
    <Earthquake>
      <OriginTime>2026-05-11T11:27:00+09:00</OriginTime>
      <ArrivalTime>2026-05-11T11:27:00+09:00</ArrivalTime>
      <Hypocenter>
        <Area>
          <Name>青森県東方沖</Name>
          <Code type="震央地名">285</Code>
          {$coordinateNode}
        </Area>
      </Hypocenter>
      <jmx_eb:Magnitude type="Mj" description="Ｍ４．０">4.0</jmx_eb:Magnitude>
    </Earthquake>
{$intensityNode}
  </Body>
</Report>
XML;
    }

    private function nonSeismologyReportXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://xml.kishou.go.jp/jmaxml1/" xmlns:jmx="http://xml.kishou.go.jp/jmaxml1/">
  <Control>
    <Title>津波情報</Title>
    <DateTime>2026-05-11T02:31:20Z</DateTime>
    <Status>通常</Status>
    <EditorialOffice>気象庁本庁</EditorialOffice>
    <PublishingOffice>気象庁</PublishingOffice>
  </Control>
  <Head xmlns="http://xml.kishou.go.jp/jmaxml1/informationBasis1/">
    <Title>津波情報</Title>
    <ReportDateTime>2026-05-11T11:31:00+09:00</ReportDateTime>
    <TargetDateTime>2026-05-11T11:31:00+09:00</TargetDateTime>
    <InfoKind>津波情報</InfoKind>
  </Head>
  <Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/tsunami1/">
    <Tsunami>
      <Forecast>
        <Code>100</Code>
      </Forecast>
    </Tsunami>
  </Body>
</Report>
XML;
    }
}
