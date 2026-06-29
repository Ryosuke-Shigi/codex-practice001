<?php

namespace Tests\Unit\DanceShortsRadar\Jobs;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelPatternAction;
use App\Actions\DanceShortsRadar\Commands\CleanupDanceShortVideoSnapshotsAction;
use App\Actions\DanceShortsRadar\Commands\PersistDanceShortVideoDetailsAction;
use App\Actions\DanceShortsRadar\Commands\RefreshDanceShortVideoSnapshotsAction;
use App\Actions\DanceShortsRadar\Commands\SyncDanceShortPage2VideosAction;
use App\Actions\DanceShortsRadar\Commands\SyncDanceShortVideosAction;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternBuildResultDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Events\DanceShortsRadar\DanceShortRankingReadModelRefreshRequested;
use App\Factories\DanceShortsRadar\DanceShortSearchConditionDTOFactory;
use App\Jobs\DanceShortsRadar\BuildDanceShortRankingReadModelPatternJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortPage2VideosJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideoSnapshotsJob;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelBuildLifecycleService;
use App\Services\DanceShortsRadar\DanceShortSnapshotRetentionService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SyncDanceShortVideosJobTest extends TestCase
{
    public function test_handle_calls_sync_action(): void
    {
        $action = new class extends SyncDanceShortVideosAction
        {
            public bool $called = false;

            public function __construct() {}

            public function execute(): DanceShortVideoSyncResultDTO
            {
                $this->called = true;

                return new DanceShortVideoSyncResultDTO(
                    executedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
                );
            }
        };

        (new SyncDanceShortVideosJob)->handle($action);

        $this->assertTrue($action->called);
    }

    public function test_page2_handle_calls_page2_sync_action(): void
    {
        $action = new class extends SyncDanceShortPage2VideosAction
        {
            public bool $called = false;

            public function __construct() {}

            public function execute(): DanceShortVideoSyncResultDTO
            {
                $this->called = true;

                return new DanceShortVideoSyncResultDTO(
                    executedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
                );
            }
        };

        (new SyncDanceShortPage2VideosJob)->handle($action);

        $this->assertTrue($action->called);
    }

    public function test_snapshot_handle_calls_refresh_snapshot_action(): void
    {
        $action = new class extends RefreshDanceShortVideoSnapshotsAction
        {
            public bool $called = false;

            public function __construct() {}

            public function execute(): DanceShortVideoSyncResultDTO
            {
                $this->called = true;

                return new DanceShortVideoSyncResultDTO(
                    executedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
                );
            }
        };

        (new SyncDanceShortVideoSnapshotsJob)->handle($action);

        $this->assertTrue($action->called);
    }

    public function test_ranking_read_model_build_handle_calls_build_action(): void
    {
        $action = new class extends BuildDanceShortRankingReadModelPatternAction
        {
            public bool $called = false;

            public ?string $patternKey = null;

            public function __construct() {}

            public function execute(string $patternKey): RankingReadModelPatternBuildResultDTO
            {
                $this->called = true;
                $this->patternKey = $patternKey;

                return new RankingReadModelPatternBuildResultDTO(
                    patternBuildId: 'ranking-pattern-build-test',
                    patternKey: $patternKey,
                    rankingType: 'normal',
                    scope: 'JP',
                    comparisonDays: 1,
                    sortKey: 'views_per_hour',
                    maxRows: 500,
                    insertedRowCount: 0,
                    calculatedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
                );
            }
        };

        (new BuildDanceShortRankingReadModelPatternJob('normal|JP|1|views_per_hour'))->handle($action);

        $this->assertTrue($action->called);
        $this->assertSame('normal|JP|1|views_per_hour', $action->patternKey);
    }

    public function test_action_returns_initial_sync_result_dto(): void
    {
        Event::fake([DanceShortRankingReadModelRefreshRequested::class]);

        $result = (new SyncDanceShortVideosAction(
            $this->youtubeRepository(),
            $this->searchTargetRepository(),
            $this->persistAction(),
            $this->cleanupAction(),
            new DanceShortSearchConditionDTOFactory,
        ))->execute();

        $this->assertInstanceOf(DanceShortVideoSyncResultDTO::class, $result);
        $this->assertSame(0, $result->searchedRegionCount);
        $this->assertSame(0, $result->searchedKeywordCount);
        $this->assertSame(0, $result->fetchedVideoCount);
        $this->assertSame(0, $result->fetchedVideoDetailCount);
        $this->assertSame(0, $result->insertedVideoCount);
        $this->assertSame(0, $result->updatedVideoCount);
        $this->assertSame(0, $result->savedVideoCount);
        $this->assertSame(0, $result->savedSnapshotCount);
        $this->assertSame(0, $result->skippedVideoCount);
        $this->assertSame(0, $result->skippedSnapshotByTrackingCount);
        $this->assertSame(0, $result->excludedByShortsCount);
        $this->assertSame(0, $result->skippedPersistenceCount);
        $this->assertSame(0, $result->cleanedUpSnapshotCount);
        $this->assertSame(0, $result->failedCount);
        Event::assertNotDispatched(DanceShortRankingReadModelRefreshRequested::class);
    }

    public function test_job_has_queue_runtime_settings(): void
    {
        $job = new SyncDanceShortVideosJob;

        $this->assertSame(1, $job->tries);
        $this->assertSame(300, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
        $this->assertTrue(method_exists($job, 'failed'));
    }

    public function test_page2_job_has_queue_runtime_settings(): void
    {
        $job = new SyncDanceShortPage2VideosJob;

        $this->assertSame(1, $job->tries);
        $this->assertSame(300, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
        $this->assertTrue(method_exists($job, 'failed'));
    }

    public function test_snapshot_job_has_queue_runtime_settings_and_fixed_unique_id(): void
    {
        $job = new SyncDanceShortVideoSnapshotsJob;

        $this->assertInstanceOf(ShouldBeUnique::class, $job);
        $this->assertSame(1, $job->tries);
        $this->assertSame(600, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
        $this->assertSame(1800, $job->uniqueFor);
        $this->assertSame('dance-short-video-snapshots-refresh', $job->uniqueId());
        $this->assertTrue(method_exists($job, 'failed'));
    }

    public function test_ranking_read_model_build_job_releases_unique_lock_until_processing_and_serializes_running_builds(): void
    {
        $job = new BuildDanceShortRankingReadModelPatternJob('normal|JP|1|views_per_hour');

        $this->assertInstanceOf(ShouldBeUniqueUntilProcessing::class, $job);
        $this->assertSame(1, $job->tries);
        $this->assertSame(600, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
        $this->assertSame(1800, $job->uniqueFor);
        $this->assertSame('dance-short-ranking-read-model-pattern-build:normal|JP|1|views_per_hour', $job->uniqueId());
        $this->assertCount(1, $job->middleware());
        $this->assertInstanceOf(WithoutOverlapping::class, $job->middleware()[0]);
        $this->assertSame(60, $job->middleware()[0]->releaseAfter);
        $this->assertSame(DanceShortRankingReadModelBuildLifecycleService::DEFAULT_LOCK_TTL_SECONDS, $job->middleware()[0]->expiresAfter);
        $this->assertTrue(method_exists($job, 'failed'));
    }

    private function youtubeRepository(): YouTubeVideoApiRepositoryInterface
    {
        return $this->createStub(YouTubeVideoApiRepositoryInterface::class);
    }

    private function searchTargetRepository(): DanceShortSearchTargetRepositoryInterface
    {
        $repository = $this->createStub(DanceShortSearchTargetRepositoryInterface::class);
        $repository->method('activeRegions')->willReturn(new Collection);

        return $repository;
    }

    private function persistAction(): PersistDanceShortVideoDetailsAction
    {
        return $this->createStub(PersistDanceShortVideoDetailsAction::class);
    }

    private function snapshotRepository(): DanceShortVideoSnapshotRepositoryInterface
    {
        return $this->createStub(DanceShortVideoSnapshotRepositoryInterface::class);
    }

    private function cleanupAction(): CleanupDanceShortVideoSnapshotsAction
    {
        return new CleanupDanceShortVideoSnapshotsAction(
            $this->snapshotRepository(),
            new DanceShortSnapshotRetentionService,
        );
    }
}
