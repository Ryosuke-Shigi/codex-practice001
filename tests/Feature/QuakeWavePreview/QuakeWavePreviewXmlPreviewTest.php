<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Jobs\Earthquake\RefreshEarthquakeMapDataJob;
use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
use App\Repositories\Earthquake\JmaEarthquakeXmlRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
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
                ->where('mocks.0.href', '/quakewave-preview/map/mock')
                ->where('mocks.0.title', '地震情報MAPモック')
                ->where('mocks.0.status', 'Mock')
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
        EarthquakeMapPin::query()->create([
            'event_id' => '20260510000100',
            'source_entry_id' => $sourceEntry->getKey(),
            'title' => '震源・震度情報',
            'area_name' => '期間外',
            'headline' => '期間外の保存済み地震情報です。',
            'raw_coordinate' => '+40.0+142.0-30000/',
            'latitude' => '40.0000000',
            'longitude' => '142.0000000',
            'depth_meter' => 30000,
            'magnitude' => '3.5',
            'max_intensity' => '2',
            'occurred_at' => '2026-05-10 14:00:00',
            'reported_at' => '2026-05-10 14:00:00',
            'comment' => '日付範囲外です。',
        ]);

        $response = $this->get('/quakewave-preview/map?startDate=2026-05-11&endDate=2026-05-11');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/QuakeWaveMapPage', false)
                ->has('pins', 1)
                ->where('filters.startDate', '2026-05-11')
                ->where('filters.endDate', '2026-05-11')
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
                ->component('QuakeWavePreview/QuakeWaveMapPage', false)
                ->has('pins', 0)
            );

        Http::assertNothingSent();
    }

    public function test_map_refresh_post_creates_feed_and_map_pin_runs_and_dispatches_queue_job(): void
    {
        Http::preventStrayRequests();
        Queue::fake();

        $response = $this->postJson('/quakewave-preview/map/refresh');

        $response
            ->assertOk()
            ->assertJsonPath('feedEntrySyncRunId', 1)
            ->assertJsonPath('mapPinSyncRunId', 1)
            ->assertJsonPath('feedEntrySyncStatus.syncRunId', 1)
            ->assertJsonPath('feedEntrySyncStatus.status', 'pending')
            ->assertJsonPath('mapPinSyncStatus.syncRunId', 1)
            ->assertJsonPath('mapPinSyncStatus.status', 'pending');

        $this->assertDatabaseHas('earthquake_feed_entry_sync_runs', [
            'id' => 1,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('earthquake_map_pin_sync_runs', [
            'id' => 1,
            'status' => 'pending',
        ]);

        Queue::assertPushed(
            RefreshEarthquakeMapDataJob::class,
            fn (RefreshEarthquakeMapDataJob $job): bool => $job->feedEntrySyncRunId === 1
                && $job->mapPinSyncRunId === 1,
        );
        Http::assertNothingSent();
    }

    public function test_map_frontend_contains_layer_controls_and_plate_boundary_layer(): void
    {
        $mapSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/JapanQuakeWaveMap.tsx'));
        $mapPageSource = file_get_contents(resource_path('js/Pages/QuakeWavePreview/QuakeWaveMapPage.tsx'));
        $visiblePinsHookSource = file_get_contents(resource_path('js/Pages/QuakeWavePreview/hooks/useVisibleEarthquakePins.ts'));
        $refreshHookSource = file_get_contents(resource_path('js/Pages/QuakeWavePreview/hooks/useQuakeMapRefresh.ts'));
        $simpleMapSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/JapanSimpleMap.tsx'));
        $projectionSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/mapProjection.ts'));
        $controlSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/MapLayerControlPanel.tsx'));
        $refreshSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/MapRefreshPanel.tsx'));
        $detailSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/EarthquakeMapDetailPanel.tsx'));
        $dateRangeSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/QuakeDateRangeFilter.tsx'));
        $intensitySource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/QuakeIntensitySwitchFilter.tsx'));
        $verticalSwitchSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/VerticalIntensitySwitch.tsx'));
        $sliderSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/PinDisplayLimitSlider.tsx'));
        $plateSource = file_get_contents(resource_path('js/Components/JapanQuakeWaveMap/PlateBoundaryLayer.tsx'));
        $mockPageSource = file_get_contents(resource_path('js/Pages/QuakeWavePreview/JapanQuakeWaveMapMockPage.tsx'));
        $plateGeoJson = json_decode(
            (string) file_get_contents(public_path('data/plate-boundaries.geojson')),
            true,
            512,
            JSON_THROW_ON_ERROR,
        );

        $this->assertIsString($mapSource);
        $this->assertIsString($mapPageSource);
        $this->assertIsString($visiblePinsHookSource);
        $this->assertIsString($refreshHookSource);
        $this->assertIsString($simpleMapSource);
        $this->assertIsString($projectionSource);
        $this->assertIsString($controlSource);
        $this->assertIsString($refreshSource);
        $this->assertIsString($detailSource);
        $this->assertIsString($dateRangeSource);
        $this->assertIsString($intensitySource);
        $this->assertIsString($verticalSwitchSource);
        $this->assertIsString($sliderSource);
        $this->assertIsString($plateSource);
        $this->assertIsString($mockPageSource);
        $this->assertSame('FeatureCollection', $plateGeoJson['type']);
        $this->assertNotEmpty($plateGeoJson['features']);
        $this->assertStringContainsString('MapLayerControlPanel', $mapSource);
        $this->assertStringContainsString('MapRefreshPanel', $mapSource);
        $this->assertStringContainsString('isRefreshPanelOpen', $refreshSource);
        $this->assertStringContainsString('地図データ更新', $refreshSource);
        $this->assertStringContainsString('aria-expanded', $refreshSource);
        $this->assertStringNotContainsString('sourceLabel', $mapSource.$mapPageSource.$mockPageSource);
        $this->assertStringContainsString('useVisibleEarthquakePins', $mapPageSource);
        $this->assertStringContainsString('useQuakeMapRefresh', $mapPageSource);
        $this->assertStringNotContainsString('function pickVisiblePins', $mapPageSource);
        $this->assertStringNotContainsString('axios.', $mapPageSource);
        $this->assertStringContainsString('pickVisiblePins', $visiblePinsHookSource);
        $this->assertStringContainsString('comparePinsForDisplay', $visiblePinsHookSource);
        $this->assertStringContainsString('pinTimestamp', $visiblePinsHookSource);
        $this->assertStringContainsString('pinKey', $visiblePinsHookSource);
        $this->assertStringContainsString('/quakewave-preview/map/refresh', $refreshHookSource);
        $this->assertStringContainsString('/quakewave-preview/map', $refreshHookSource);
        $this->assertStringContainsString('/quakewave-preview/feed-entries/sync/status', $refreshHookSource);
        $this->assertStringContainsString('/quakewave-preview/map-pins/sync/status', $refreshHookSource);
        $this->assertStringContainsString('地図データ更新', $refreshHookSource);
        $this->assertStringContainsString('QuakeDateRangeFilter', $mapPageSource);
        $this->assertStringContainsString('QuakeIntensitySwitchFilter', $mapPageSource);
        $this->assertStringContainsString("only: ['pins', 'filters']", $mapPageSource);
        $this->assertStringNotContainsString('function JapanQuakeWaveMapMock', $mapSource);
        $this->assertStringContainsString('JapanQuakeWaveMapMockPage', $mockPageSource);
        $this->assertStringContainsString('EarthquakePin', $mockPageSource);
        $this->assertStringContainsString('EarthquakeRipple', $mockPageSource);
        $this->assertStringContainsString('Parts Mock', $mockPageSource);
        $this->assertStringContainsString('QuakeDateRangeFilter', $mockPageSource);
        $this->assertStringContainsString('QuakeIntensitySwitchFilter', $mockPageSource);
        $this->assertStringContainsString('selectedIntensities', $mockPageSource);
        $this->assertStringContainsString('quakeIntensitySortRank', $mockPageSource);
        $this->assertStringContainsString('showPlateBoundaries', $simpleMapSource);
        $this->assertStringNotContainsString('EarthquakeMapDetailPanel', $simpleMapSource);
        $this->assertStringContainsString('mapProjectionBounds', $projectionSource);
        $this->assertStringContainsString('projectCoordinateToMap', $simpleMapSource);
        $this->assertStringContainsString('projectCoordinateToMap', $plateSource);
        $this->assertStringContainsString('/data/plate-boundaries.geojson', $plateSource);
        $this->assertStringContainsString('LineString', $plateSource);
        $this->assertStringContainsString('MultiLineString', $plateSource);
        $this->assertStringNotContainsString('plateBoundaryPaths', $plateSource);
        $this->assertStringContainsString('MAP LAYERS', $controlSource);
        $this->assertStringContainsString('activeLayerCount', $controlSource);
        $this->assertStringContainsString('aria-expanded', $controlSource);
        $this->assertStringContainsString('震源ピン', $controlSource);
        $this->assertStringContainsString('波紋', $controlSource);
        $this->assertStringContainsString('震度表示', $controlSource);
        $this->assertStringContainsString('プレート境界線', $controlSource);
        $this->assertStringContainsString('マグニチュード', $detailSource);
        $this->assertStringContainsString('最大震度', $detailSource);
        $this->assertStringContainsString('深さ', $detailSource);
        $this->assertStringContainsString('areaName', $detailSource);
        $this->assertStringContainsString('詳細を開く', $detailSource);
        $this->assertStringContainsString('詳細を閉じる', $detailSource);
        $this->assertStringContainsString('日付範囲', $dateRangeSource);
        $this->assertStringContainsString('開始日', $dateRangeSource);
        $this->assertStringContainsString('終了日', $dateRangeSource);
        $this->assertStringNotContainsString('適用', $dateRangeSource);
        $this->assertStringNotContainsString('DATE RANGE', $dateRangeSource);
        $this->assertStringContainsString('震度フィルター', $intensitySource);
        $this->assertStringContainsString('6強', $intensitySource);
        $this->assertStringContainsString('6弱', $intensitySource);
        $this->assertStringContainsString('不明', $intensitySource);
        $this->assertStringNotContainsString('INTENSITY FILTER', $intensitySource);
        $this->assertStringNotContainsString('ON {selectedIntensities.length}件', $intensitySource);
        $this->assertStringContainsString('role="switch"', $verticalSwitchSource);
        $this->assertStringContainsString('PIN_DISPLAY_LIMIT_MAX = 45', $sliderSource);
        $this->assertStringNotContainsString('occurred', $detailSource);
        $this->assertStringNotContainsString('reported', $detailSource);
        $this->assertStringContainsString('stroke="#fde047"', $plateSource);
    }

    public function test_map_mock_page_uses_mock_page_component_without_db_pins_props(): void
    {
        Http::preventStrayRequests();

        $this
            ->get('/quakewave-preview/map/mock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/JapanQuakeWaveMapMockPage', false)
                ->missing('pins')
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
                ->where('result.error.message', '気象庁 高頻度フィードの取得先がエラーを返しました。理由：取得先のサーバー側で障害が発生しています。')
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
