<?php

namespace Tests\Feature\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationErrorLogCreateDTO;
use App\DTO\ApplicationLog\ApplicationIntegrationLogCreateDTO;
use App\Repositories\ApplicationLog\ApplicationErrorLogRepositoryInterface;
use App\Repositories\ApplicationLog\ApplicationIntegrationLogRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ApplicationLogRepositoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_integration_logs_are_stored_separately_and_returned_newest_first(): void
    {
        $repository = app(ApplicationIntegrationLogRepositoryInterface::class);

        $repository->create(new ApplicationIntegrationLogCreateDTO(
            integrationType: 'external_api',
            serviceName: 'YouTube API',
            action: 'older action',
            status: 'success',
            message: '取得完了',
            targetType: null,
            targetId: null,
            externalId: null,
            url: null,
            method: 'GET',
            responseStatus: 200,
            userId: null,
            occurredAt: CarbonImmutable::parse('2026-06-18 10:00:00', 'UTC'),
        ));
        $repository->create(new ApplicationIntegrationLogCreateDTO(
            integrationType: 'external_api',
            serviceName: 'YouTube API',
            action: 'newer action',
            status: 'failed',
            message: 'rate limited',
            targetType: null,
            targetId: null,
            externalId: null,
            url: null,
            method: 'GET',
            responseStatus: 429,
            userId: null,
            occurredAt: CarbonImmutable::parse('2026-06-18 11:00:00', 'UTC'),
        ));

        $logs = $repository->latest(10);

        $this->assertSame('newer action', $logs[0]->action);
        $this->assertSame('older action', $logs[1]->action);
        $this->assertDatabaseCount('application_integration_logs', 2);
        $this->assertFalse(Schema::hasColumn('application_integration_logs', 'resolved_at'));
        $this->assertFalse(Schema::hasColumn('application_integration_logs', 'resolved_by'));
    }

    public function test_error_logs_are_stored_separately_returned_newest_first_and_resolved(): void
    {
        $repository = app(ApplicationErrorLogRepositoryInterface::class);

        $older = $repository->create(new ApplicationErrorLogCreateDTO(
            level: 'warning',
            errorCode: null,
            message: 'older warning',
            exceptionClass: null,
            file: 'app/Actions/OlderAction.php',
            line: 42,
            url: null,
            method: 'GET',
            userId: null,
            occurredAt: CarbonImmutable::parse('2026-06-18 09:00:00', 'UTC'),
        ));
        $newer = $repository->create(new ApplicationErrorLogCreateDTO(
            level: 'error',
            errorCode: 'dance-radar.aggregate.failed',
            message: 'newer error',
            exceptionClass: 'RuntimeException',
            file: 'app/Services/DanceShortsRadarService.php',
            line: 128,
            url: null,
            method: 'GET',
            userId: null,
            occurredAt: CarbonImmutable::parse('2026-06-18 12:00:00', 'UTC'),
        ));

        $logs = $repository->latest(10);
        $resolved = $repository->resolve(
            $newer,
            resolvedBy: null,
            resolvedAt: CarbonImmutable::parse('2026-06-18 13:00:00', 'UTC'),
        );

        $this->assertTrue($older->isNot($newer));
        $this->assertSame('newer error', $logs[0]->message);
        $this->assertSame('older warning', $logs[1]->message);
        $this->assertNotNull($resolved->resolved_at);
        $this->assertDatabaseHas('application_error_logs', [
            'id' => $newer->getKey(),
            'resolved_at' => '2026-06-18 13:00:00',
        ]);
        $this->assertDatabaseCount('application_error_logs', 2);
    }
}
