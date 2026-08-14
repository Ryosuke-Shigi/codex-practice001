<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuakeWaveMapPagePropsTest extends TestCase
{
    use RefreshDatabase;

    public function test_map_route_passes_saved_earthquake_pins_as_inertia_props(): void
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

        $response = $this->get(route('quakewave-preview.map', [
            'startDate' => '2026-05-11',
            'endDate' => '2026-05-11',
        ]));

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
                ->where('pins.0.areaName', '青森県東方沖')
                ->where('pins.0.headline', '１１日１１時２７分ころ、地震がありました。')
                ->where('pins.0.rawCoordinate', '+41.0+142.5-50000/')
                ->where('pins.0.latitude', '41.0000000')
                ->where('pins.0.longitude', '142.5000000')
                ->where('pins.0.depthMeter', 50000)
                ->where('pins.0.magnitude', '4.0')
                ->where('pins.0.maxIntensity', '5-')
                ->where('pins.0.occurredAt', '2026-05-11T02:27:00+09:00')
                ->where('pins.0.reportedAt', '2026-05-11T02:31:00+09:00')
                ->where('pins.0.comment', '保存済み地震情報です。')
            );

        Http::assertNothingSent();
    }

    public function test_map_route_keeps_same_props_shape_when_no_pins_are_saved(): void
    {
        Http::preventStrayRequests();

        $response = $this->get(route('quakewave-preview.map', [
            'startDate' => '2026-05-11',
            'endDate' => '2026-05-11',
        ]));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/QuakeWaveMapPage', false)
                ->has('pins', 0)
                ->where('filters.startDate', '2026-05-11')
                ->where('filters.endDate', '2026-05-11')
            );

        Http::assertNothingSent();
    }

    public function test_product_page_uses_static_aqua_background_and_product_only_compact_map_contract(): void
    {
        $source = file_get_contents(resource_path('js/Pages/QuakeWavePreview/QuakeWaveMapPage.tsx'));

        $this->assertIsString($source);
        $this->assertStringContainsString('withEffect={false}', $source);
        $this->assertStringContainsString('#164e63_0%,#0891b2_48%,#0e7490_100%', $source);
        $this->assertStringNotContainsString('rgba(255,255,255,0.72)', $source);
        $this->assertStringContainsString('showIntroduction={false}', $source);
        $this->assertStringContainsString('compactRefreshPanel', $source);
        $this->assertStringContainsString('detailPanelPlacement="below"', $source);
        $this->assertStringNotContainsString('detailPanelPlacement="afterControls"', $source);
        $this->assertStringContainsString('mapBottomContent', $source);
        $this->assertStringNotContainsString('title="地震情報可視化"', $source);
        $this->assertStringNotContainsString('DBに保存済みの地震情報を日本地図上へ重ね', $source);
    }

    private function createFeedEntry(): EarthquakeFeedEntry
    {
        return EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:example:map-props',
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
