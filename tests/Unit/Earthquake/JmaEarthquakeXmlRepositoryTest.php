<?php

namespace Tests\Unit\Earthquake;

use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use App\Repositories\Earthquake\JmaEarthquakeDetailXmlRepository;
use App\Repositories\Earthquake\JmaEarthquakeXmlRepository;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class JmaEarthquakeXmlRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Event::fake([ApplicationIntegrationLogged::class]);
    }

    public function test_feed_fetch_dispatches_success_integration_log(): void
    {
        Http::fake([
            JmaEarthquakeXmlRepository::FEED_URL => Http::response('<feed />', 200),
        ]);

        app(JmaEarthquakeXmlRepository::class)->fetchHighFrequencyFeed();

        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->serviceName === '気象庁XML'
                && $event->action === '高頻度フィード取得'
                && $event->status === 'success'
                && $event->targetId === 'feed'
                && $event->url === JmaEarthquakeXmlRepository::FEED_URL
                && $event->method === 'GET'
                && $event->responseStatus === 200,
        );
    }

    public function test_feed_fetch_dispatches_failed_integration_log_without_response_body(): void
    {
        Http::fake([
            JmaEarthquakeXmlRepository::FEED_URL => Http::response('upstream body should not be logged', 503),
        ]);

        app(JmaEarthquakeXmlRepository::class)->fetchHighFrequencyFeed();

        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === '高頻度フィード取得'
                && $event->status === 'failed'
                && $event->responseStatus === 503
                && str_contains((string) $event->message, '理由：取得先のサーバー側で障害が発生しています。')
                && ! str_contains((string) $event->message, 'upstream body should not be logged'),
        );
    }

    public function test_detail_xml_fetch_failure_result_includes_reason_without_response_body(): void
    {
        $url = 'https://www.data.jma.go.jp/developer/xml/data/missing.xml';
        Http::fake([
            $url => Http::response('not found body should not be logged', 404),
        ]);

        $result = app(JmaEarthquakeDetailXmlRepository::class)->fetch($url);

        $this->assertFalse($result['success']);
        $this->assertSame(404, $result['status_code']);
        $this->assertStringContainsString('理由：XMLファイルが見つかりません。', (string) $result['error_message']);
        $this->assertStringNotContainsString('not found body should not be logged', (string) $result['error_message']);
        Event::assertNotDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === '個別XML取得',
        );
    }

    public function test_detail_xml_fetch_returns_success_transport_without_dispatching_integration_log(): void
    {
        $url = 'https://www.data.jma.go.jp/developer/xml/data/20260511083000_0.xml';
        Http::fake([
            $url => Http::response('<Report />', 200),
        ]);

        $result = app(JmaEarthquakeDetailXmlRepository::class)->fetch($url);

        $this->assertTrue($result['success']);
        $this->assertSame(200, $result['status_code']);
        $this->assertSame('<Report />', $result['body']);
        Event::assertNotDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->action === '個別XML取得',
        );
    }

    public function test_rejected_detail_xml_url_does_not_dispatch_api_integration_log(): void
    {
        Http::preventStrayRequests();

        app(JmaEarthquakeDetailXmlRepository::class)->fetch('https://example.test/not-jma.xml');

        Event::assertNotDispatched(ApplicationIntegrationLogged::class);
        Http::assertNothingSent();
    }
}
