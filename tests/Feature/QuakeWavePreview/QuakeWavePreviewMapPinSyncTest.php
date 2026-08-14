<?php

namespace Tests\Feature\QuakeWavePreview;

use App\Actions\Earthquake\Commands\RunEarthquakeMapPinSyncAction;
use App\Actions\Earthquake\Commands\StartEarthquakeMapPinSyncAction;
use App\DTO\Earthquake\Map\EarthquakeMapPinDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Events\ApplicationLog\ApplicationErrorOccurred;
use App\Events\ApplicationLog\ApplicationIntegrationLogged;
use App\Jobs\Earthquake\SyncEarthquakeMapPinsJob;
use App\Models\EarthquakeFeedEntry;
use App\Models\EarthquakeMapPin;
use App\Repositories\Earthquake\EarthquakeDetailXmlRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Services\Earthquake\EarthquakeDetailXmlParseService;
use App\Services\Earthquake\EarthquakeMapPinBuildService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

class QuakeWavePreviewMapPinSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_earthquake_map_pin_sync_action_creates_pending_run_and_dispatches_job(): void
    {
        Queue::fake();

        $syncRunId = app(StartEarthquakeMapPinSyncAction::class)->execute();

        $this->assertDatabaseHas('earthquake_map_pin_sync_runs', [
            'id' => $syncRunId,
            'status' => EarthquakeMapPinSyncResultDTO::STATUS_PENDING,
        ]);
        Queue::assertPushed(
            SyncEarthquakeMapPinsJob::class,
            fn (SyncEarthquakeMapPinsJob $job) => $job->syncRunId === $syncRunId,
        );
    }

    public function test_start_earthquake_map_pin_sync_action_returns_initial_status_for_http_response(): void
    {
        Queue::fake();

        $result = app(StartEarthquakeMapPinSyncAction::class)->executeWithInitialStatus();

        $this->assertSame(1, $result->syncRunId);
        $this->assertNotNull($result->syncStatus);
        $this->assertSame($result->syncRunId, $result->syncStatus->syncRunId);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_PENDING, $result->syncStatus->status);
        $this->assertTrue($result->syncStatus->isRunning());
        Queue::assertPushed(
            SyncEarthquakeMapPinsJob::class,
            fn (SyncEarthquakeMapPinsJob $job) => $job->syncRunId === $result->syncRunId,
        );
    }

    public function test_map_pin_sync_start_route_returns_sync_run_id_for_polling(): void
    {
        Queue::fake();

        $response = $this->postJson('/quakewave-preview/map-pins/sync');

        $response
            ->assertOk()
            ->assertJsonPath('syncRunId', 1)
            ->assertJsonPath('syncStatus.syncRunId', 1)
            ->assertJsonPath('syncStatus.status', EarthquakeMapPinSyncResultDTO::STATUS_PENDING)
            ->assertJsonPath('syncStatus.isRunning', true);

        Queue::assertPushed(
            SyncEarthquakeMapPinsJob::class,
            fn (SyncEarthquakeMapPinsJob $job) => $job->syncRunId === 1,
        );
    }

    public function test_map_pin_sync_start_route_returns_clear_error_when_storage_is_not_ready(): void
    {
        Queue::fake();
        $this->app->instance(EarthquakeMapPinSyncRunRepositoryInterface::class, new class implements EarthquakeMapPinSyncRunRepositoryInterface
        {
            public function isStorageReady(): bool
            {
                return false;
            }

            public function createPending(): int
            {
                throw new RuntimeException('Storage should not be used.');
            }

            public function markRunning(int $syncRunId): void
            {
                //
            }

            public function markCompleted(int $syncRunId, EarthquakeMapPinSyncResultDTO $result): void
            {
                //
            }

            public function markFailed(int $syncRunId, string $message): void
            {
                //
            }

            public function findResult(int $syncRunId): ?EarthquakeMapPinSyncResultDTO
            {
                return null;
            }

            public function latest(int $limit = 10): array
            {
                return [];
            }
        });

        $this
            ->postJson('/quakewave-preview/map-pins/sync')
            ->assertStatus(503)
            ->assertJsonPath('message', 'Earthquake map pin sync storage is not ready. Run migrations.')
            ->assertJsonPath('syncStatus', null);

        Queue::assertNothingPushed();
    }

    public function test_map_pin_sync_status_route_returns_current_status(): void
    {
        $repository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();
        $repository->markRunning($syncRunId);

        $this
            ->getJson('/quakewave-preview/map-pins/sync/status?syncRunId='.$syncRunId)
            ->assertOk()
            ->assertJsonPath('syncStatus.syncRunId', $syncRunId)
            ->assertJsonPath('syncStatus.status', EarthquakeMapPinSyncResultDTO::STATUS_RUNNING)
            ->assertJsonPath('syncStatus.isRunning', true);
    }

    public function test_map_pin_sync_job_marks_run_completed_with_result_counts(): void
    {
        /*
         * Job の責務は pending/running/completed の状態保存と Service 結果の反映です。
         * 個別XML取得や pin 化条件は Service テスト側で固定し、ここでは Queue 境界の状態更新を見ます。
         */
        $repository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();
        $buildService = new class extends EarthquakeMapPinBuildService
        {
            public function __construct() {}

            public function sync(int $syncRunId): EarthquakeMapPinSyncResultDTO
            {
                return new EarthquakeMapPinSyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                    totalCount: 5,
                    insertedCount: 2,
                    updatedCount: 1,
                    skippedCount: 2,
                    failedCount: 0,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                );
            }
        };

        (new SyncEarthquakeMapPinsJob($syncRunId))->handle(
            new RunEarthquakeMapPinSyncAction($repository, $buildService),
        );

        $status = $repository->findResult($syncRunId);

        $this->assertNotNull($status);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $status->status);
        $this->assertFalse($status->isRunning());
        $this->assertSame(5, $status->totalCount);
        $this->assertSame(2, $status->insertedCount);
        $this->assertSame(1, $status->updatedCount);
        $this->assertSame(2, $status->skippedCount);
        $this->assertSame(0, $status->failedCount);
        $this->assertNull($status->errorMessage);
        $this->assertNotNull($status->startedAt);
        $this->assertNotNull($status->finishedAt);
    }

    public function test_map_pin_sync_job_dispatches_only_retryable_entries_with_finite_backoff(): void
    {
        Queue::fake();
        $repository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();
        $buildService = new class extends EarthquakeMapPinBuildService
        {
            /** @var array<int, int> */
            public array $receivedSourceEntryIds = [];

            public function __construct() {}

            public function syncEntries(int $syncRunId, array $sourceEntryIds): EarthquakeMapPinSyncResultDTO
            {
                $this->receivedSourceEntryIds = $sourceEntryIds;

                return new EarthquakeMapPinSyncResultDTO(
                    syncRunId: $syncRunId,
                    status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
                    totalCount: 3,
                    insertedCount: 1,
                    updatedCount: 0,
                    skippedCount: 0,
                    failedCount: 2,
                    errorMessage: null,
                    startedAt: now(),
                    finishedAt: now(),
                    retryableSourceEntryIds: [41, 42],
                );
            }
        };
        $action = new RunEarthquakeMapPinSyncAction($repository, $buildService);

        (new SyncEarthquakeMapPinsJob($syncRunId, [41, 42, 43], 0))->handle(
            $action,
            app(StartEarthquakeMapPinSyncAction::class),
        );

        $this->assertSame([41, 42, 43], $buildService->receivedSourceEntryIds);
        Queue::assertPushed(
            SyncEarthquakeMapPinsJob::class,
            fn (SyncEarthquakeMapPinsJob $job): bool => $job->sourceEntryIds === [41, 42]
                && $job->retryAttempt === 1
                && $job->delay === 60,
        );

        Queue::fake();
        $terminalRunId = $repository->createPending();

        (new SyncEarthquakeMapPinsJob($terminalRunId, [41, 42], 2))->handle(
            $action,
            app(StartEarthquakeMapPinSyncAction::class),
        );

        Queue::assertNothingPushed();
        $terminalStatus = $repository->findResult($terminalRunId);
        $this->assertNotNull($terminalStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $terminalStatus->status);
        $this->assertSame(2, $terminalStatus->failedCount);
    }

    public function test_retry_dispatch_failure_marks_the_new_run_as_failed(): void
    {
        Queue::shouldReceive('connection')->once()->andThrow(new RuntimeException('Queue unavailable.'));

        try {
            app(StartEarthquakeMapPinSyncAction::class)->executeRetryableEntries([41], 0);
            $this->fail('Retry dispatch failure should be rethrown.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Queue unavailable.', $exception->getMessage());
        }

        $repository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $status = $repository->findResult(1);

        $this->assertNotNull($status);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_FAILED, $status->status);
        $this->assertSame(1, $status->failedCount);
        $this->assertSame('Queue unavailable.', $status->errorMessage);
    }

    public function test_limited_retry_recovers_failed_entry_without_refetching_successful_entry(): void
    {
        Queue::fake();
        $retryEntry = $this->createFeedEntry('urn:jma:earthquake:retry');
        $retryEntry->update(['xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/retry.xml']);
        $successEntry = $this->createFeedEntry('urn:jma:earthquake:success');
        $successEntry->update(['xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/success.xml']);
        $retryBody = $this->earthquakeReportXml('20260511112751', '2026-05-11T11:31:00+09:00');
        $successBody = $this->earthquakeReportXml('20260511112752', '2026-05-11T11:32:00+09:00');
        $detailRepository = new class($retryBody, $successBody) implements EarthquakeDetailXmlRepositoryInterface
        {
            /** @var array<string, int> */
            public array $fetchCounts = [];

            public function __construct(
                private readonly string $retryBody,
                private readonly string $successBody,
            ) {}

            public function fetch(string $url): array
            {
                $this->fetchCounts[$url] = ($this->fetchCounts[$url] ?? 0) + 1;

                if (str_ends_with($url, '/retry.xml') && $this->fetchCounts[$url] === 1) {
                    return [
                        'endpoint' => $url,
                        'method' => 'GET',
                        'success' => false,
                        'status_code' => 503,
                        'body' => null,
                        'error_message' => 'temporary server error',
                    ];
                }

                return [
                    'endpoint' => $url,
                    'method' => 'GET',
                    'success' => true,
                    'status_code' => 200,
                    'body' => str_ends_with($url, '/retry.xml') ? $this->retryBody : $this->successBody,
                    'error_message' => null,
                ];
            }
        };
        $this->app->instance(EarthquakeDetailXmlRepositoryInterface::class, $detailRepository);
        $syncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $action = new RunEarthquakeMapPinSyncAction(
            $syncRunRepository,
            app(EarthquakeMapPinBuildService::class),
        );
        $initialRunId = $syncRunRepository->createPending();

        (new SyncEarthquakeMapPinsJob(
            $initialRunId,
            [(int) $retryEntry->getKey(), (int) $successEntry->getKey()],
        ))->handle($action, app(StartEarthquakeMapPinSyncAction::class));

        $retryJob = null;
        Queue::assertPushed(
            SyncEarthquakeMapPinsJob::class,
            function (SyncEarthquakeMapPinsJob $job) use (&$retryJob, $retryEntry): bool {
                $retryJob = $job;

                return $job->sourceEntryIds === [(int) $retryEntry->getKey()]
                    && $job->retryAttempt === 1;
            },
        );
        $this->assertInstanceOf(SyncEarthquakeMapPinsJob::class, $retryJob);
        Queue::fake();

        $retryJob->handle($action, app(StartEarthquakeMapPinSyncAction::class));

        Queue::assertNothingPushed();
        $this->assertDatabaseHas('earthquake_map_pins', ['source_entry_id' => $retryEntry->getKey()]);
        $this->assertDatabaseHas('earthquake_map_pins', ['source_entry_id' => $successEntry->getKey()]);
        $this->assertSame(2, $detailRepository->fetchCounts[$retryEntry->xml_url]);
        $this->assertSame(1, $detailRepository->fetchCounts[$successEntry->xml_url]);
        $initialStatus = $syncRunRepository->findResult($initialRunId);
        $retryStatus = $syncRunRepository->findResult($retryJob->syncRunId);
        $this->assertNotNull($initialStatus);
        $this->assertSame(1, $initialStatus->failedCount);
        $this->assertNotNull($retryStatus);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $retryStatus->status);
        $this->assertSame(0, $retryStatus->failedCount);
    }

    public function test_detail_xml_parse_service_extracts_map_pin_values(): void
    {
        $dto = app(EarthquakeDetailXmlParseService::class)->parse(
            $this->earthquakeReportXml(eventId: '20260511112751', reportedAt: '2026-05-11T11:31:00+09:00'),
            123,
            'fallback title',
        );

        $this->assertSame('20260511112751', $dto->eventId);
        $this->assertSame(123, $dto->sourceEntryId);
        $this->assertSame('震源・震度情報', $dto->title);
        $this->assertSame('青森県東方沖', $dto->areaName);
        $this->assertSame('+41.0+142.5-50000/', $dto->rawCoordinate);
        $this->assertSame('41.0000000', $dto->latitude);
        $this->assertSame('142.5000000', $dto->longitude);
        $this->assertSame(50000, $dto->depthMeter);
        $this->assertSame('4.0', $dto->magnitude);
        $this->assertSame('1', $dto->maxIntensity);
        $this->assertSame('2026-05-11T11:27:00+09:00', $dto->occurredAt);
        $this->assertSame('2026-05-11T11:31:00+09:00', $dto->reportedAt);
    }

    public function test_map_pin_repository_inserts_skips_and_updates_newer_report_by_event_id(): void
    {
        $sourceEntry = $this->createFeedEntry('urn:jma:earthquake:1');
        $repository = app(EarthquakeMapPinRepositoryInterface::class);

        $insertResult = $repository->upsertFromMapPins(new EarthquakeMapPinListDTO([
            $this->pin(sourceEntryId: (int) $sourceEntry->getKey(), reportedAt: '2026-05-11T11:31:00+09:00'),
        ]));

        $this->assertSame(1, $insertResult['insertedCount']);
        $this->assertDatabaseHas('earthquake_map_pins', [
            'event_id' => '20260511112751',
            'area_name' => '青森県東方沖',
            'latitude' => '41.0000000',
            'longitude' => '142.5000000',
        ]);

        $olderResult = $repository->upsertFromMapPins(new EarthquakeMapPinListDTO([
            $this->pin(
                sourceEntryId: (int) $sourceEntry->getKey(),
                reportedAt: '2026-05-11T11:30:00+09:00',
                areaName: '古い震源',
            ),
        ]));

        $this->assertSame(1, $olderResult['skippedCount']);
        $this->assertDatabaseMissing('earthquake_map_pins', [
            'event_id' => '20260511112751',
            'area_name' => '古い震源',
        ]);

        $newerResult = $repository->upsertFromMapPins(new EarthquakeMapPinListDTO([
            $this->pin(
                sourceEntryId: (int) $sourceEntry->getKey(),
                reportedAt: '2026-05-11T11:35:00+09:00',
                areaName: '更新後震源',
            ),
        ]));

        $this->assertSame(1, $newerResult['updatedCount']);
        $this->assertDatabaseHas('earthquake_map_pins', [
            'event_id' => '20260511112751',
            'area_name' => '更新後震源',
        ]);
    }

    public function test_map_pin_build_service_fetches_detail_xml_parses_and_saves_map_pins(): void
    {
        $sourceEntry = $this->createFeedEntry('urn:jma:earthquake:1');
        $this->app->instance(EarthquakeDetailXmlRepositoryInterface::class, new class($this->earthquakeReportXml(eventId: '20260511112751', reportedAt: '2026-05-11T11:31:00+09:00')) implements EarthquakeDetailXmlRepositoryInterface
        {
            public function __construct(private readonly string $body) {}

            public function fetch(string $url): array
            {
                return [
                    'endpoint' => $url,
                    'method' => 'GET',
                    'request_headers' => [],
                    'success' => true,
                    'status_code' => 200,
                    'fetched_at' => '2026-05-11T11:32:00+09:00',
                    'response_time_ms' => 12.3,
                    'body' => $this->body,
                    'error_message' => null,
                ];
            }
        });
        $syncRunId = app(EarthquakeMapPinSyncRunRepositoryInterface::class)->createPending();

        $result = app(EarthquakeMapPinBuildService::class)->sync($syncRunId);

        $this->assertSame($syncRunId, $result->syncRunId);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $result->status);
        $this->assertSame(1, $result->totalCount);
        $this->assertSame(1, $result->insertedCount);
        $this->assertSame(0, $result->failedCount);
        $this->assertDatabaseHas('earthquake_map_pins', [
            'source_entry_id' => $sourceEntry->getKey(),
            'event_id' => '20260511112751',
            'area_name' => '青森県東方沖',
        ]);
    }

    public function test_map_pin_build_service_dispatches_error_log_when_detail_xml_parse_fails(): void
    {
        Event::fake([ApplicationErrorOccurred::class, ApplicationIntegrationLogged::class]);
        $sourceEntry = $this->createFeedEntry('urn:jma:earthquake:invalid-detail');
        $this->app->instance(EarthquakeDetailXmlRepositoryInterface::class, new class implements EarthquakeDetailXmlRepositoryInterface
        {
            public function fetch(string $url): array
            {
                return [
                    'endpoint' => $url,
                    'method' => 'GET',
                    'request_headers' => [],
                    'success' => true,
                    'status_code' => 200,
                    'fetched_at' => '2026-05-11T11:32:00+09:00',
                    'response_time_ms' => 12.3,
                    'body' => 'not xml',
                    'error_message' => null,
                ];
            }
        });
        $syncRunId = app(EarthquakeMapPinSyncRunRepositoryInterface::class)->createPending();

        $result = app(EarthquakeMapPinBuildService::class)->sync($syncRunId);

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(1, $result->failedCount);
        $this->assertDatabaseCount('earthquake_map_pins', 0);
        Event::assertDispatched(
            ApplicationErrorOccurred::class,
            fn (ApplicationErrorOccurred $event): bool => $event->errorCode === 'earthquake.jma.detail_xml_parse_failed'
                && $event->url === $sourceEntry->xml_url
                && $event->method === 'GET'
                && str_contains($event->message, '対象フィードID: '.(string) $sourceEntry->getKey())
                && ! str_contains($event->message, 'not xml'),
        );
    }

    public function test_map_pin_build_service_skips_non_mappable_detail_xml_without_error_log(): void
    {
        Event::fake([ApplicationErrorOccurred::class, ApplicationIntegrationLogged::class]);
        $this->createFeedEntry('urn:jma:earthquake:not-mappable-detail');
        $this->app->instance(EarthquakeDetailXmlRepositoryInterface::class, new class($this->earthquakeReportXmlWithoutCoordinate()) implements EarthquakeDetailXmlRepositoryInterface
        {
            public function __construct(private readonly string $body) {}

            public function fetch(string $url): array
            {
                return [
                    'endpoint' => $url,
                    'method' => 'GET',
                    'request_headers' => [],
                    'success' => true,
                    'status_code' => 200,
                    'fetched_at' => '2026-05-11T11:32:00+09:00',
                    'response_time_ms' => 12.3,
                    'body' => $this->body,
                    'error_message' => null,
                ];
            }
        });
        $syncRunId = app(EarthquakeMapPinSyncRunRepositoryInterface::class)->createPending();

        $result = app(EarthquakeMapPinBuildService::class)->sync($syncRunId);

        $this->assertSame(1, $result->totalCount);
        $this->assertSame(1, $result->skippedCount);
        $this->assertSame(0, $result->failedCount);
        $this->assertDatabaseCount('earthquake_map_pins', 0);
        Event::assertNotDispatched(ApplicationErrorOccurred::class);
    }

    public function test_map_pin_sync_job_preserves_partial_insert_when_repository_fails_after_first_pin(): void
    {
        $this->createFeedEntry('urn:jma:earthquake:partial-1');
        $this->createFeedEntry('urn:jma:earthquake:partial-2');
        $this->app->instance(EarthquakeDetailXmlRepositoryInterface::class, new class implements EarthquakeDetailXmlRepositoryInterface
        {
            private int $fetchCount = 0;

            public function fetch(string $url): array
            {
                $this->fetchCount++;
                $eventId = $this->fetchCount === 1 ? '20260511112751' : '20260511122852';
                $areaName = $this->fetchCount === 1 ? '青森県東方沖' : '岩手県沖';

                return [
                    'endpoint' => $url,
                    'method' => 'GET',
                    'request_headers' => [],
                    'success' => true,
                    'status_code' => 200,
                    'fetched_at' => '2026-05-11T11:32:00+09:00',
                    'response_time_ms' => 12.3,
                    'body' => $this->earthquakeReportXml($eventId, $areaName),
                    'error_message' => null,
                ];
            }

            private function earthquakeReportXml(string $eventId, string $areaName): string
            {
                return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://xml.kishou.go.jp/jmaxml1/" xmlns:jmx="http://xml.kishou.go.jp/jmaxml1/">
  <Control>
    <Title>震源・震度に関する情報</Title>
    <DateTime>2026-05-11T02:31:20Z</DateTime>
    <Status>通常</Status>
    <EditorialOffice>気象庁本庁</EditorialOffice>
    <PublishingOffice>気象庁</PublishingOffice>
  </Control>
  <Head xmlns="http://xml.kishou.go.jp/jmaxml1/informationBasis1/">
    <Title>震源・震度情報</Title>
    <ReportDateTime>2026-05-11T11:31:00+09:00</ReportDateTime>
    <TargetDateTime>2026-05-11T11:31:00+09:00</TargetDateTime>
    <EventID>{$eventId}</EventID>
    <InfoType>発表</InfoType>
    <Serial>1</Serial>
    <InfoKind>地震情報</InfoKind>
    <InfoKindVersion>1.0_1</InfoKindVersion>
    <Headline>
      <Text>１１日１１時２７分ころ、地震がありました。</Text>
    </Headline>
  </Head>
  <Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/seismology1/" xmlns:jmx_eb="http://xml.kishou.go.jp/jmaxml1/elementBasis1/">
    <Earthquake>
      <OriginTime>2026-05-11T11:27:00+09:00</OriginTime>
      <ArrivalTime>2026-05-11T11:27:00+09:00</ArrivalTime>
      <Hypocenter>
        <Area>
          <Name>{$areaName}</Name>
          <Code type="震央地名">285</Code>
          <jmx_eb:Coordinate description="北緯４１．０度　東経１４２．５度　深さ　５０ｋｍ">+41.0+142.5-50000/</jmx_eb:Coordinate>
        </Area>
      </Hypocenter>
      <jmx_eb:Magnitude type="Mj" description="Ｍ４．０">4.0</jmx_eb:Magnitude>
    </Earthquake>
    <Intensity>
      <Observation>
        <MaxInt>4</MaxInt>
      </Observation>
    </Intensity>
  </Body>
</Report>
XML;
            }
        });

        $innerRepository = app(EarthquakeMapPinRepositoryInterface::class);
        $failingRepository = new class($innerRepository) implements EarthquakeMapPinRepositoryInterface
        {
            public function __construct(
                private readonly EarthquakeMapPinRepositoryInterface $innerRepository,
            ) {}

            public function isStorageReady(): bool
            {
                return $this->innerRepository->isStorageReady();
            }

            public function upsertFromMapPins(EarthquakeMapPinListDTO $pins): array
            {
                $this->innerRepository->upsertFromMapPins(new EarthquakeMapPinListDTO([
                    $pins->items[0],
                ]));

                throw new RuntimeException('map pin repository interrupted after partial insert');
            }

            public function latest(int $limit = 50): array
            {
                return $this->innerRepository->latest($limit);
            }

            public function deleteBySourceEntryId(int $sourceEntryId): void
            {
                $this->innerRepository->deleteBySourceEntryId($sourceEntryId);
            }

            public function toMapPinListDTO(EarthquakeMapPinListQueryDTO $query): EarthquakeMapPinListDTO
            {
                return $this->innerRepository->toMapPinListDTO($query);
            }
        };
        $buildService = new EarthquakeMapPinBuildService(
            app(EarthquakeFeedEntryRepositoryInterface::class),
            app(EarthquakeDetailXmlRepositoryInterface::class),
            app(EarthquakeDetailXmlParseService::class),
            $failingRepository,
        );
        $syncRunRepository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $syncRunId = $syncRunRepository->createPending();

        try {
            (new SyncEarthquakeMapPinsJob($syncRunId))->handle(
                new RunEarthquakeMapPinSyncAction($syncRunRepository, $buildService),
            );

            $this->fail('Repository interruption should be rethrown by the map pin sync job.');
        } catch (RuntimeException $exception) {
            $this->assertSame('map pin repository interrupted after partial insert', $exception->getMessage());
        }

        $status = $syncRunRepository->findResult($syncRunId);

        $this->assertNotNull($status);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_FAILED, $status->status);
        $this->assertSame(1, $status->failedCount);
        $this->assertSame('map pin repository interrupted after partial insert', $status->errorMessage);
        $this->assertDatabaseCount('earthquake_map_pins', 1);
        $this->assertDatabaseHas('earthquake_map_pins', [
            'event_id' => '20260511112751',
            'area_name' => '青森県東方沖',
        ]);
        $this->assertDatabaseMissing('earthquake_map_pins', [
            'event_id' => '20260511122852',
        ]);
        $this->assertSame(1, EarthquakeMapPin::query()->distinct('event_id')->count('event_id'));
    }

    public function test_sync_job_failed_hook_marks_map_pin_sync_run_as_failed(): void
    {
        $repository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();

        (new SyncEarthquakeMapPinsJob($syncRunId))->failed(new RuntimeException('Worker timeout.'));

        $status = $repository->findResult($syncRunId);

        $this->assertNotNull($status);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_FAILED, $status->status);
        $this->assertSame(1, $status->failedCount);
        $this->assertSame('Worker timeout.', $status->errorMessage);
    }

    public function test_sync_job_failed_hook_does_not_overwrite_a_completed_run(): void
    {
        $repository = app(EarthquakeMapPinSyncRunRepositoryInterface::class);
        $syncRunId = $repository->createPending();
        $repository->markCompleted($syncRunId, new EarthquakeMapPinSyncResultDTO(
            syncRunId: $syncRunId,
            status: EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED,
            totalCount: 2,
            insertedCount: 1,
            updatedCount: 0,
            skippedCount: 0,
            failedCount: 1,
            errorMessage: null,
            startedAt: now(),
            finishedAt: now(),
        ));

        (new SyncEarthquakeMapPinsJob($syncRunId))->failed(new RuntimeException('Retry dispatch failed.'));

        $status = $repository->findResult($syncRunId);

        $this->assertNotNull($status);
        $this->assertSame(EarthquakeMapPinSyncResultDTO::STATUS_COMPLETED, $status->status);
        $this->assertSame(2, $status->totalCount);
        $this->assertSame(1, $status->insertedCount);
        $this->assertSame(1, $status->failedCount);
        $this->assertNull($status->errorMessage);
    }

    public function test_quakewave_frontend_contains_map_pin_sync_polling_ui(): void
    {
        $pageSource = file_get_contents(resource_path('js/Pages/QuakeWavePreview/Index.tsx'));
        $hookSource = file_get_contents(resource_path('js/Pages/QuakeWavePreview/hooks/useQuakeWavePreviewSync.ts'));

        $this->assertIsString($pageSource);
        $this->assertIsString($hookSource);
        $this->assertStringContainsString('/quakewave-preview/map-pins/sync', $hookSource);
        $this->assertStringContainsString('/quakewave-preview/map-pins/sync/status', $hookSource);
        $this->assertStringContainsString('EARTHQUAKE_MAP_PIN_SYNC_POLL_INTERVAL_MS = 2500', $hookSource);
        $this->assertStringContainsString('地図ピン生成', $pageSource);
    }

    private function createFeedEntry(string $entryId): EarthquakeFeedEntry
    {
        return EarthquakeFeedEntry::query()->create([
            'entry_id' => $entryId,
            'title' => '震源・震度に関する情報',
            'xml_url' => 'https://www.data.jma.go.jp/developer/xml/data/20260511113100_0.xml',
            'updated_at_from_feed' => '2026-05-11 02:31:00',
            'published_at_from_feed' => '2026-05-11 02:30:00',
            'raw_category' => '地震情報 (地震火山関連)',
            'raw_author' => '気象庁',
            'last_fetched_at' => '2026-05-11 02:31:30',
        ]);
    }

    private function pin(
        int $sourceEntryId,
        string $reportedAt,
        string $areaName = '青森県東方沖',
    ): EarthquakeMapPinDTO {
        return new EarthquakeMapPinDTO(
            eventId: '20260511112751',
            sourceEntryId: $sourceEntryId,
            title: '震源・震度情報',
            areaName: $areaName,
            headline: '１１日１１時２７分ころ、地震がありました。',
            rawCoordinate: '+41.0+142.5-50000/',
            latitude: '41.0000000',
            longitude: '142.5000000',
            depthMeter: 50000,
            magnitude: '4.0',
            maxIntensity: '1',
            occurredAt: '2026-05-11T11:27:00+09:00',
            reportedAt: $reportedAt,
            comment: '１１日１１時２７分ころ、地震がありました。',
        );
    }

    private function earthquakeReportXml(string $eventId, string $reportedAt): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://xml.kishou.go.jp/jmaxml1/" xmlns:jmx="http://xml.kishou.go.jp/jmaxml1/">
  <Control>
    <Title>震源・震度に関する情報</Title>
    <DateTime>2026-05-11T02:31:20Z</DateTime>
    <Status>通常</Status>
    <EditorialOffice>気象庁本庁</EditorialOffice>
    <PublishingOffice>気象庁</PublishingOffice>
  </Control>
  <Head xmlns="http://xml.kishou.go.jp/jmaxml1/informationBasis1/">
    <Title>震源・震度情報</Title>
    <ReportDateTime>{$reportedAt}</ReportDateTime>
    <TargetDateTime>{$reportedAt}</TargetDateTime>
    <EventID>{$eventId}</EventID>
    <InfoType>発表</InfoType>
    <Serial>1</Serial>
    <InfoKind>地震情報</InfoKind>
    <InfoKindVersion>1.0_1</InfoKindVersion>
    <Headline>
      <Text>１１日１１時２７分ころ、地震がありました。</Text>
    </Headline>
  </Head>
  <Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/seismology1/" xmlns:jmx_eb="http://xml.kishou.go.jp/jmaxml1/elementBasis1/">
    <Earthquake>
      <OriginTime>2026-05-11T11:27:00+09:00</OriginTime>
      <ArrivalTime>2026-05-11T11:27:00+09:00</ArrivalTime>
      <Hypocenter>
        <Area>
          <Name>青森県東方沖</Name>
          <Code type="震央地名">285</Code>
          <jmx_eb:Coordinate description="北緯４１．０度　東経１４２．５度　深さ　５０ｋｍ">+41.0+142.5-50000/</jmx_eb:Coordinate>
        </Area>
      </Hypocenter>
      <jmx_eb:Magnitude type="Mj" description="Ｍ４．０">4.0</jmx_eb:Magnitude>
    </Earthquake>
    <Intensity>
      <Observation>
        <MaxInt>1</MaxInt>
      </Observation>
    </Intensity>
  </Body>
</Report>
XML;
    }

    private function earthquakeReportXmlWithoutCoordinate(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://xml.kishou.go.jp/jmaxml1/" xmlns:jmx="http://xml.kishou.go.jp/jmaxml1/">
  <Control>
    <Title>震源・震度に関する情報</Title>
    <DateTime>2026-05-11T02:31:20Z</DateTime>
    <Status>通常</Status>
    <EditorialOffice>気象庁本庁</EditorialOffice>
    <PublishingOffice>気象庁</PublishingOffice>
  </Control>
  <Head xmlns="http://xml.kishou.go.jp/jmaxml1/informationBasis1/">
    <Title>震源・震度情報</Title>
    <ReportDateTime>2026-05-11T11:31:00+09:00</ReportDateTime>
    <TargetDateTime>2026-05-11T11:31:00+09:00</TargetDateTime>
    <EventID>20260511112751</EventID>
    <InfoType>発表</InfoType>
    <Serial>1</Serial>
    <InfoKind>地震情報</InfoKind>
    <InfoKindVersion>1.0_1</InfoKindVersion>
  </Head>
  <Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/seismology1/" xmlns:jmx_eb="http://xml.kishou.go.jp/jmaxml1/elementBasis1/">
    <Earthquake>
      <OriginTime>2026-05-11T11:27:00+09:00</OriginTime>
      <ArrivalTime>2026-05-11T11:27:00+09:00</ArrivalTime>
      <Hypocenter>
        <Area>
          <Name>青森県東方沖</Name>
          <Code type="震央地名">285</Code>
        </Area>
      </Hypocenter>
      <jmx_eb:Magnitude type="Mj" description="Ｍ４．０">4.0</jmx_eb:Magnitude>
    </Earthquake>
    <Intensity>
      <Observation>
        <MaxInt>1</MaxInt>
      </Observation>
    </Intensity>
  </Body>
</Report>
XML;
    }
}
