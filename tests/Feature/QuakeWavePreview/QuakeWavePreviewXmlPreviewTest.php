<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
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
                ->has('savedMapPins', 0)
                ->where('mapPinSyncStatus', null)
                ->has('mapPinSyncRuns', 0)
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

    public function test_map_preview_reads_saved_earthquake_map_pins_as_inertia_props(): void
    {
        Http::preventStrayRequests();
        $sourceEntry = $this->createFeedEntry();
        EarthquakeMapPin::query()->create([
            'event_id' => '20260511112751',
            'source_entry_id' => $sourceEntry->getKey(),
            'title' => '震源・震度情報',
            'area_name' => '青森県東方沖',
            'headline' => '１１日１１時２７分ころ、地震がありました。',
            'raw_coordinate' => '+41.0+142.5-50000/',
            'latitude' => '41.0000000',
            'longitude' => '142.5000000',
            'depth_meter' => 50000,
            'magnitude' => '4.0',
            'max_intensity' => '5-',
            'occurred_at' => '2026-05-11 02:27:00',
            'reported_at' => '2026-05-11 02:31:00',
            'comment' => '保存済み地震情報です。',
        ]);

        $response = $this->get('/quakewave-preview/map');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/Map', false)
                ->has('pins', 1)
                ->where('pins.0.eventId', '20260511112751')
                ->where('pins.0.sourceEntryId', $sourceEntry->getKey())
                ->where('pins.0.title', '震源・震度情報')
                ->where('pins.0.latitude', '41.0000000')
                ->where('pins.0.longitude', '142.5000000')
                ->where('pins.0.maxIntensity', '5-')
                ->where('pins.0.magnitude', '4.0')
                ->where('pins.0.depthMeter', 50000)
                ->where('pins.0.areaName', '青森県東方沖')
                ->where('pins.0.rawCoordinate', '+41.0+142.5-50000/')
                ->where('pins.0.comment', '保存済み地震情報です。')
            );

        Http::assertNothingSent();
    }

    public function test_map_preview_returns_empty_pins_when_no_map_pins_are_saved(): void
    {
        Http::preventStrayRequests();

        $response = $this->get('/quakewave-preview/map');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/Map', false)
                ->has('pins', 0)
            );

        Http::assertNothingSent();
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

    private function createFeedEntry(): EarthquakeFeedEntry
    {
        return EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:example:map-source',
            'title' => '震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511113100_0.xml',
            'updated_at_from_feed' => '2026-05-11 02:31:00',
            'published_at_from_feed' => '2026-05-11 02:30:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-11 02:31:30',
        ]);
    }
}
