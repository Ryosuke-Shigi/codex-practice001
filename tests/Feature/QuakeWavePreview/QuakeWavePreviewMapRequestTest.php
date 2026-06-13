<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * QuakeWave map 表示 request の validation と Inertia props 境界を固定する Feature Test です。
 *
 * 日付形式の安全境界を Request に置き、無効入力時に外部 HTTP を呼ばないことを守ります。
 */
class QuakeWavePreviewMapRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_map_request_rejects_invalid_start_date_format(): void
    {
        Http::preventStrayRequests();

        $this
            ->from('/quakewave-preview/map')
            ->get(route('quakewave-preview.map', [
                'startDate' => '2026/05/11',
                'endDate' => '2026-05-11',
            ]))
            ->assertRedirect('/quakewave-preview/map')
            ->assertSessionHasErrors(['startDate']);

        Http::assertNothingSent();
    }

    public function test_map_request_rejects_invalid_end_date_format(): void
    {
        Http::preventStrayRequests();

        $this
            ->from('/quakewave-preview/map')
            ->get(route('quakewave-preview.map', [
                'startDate' => '2026-05-11',
                'endDate' => 'not-a-date',
            ]))
            ->assertRedirect('/quakewave-preview/map')
            ->assertSessionHasErrors(['endDate']);

        Http::assertNothingSent();
    }

    public function test_map_request_keeps_current_behavior_when_start_date_is_after_end_date(): void
    {
        Http::preventStrayRequests();
        $this->createMapPin();

        $response = $this->get(route('quakewave-preview.map', [
            'startDate' => '2026-05-12',
            'endDate' => '2026-05-11',
        ]));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/QuakeWaveMapPage', false)
                ->where('filters.startDate', '2026-05-12')
                ->where('filters.endDate', '2026-05-11')
                ->has('pins', 0)
            );

        Http::assertNothingSent();
    }

    public function test_map_request_uses_default_date_range_when_dates_are_missing(): void
    {
        Http::preventStrayRequests();
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-14 12:00:00', config('app.timezone')));

        try {
            $response = $this->get(route('quakewave-preview.map'));
        } finally {
            CarbonImmutable::setTestNow();
        }

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/QuakeWaveMapPage', false)
                ->where('filters.startDate', '2026-05-11')
                ->where('filters.endDate', '2026-05-14')
                ->has('pins', 0)
            );

        Http::assertNothingSent();
    }

    public function test_map_request_ignores_limit_query_and_keeps_internal_default_limit(): void
    {
        Http::preventStrayRequests();
        $this->createMapPins(101);

        foreach (['not-a-number', '0', '-1', '1000'] as $limit) {
            $response = $this->get(route('quakewave-preview.map', [
                'startDate' => '2026-05-11',
                'endDate' => '2026-05-11',
                'limit' => $limit,
            ]));

            $response
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('QuakeWavePreview/QuakeWaveMapPage', false)
                    ->where('filters.startDate', '2026-05-11')
                    ->where('filters.endDate', '2026-05-11')
                    ->has('pins', 100)
                );
        }

        Http::assertNothingSent();
    }

    public function test_map_request_date_range_includes_day_boundaries_and_uses_occurred_at_when_reported_at_is_null(): void
    {
        Http::preventStrayRequests();
        $sourceEntry = $this->createFeedEntry();

        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'reported-before-start',
            reportedAt: '2026-05-10 23:59:59',
            occurredAt: '2026-05-10 23:58:59',
        );
        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'reported-start-boundary',
            reportedAt: '2026-05-11 00:00:00',
            occurredAt: '2026-05-10 23:59:00',
        );
        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'reported-end-boundary',
            reportedAt: '2026-05-11 23:59:59',
            occurredAt: '2026-05-11 23:58:59',
        );
        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'reported-after-end',
            reportedAt: '2026-05-12 00:00:00',
            occurredAt: '2026-05-11 23:59:00',
        );
        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'occurred-before-start',
            reportedAt: null,
            occurredAt: '2026-05-10 23:59:59',
        );
        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'occurred-start-boundary',
            reportedAt: null,
            occurredAt: '2026-05-11 00:00:00',
        );
        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'occurred-end-boundary',
            reportedAt: null,
            occurredAt: '2026-05-11 23:59:59',
        );
        $this->createBoundaryMapPin(
            $sourceEntry,
            eventId: 'occurred-after-end',
            reportedAt: null,
            occurredAt: '2026-05-12 00:00:00',
        );

        $response = $this->get(route('quakewave-preview.map', [
            'startDate' => '2026-05-11',
            'endDate' => '2026-05-11',
        ]));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuakeWavePreview/QuakeWaveMapPage', false)
                ->where('filters.startDate', '2026-05-11')
                ->where('filters.endDate', '2026-05-11')
                ->has('pins', 4)
                ->where('pins.0.eventId', 'reported-end-boundary')
                ->where('pins.1.eventId', 'reported-start-boundary')
                ->where('pins.2.eventId', 'occurred-end-boundary')
                ->where('pins.3.eventId', 'occurred-start-boundary')
            );

        Http::assertNothingSent();
    }

    private function createMapPins(int $count = 1): void
    {
        $sourceEntry = $this->createFeedEntry();
        $baseTime = CarbonImmutable::parse('2026-05-11 02:00:00', config('app.timezone'));

        for ($index = 0; $index < $count; $index++) {
            $reportedAt = $baseTime->addSeconds($index);

            EarthquakeMapPin::query()->create([
                'event_id' => sprintf('2026051102%04d', $index),
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
                'occurred_at' => $reportedAt->subMinutes(4)->toDateTimeString(),
                'reported_at' => $reportedAt->toDateTimeString(),
                'comment' => '保存済み地震情報です。',
            ]);
        }
    }

    private function createBoundaryMapPin(
        EarthquakeFeedEntry $sourceEntry,
        string $eventId,
        ?string $reportedAt,
        string $occurredAt,
    ): void {
        EarthquakeMapPin::query()->create([
            'event_id' => $eventId,
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
            'occurred_at' => $this->dateTimeForStorage($occurredAt),
            'reported_at' => $reportedAt === null ? null : $this->dateTimeForStorage($reportedAt),
            'comment' => '保存済み地震情報です。',
        ]);
    }

    private function dateTimeForStorage(string $localDateTime): string
    {
        return CarbonImmutable::parse($localDateTime, config('app.timezone'))
            ->utc()
            ->toDateTimeString();
    }

    private function createMapPin(): void
    {
        $this->createMapPins();
    }

    private function createFeedEntry(): EarthquakeFeedEntry
    {
        return EarthquakeFeedEntry::query()->create([
            'entry_id' => 'urn:jma:example:map-request',
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
