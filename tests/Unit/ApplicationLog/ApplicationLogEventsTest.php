<?php

namespace Tests\Unit\ApplicationLog;

use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class ApplicationLogEventsTest extends TestCase
{
    public function test_application_error_occurred_holds_only_error_fact_values(): void
    {
        $occurredAt = CarbonImmutable::parse('2026-06-18 10:00:00', 'Asia/Tokyo');
        $exception = new RuntimeException('DanceShortsRadar failed.');
        $event = new ApplicationErrorOccurred(
            level: 'error',
            message: 'DanceShortsRadar集計で例外発生',
            errorCode: 'dance-radar.aggregate.failed',
            exception: $exception,
            file: '/var/www/api-discovery-hub/src/app/Services/DanceShortsRadarService.php',
            line: 128,
            url: 'https://example.test/dance-shorts-radar',
            method: 'GET',
            userId: 10,
            occurredAt: $occurredAt,
        );

        $this->assertSame('error', $event->level);
        $this->assertSame('DanceShortsRadar集計で例外発生', $event->message);
        $this->assertSame('dance-radar.aggregate.failed', $event->errorCode);
        $this->assertSame(RuntimeException::class, $event->exceptionClass);
        $this->assertSame('/var/www/api-discovery-hub/src/app/Services/DanceShortsRadarService.php', $event->file);
        $this->assertSame(128, $event->line);
        $this->assertSame('https://example.test/dance-shorts-radar', $event->url);
        $this->assertSame('GET', $event->method);
        $this->assertSame(10, $event->userId);
        $this->assertSame($occurredAt, $event->occurredAt);
        $this->assertFalse(property_exists($event, 'repository'));
        $this->assertFalse(property_exists($event, 'model'));
        $this->assertFalse(property_exists($event, 'exception'));
    }

    public function test_application_integration_logged_holds_only_api_integration_fact_values(): void
    {
        $occurredAt = CarbonImmutable::parse('2026-06-18 11:00:00', 'Asia/Tokyo');
        $event = new ApplicationIntegrationLogged(
            integrationType: 'external_api',
            serviceName: 'YouTube API',
            action: 'rising candidates',
            status: 'success',
            message: '取得完了',
            targetType: 'dance_short_search_keyword',
            targetId: '12',
            externalId: 'request-001',
            url: 'https://www.googleapis.test/youtube/v3/search',
            method: 'GET',
            responseStatus: 200,
            userId: 5,
            occurredAt: $occurredAt,
        );

        $this->assertSame('external_api', $event->integrationType);
        $this->assertSame('YouTube API', $event->serviceName);
        $this->assertSame('rising candidates', $event->action);
        $this->assertSame('success', $event->status);
        $this->assertSame('取得完了', $event->message);
        $this->assertSame('dance_short_search_keyword', $event->targetType);
        $this->assertSame('12', $event->targetId);
        $this->assertSame('request-001', $event->externalId);
        $this->assertSame('https://www.googleapis.test/youtube/v3/search', $event->url);
        $this->assertSame('GET', $event->method);
        $this->assertSame(200, $event->responseStatus);
        $this->assertSame(5, $event->userId);
        $this->assertSame($occurredAt, $event->occurredAt);
        $this->assertFalse(property_exists($event, 'repository'));
        $this->assertFalse(property_exists($event, 'model'));
    }
}
