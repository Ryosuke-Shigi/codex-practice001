<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Repositories\Earthquake\JmaEarthquakeXmlRepository;
use Illuminate\Http\Client\Request;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuakeWavePreviewXmlPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_quakewave_preview_index_lists_map_and_xml_preview_cards(): void
    {
        Http::preventStrayRequests();

        $response = $this->get('/quakewave-preview');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/Index', false)
                ->has('mocks', 2)
                ->where('mocks.0.id', 'map-display')
                ->where('mocks.0.href', '/quakewave-preview/map')
                ->where('mocks.1.id', 'xml-preview')
                ->where('mocks.1.title', 'XML取得プレビュー')
                ->where('mocks.1.href', '/quakewave-preview/xml')
                ->has('visualPreview.pins', 4)
                ->where('visualPreview.pins.0.label', '震度7')
                ->where('visualPreview.pins.0.maxIntensity', '7')
                ->where('visualPreview.pins.0.color', '#ef4444')
                ->where('visualPreview.pins.0.sizeLabel', 'large')
                ->has('visualPreview.ripples', 3)
                ->where('visualPreview.ripples.0.label', '強い波紋')
                ->where('visualPreview.ripples.0.maxIntensity', '7')
                ->where('visualPreview.ripples.0.color', '#ef4444')
                ->where('visualPreview.ripples.0.size', 112)
                ->where('visualPreview.ripples.0.duration', '1.6s')
                ->where('visualPreview.ripples.0.ringCount', 4)
                ->has('savedFeedEntries', 0)
                ->where('feedEntrySyncStatus', null)
                ->has('feedEntrySyncRuns', 0)
            );

        Http::assertNothingSent();
    }

    public function test_xml_preview_fetches_jma_atom_feed_and_shapes_entries(): void
    {
        Http::fake([
            JmaEarthquakeXmlRepository::FEED_URL => Http::response($this->atomFeed(), 200, [
                'Content-Type' => 'application/atom+xml',
            ]),
        ]);

        $response = $this->get('/quakewave-preview/xml');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/XmlPreview', false)
                ->where('result.success', true)
                ->where('result.statusCode', 200)
                ->where('result.error', null)
                ->where('result.feed.feedTitle', 'JMA Earthquake and Volcano Feed')
                ->where('result.feed.feedUpdatedAt', '2026-05-11T08:30:00+09:00')
                ->where('result.feed.entries.count', 2)
                ->where('result.feed.entries.items.0.id', 'urn:jma:example:1')
                ->where('result.feed.entries.items.0.title', '震源・震度に関する情報')
                ->where('result.feed.entries.items.0.updatedAt', '2026-05-11T08:30:00+09:00')
                ->where('result.feed.entries.items.0.publishedAt', '2026-05-11T08:25:00+09:00')
                ->where('result.feed.entries.items.0.xmlUrl', 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml')
                ->where('result.feed.entries.items.0.rawCategory', '地震情報 (地震火山関連)')
                ->where('result.feed.entries.items.0.rawAuthor', '気象庁')
            );

        Http::assertSent(fn (Request $request) => $request->url() === JmaEarthquakeXmlRepository::FEED_URL
            && $request->method() === 'GET'
            && $request->hasHeader('Accept', 'application/atom+xml, application/xml;q=0.9, text/xml;q=0.8'));
    }

    public function test_map_preview_fetches_latest_jma_atom_entry_once(): void
    {
        Http::fake([
            JmaEarthquakeXmlRepository::FEED_URL => Http::response($this->atomFeedWithNewerSecondEntry(), 200, [
                'Content-Type' => 'application/atom+xml',
            ]),
            'https://www.data.jma.go.jp/developer/xml/data/20260511090500_0.xml' => Http::response($this->earthquakeReportXml(), 200, [
                'Content-Type' => 'application/xml',
            ]),
        ]);

        $response = $this->get('/quakewave-preview/map');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/Map', false)
                ->has('pins', 1)
                ->where('pins.0.eventId', '20260511112751')
                ->where('pins.0.title', '震源・震度に関する最新情報')
                ->where('pins.0.latitude', 41)
                ->where('pins.0.longitude', 142.5)
                ->where('pins.0.maxIntensity', '1')
                ->where('pins.0.magnitude', 4)
                ->where('pins.0.depthKm', 50)
                ->where('pins.0.areaName', '青森県東方沖')
                ->where('latestFeedEntryPreview.success', true)
                ->where('latestFeedEntryPreview.statusCode', 200)
                ->where('latestFeedEntryPreview.error', null)
                ->where('latestFeedEntryPreview.feedTitle', 'JMA Earthquake and Volcano Feed')
                ->where('latestFeedEntryPreview.feedUpdatedAt', '2026-05-11T09:10:00+09:00')
                ->where('latestFeedEntryPreview.entryCount', 2)
                ->where('latestFeedEntryPreview.entry.id', 'urn:jma:example:newer')
                ->where('latestFeedEntryPreview.entry.title', '震源・震度に関する最新情報')
                ->where('latestFeedEntryPreview.entry.updatedAt', '2026-05-11T09:05:00+09:00')
                ->where('latestFeedEntryPreview.entry.xmlUrl', 'https://www.data.jma.go.jp/developer/xml/data/20260511090500_0.xml')
                ->where('latestFeedEntryPreview.earthquake.eventId', '20260511112751')
                ->where('latestFeedEntryPreview.earthquake.latitude', 41)
                ->where('latestFeedEntryPreview.earthquake.longitude', 142.5)
                ->where('latestFeedEntryPreview.earthquake.maxIntensity', '1')
            );

        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request) => $request->url() === JmaEarthquakeXmlRepository::FEED_URL
            && $request->method() === 'GET'
            && $request->hasHeader('Accept', 'application/atom+xml, application/xml;q=0.9, text/xml;q=0.8'));
        Http::assertSent(fn (Request $request) => $request->url() === 'https://www.data.jma.go.jp/developer/xml/data/20260511090500_0.xml'
            && $request->method() === 'GET'
            && $request->hasHeader('Accept', 'application/atom+xml, application/xml;q=0.9, text/xml;q=0.8'));
    }

    public function test_xml_preview_shows_safe_error_when_feed_request_fails(): void
    {
        Http::fake([
            JmaEarthquakeXmlRepository::FEED_URL => Http::response('upstream unavailable', 503),
        ]);

        $response = $this->get('/quakewave-preview/xml');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/XmlPreview', false)
                ->where('result.success', false)
                ->where('result.statusCode', 503)
                ->where('result.feed', null)
                ->where('result.error.status', 503)
                ->where('result.error.message', 'JMA earthquake XML feed request failed. Status: 503')
            );
    }

    private function atomFeed(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>JMA Earthquake and Volcano Feed</title>
  <updated>2026-05-11T08:30:00+09:00</updated>
  <entry>
    <id>urn:jma:example:1</id>
    <title>震源・震度に関する情報</title>
    <updated>2026-05-11T08:30:00+09:00</updated>
    <published>2026-05-11T08:25:00+09:00</published>
    <link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml" />
    <category term="地震火山関連" label="地震情報" />
    <author>
      <name>気象庁</name>
    </author>
  </entry>
  <entry>
    <id>urn:jma:example:2</id>
    <title>火山の状況に関する解説情報</title>
    <updated>2026-05-11T08:15:00+09:00</updated>
    <published>2026-05-11T08:10:00+09:00</published>
    <link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/20260511081500_0.xml" />
    <author>
      <name>気象庁</name>
    </author>
  </entry>
</feed>
XML;
    }

    private function atomFeedWithNewerSecondEntry(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>JMA Earthquake and Volcano Feed</title>
  <updated>2026-05-11T09:10:00+09:00</updated>
  <entry>
    <id>urn:jma:example:older</id>
    <title>震源・震度に関する古い情報</title>
    <updated>2026-05-11T08:45:00+09:00</updated>
    <published>2026-05-11T08:40:00+09:00</published>
    <link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/20260511084500_0.xml" />
    <category term="地震火山関連" label="地震情報" />
    <author>
      <name>気象庁</name>
    </author>
  </entry>
  <entry>
    <id>urn:jma:example:newer</id>
    <title>震源・震度に関する最新情報</title>
    <updated>2026-05-11T09:05:00+09:00</updated>
    <published>2026-05-11T09:00:00+09:00</published>
    <link rel="alternate" type="application/xml" href="https://www.data.jma.go.jp/developer/xml/data/20260511090500_0.xml" />
    <category term="地震火山関連" label="地震情報" />
    <author>
      <name>気象庁</name>
    </author>
  </entry>
</feed>
XML;
    }

    private function earthquakeReportXml(): string
    {
        return <<<'XML'
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
          <jmx_eb:Coordinate description="北緯４１．０度　東経１４２．５度　深さ　５０ｋｍ">+41.0+142.5-50000/</jmx_eb:Coordinate>
        </Area>
      </Hypocenter>
      <jmx_eb:Magnitude type="Mj" description="Ｍ４．０">4.0</jmx_eb:Magnitude>
    </Earthquake>
    <Intensity>
      <Observation>
        <MaxInt>1</MaxInt>
      </Observation>
    </Intensity>
  </Body>
</Report>
XML;
    }
}
