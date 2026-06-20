<?php

namespace Tests\Unit\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationErrorLogCreateDTO;
use App\DTO\ApplicationLog\ApplicationIntegrationLogCreateDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use App\Listeners\ApplicationLog\StoreApplicationErrorLogListener;
use App\Listeners\ApplicationLog\StoreApplicationIntegrationLogListener;
use App\Models\ApplicationErrorLog;
use App\Models\ApplicationIntegrationLog;
use App\Repositories\ApplicationLog\ApplicationErrorLogRepositoryInterface;
use App\Repositories\ApplicationLog\ApplicationIntegrationLogRepositoryInterface;
use App\Services\ApplicationLog\ApplicationLogSanitizerService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Tests\TestCase;

class ApplicationLogListenerTest extends TestCase
{
    public function test_error_listener_stores_error_log_through_repository_with_sanitized_values(): void
    {
        $repository = new FakeApplicationErrorLogRepository;
        $listener = new StoreApplicationErrorLogListener(
            $repository,
            new ApplicationLogSanitizerService,
        );

        $listener->handle(new ApplicationErrorOccurred(
            level: 'debug',
            message: 'token=secret-token user@example.test',
            errorCode: 'api_key=secret-key',
            file: base_path('app/Services/DanceShortsRadarService.php'),
            line: 128,
            url: 'https://example.test/path?token=secret-query',
            method: 'get',
            occurredAt: CarbonImmutable::parse('2026-06-18 12:00:00', 'Asia/Tokyo'),
        ));

        $this->assertInstanceOf(ApplicationErrorLogCreateDTO::class, $repository->created);
        $this->assertSame('error', $repository->created->level);
        $this->assertSame('app/Services/DanceShortsRadarService.php', $repository->created->file);
        $this->assertSame('GET', $repository->created->method);
        $this->assertStringNotContainsString('secret-token', $repository->created->message);
        $this->assertStringNotContainsString('secret-key', (string) $repository->created->errorCode);
        $this->assertStringNotContainsString('secret-query', (string) $repository->created->url);
    }

    public function test_integration_listener_stores_api_log_through_repository_without_payload_or_secrets(): void
    {
        $repository = new FakeApplicationIntegrationLogRepository;
        $listener = new StoreApplicationIntegrationLogListener(
            $repository,
            new ApplicationLogSanitizerService,
        );

        $listener->handle(new ApplicationIntegrationLogged(
            integrationType: 'external_api',
            serviceName: 'YouTube API',
            action: 'rising candidates',
            status: 'timeout',
            message: 'Authorization:Bearer abc.def response={"secret":"body"}',
            url: 'https://www.googleapis.test/youtube/v3/search?key=secret-key&q=dance',
            method: 'get',
            responseStatus: 429,
            occurredAt: CarbonImmutable::parse('2026-06-18 12:10:00', 'Asia/Tokyo'),
        ));

        $this->assertInstanceOf(ApplicationIntegrationLogCreateDTO::class, $repository->created);
        $this->assertSame('pending', $repository->created->status);
        $this->assertSame('GET', $repository->created->method);
        $this->assertSame(429, $repository->created->responseStatus);
        $this->assertStringNotContainsString('abc.def', (string) $repository->created->message);
        $this->assertStringNotContainsString('secret-key', (string) $repository->created->url);
        $this->assertStringContainsString('q=dance', (string) $repository->created->url);
    }
}

final class FakeApplicationErrorLogRepository implements ApplicationErrorLogRepositoryInterface
{
    public ?ApplicationErrorLogCreateDTO $created = null;

    public function create(ApplicationErrorLogCreateDTO $dto): ApplicationErrorLog
    {
        $this->created = $dto;

        return new ApplicationErrorLog($dto->toArray());
    }

    public function latest(int $limit): Collection
    {
        return new Collection;
    }

    public function findById(int $id): ?ApplicationErrorLog
    {
        return null;
    }

    public function resolve(ApplicationErrorLog $log, ?int $resolvedBy, CarbonInterface $resolvedAt): ApplicationErrorLog
    {
        return $log;
    }
}

final class FakeApplicationIntegrationLogRepository implements ApplicationIntegrationLogRepositoryInterface
{
    public ?ApplicationIntegrationLogCreateDTO $created = null;

    public function create(ApplicationIntegrationLogCreateDTO $dto): ApplicationIntegrationLog
    {
        $this->created = $dto;

        return new ApplicationIntegrationLog($dto->toArray());
    }

    public function latest(int $limit): Collection
    {
        return new Collection;
    }
}
