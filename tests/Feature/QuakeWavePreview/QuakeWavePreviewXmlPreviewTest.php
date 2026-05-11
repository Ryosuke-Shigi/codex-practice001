<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Repositories\Earthquake\JmaEarthquakeXmlRepository;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuakeWavePreviewXmlPreviewTest extends TestCase
{
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
}
