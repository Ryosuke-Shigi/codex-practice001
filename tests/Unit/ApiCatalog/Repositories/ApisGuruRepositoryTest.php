<?php

namespace Tests\Unit\ApiCatalog\Repositories;

use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use App\Repositories\ApiCatalog\ApisGuruRepository;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class ApisGuruRepositoryTest extends TestCase
{
    private const LIST_URL = 'https://api.apis.guru/v2/list.json';

    protected function setUp(): void
    {
        parent::setUp();

        Event::fake([
            ApplicationErrorOccurred::class,
            ApplicationIntegrationLogged::class,
        ]);
    }

    public function test_fetch_list_dispatches_success_integration_log(): void
    {
        Http::fake([
            self::LIST_URL => Http::response([
                'example.com' => [
                    'preferred' => 'v1',
                    'versions' => [],
                ],
            ], 200),
        ]);

        $result = app(ApisGuruRepository::class)->fetchList();

        $this->assertArrayHasKey('example.com', $result);
        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->serviceName === 'APIs.guru'
                && $event->action === 'list.json 取得'
                && $event->status === 'success'
                && $event->targetId === 'list.json'
                && $event->url === self::LIST_URL
                && $event->method === 'GET'
                && $event->responseStatus === 200,
        );
    }

    public function test_fetch_list_dispatches_failed_integration_and_error_logs_without_response_body(): void
    {
        Http::fake([
            self::LIST_URL => Http::response([
                'error' => [
                    'message' => 'upstream body should not be logged',
                ],
            ], 503),
        ]);

        try {
            app(ApisGuruRepository::class)->fetchList();
            $this->fail('Expected APIs.guru failure to throw.');
        } catch (RuntimeException $exception) {
            $this->assertSame('APIs.guru list.json の取得先がエラーを返しました。', $exception->getMessage());
        }

        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->status === 'failed'
                && $event->responseStatus === 503
                && ! str_contains((string) $event->message, 'upstream body should not be logged'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'api-catalog.apis-guru.request_failed'
                && ! str_contains($event->message, 'upstream body should not be logged'),
        );
    }

    public function test_invalid_json_dispatches_failed_integration_and_error_logs(): void
    {
        Http::fake([
            self::LIST_URL => Http::response('not json', 200),
        ]);

        try {
            app(ApisGuruRepository::class)->fetchList();
            $this->fail('Expected invalid APIs.guru JSON to throw.');
        } catch (RuntimeException $exception) {
            $this->assertSame('APIs.guru list.json のJSON形式が想定外です。', $exception->getMessage());
        }

        Event::assertDispatched(
            ApplicationIntegrationLogged::class,
            fn (ApplicationIntegrationLogged $event): bool => $event->status === 'failed'
                && $event->responseStatus === 200
                && ! str_contains((string) $event->message, 'not json'),
        );
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'api-catalog.apis-guru.response_json_invalid'
                && ! str_contains($event->message, 'not json'),
        );
    }
}
