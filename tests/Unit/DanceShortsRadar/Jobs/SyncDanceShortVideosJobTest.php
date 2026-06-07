<?php

namespace Tests\Unit\DanceShortsRadar\Jobs;

use App\Actions\DanceShortsRadar\Commands\CleanupDanceShortVideoSnapshotsAction;
use App\Actions\DanceShortsRadar\Commands\PersistDanceShortVideoDetailsAction;
use App\Actions\DanceShortsRadar\Commands\SyncDanceShortPage2VideosAction;
use App\Actions\DanceShortsRadar\Commands\SyncDanceShortVideosAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Factories\DanceShortsRadar\DanceShortSearchConditionDTOFactory;
use App\Jobs\DanceShortsRadar\SyncDanceShortPage2VideosJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotRetentionService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use PHPUnit\Framework\TestCase;

class SyncDanceShortVideosJobTest extends TestCase
{
    public function test_handle_calls_sync_action(): void
    {
        $action = new class extends SyncDanceShortVideosAction {
            public bool $called = false;

            public function __construct()
            {
            }

            public function execute(): DanceShortVideoSyncResultDTO
            {
                $this->called = true;

                return new DanceShortVideoSyncResultDTO(
                    executedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
                );
            }
        };

        (new SyncDanceShortVideosJob())->handle($action);

        $this->assertTrue($action->called);
    }

    public function test_page2_handle_calls_page2_sync_action(): void
    {
        $action = new class extends SyncDanceShortPage2VideosAction {
            public bool $called = false;

            public function __construct()
            {
            }

            public function execute(): DanceShortVideoSyncResultDTO
            {
                $this->called = true;

                return new DanceShortVideoSyncResultDTO(
                    executedAt: CarbonImmutable::parse('2026-05-31 12:00:00', 'Asia/Tokyo'),
                );
            }
        };

        (new SyncDanceShortPage2VideosJob())->handle($action);

        $this->assertTrue($action->called);
    }

    public function test_action_returns_initial_sync_result_dto(): void
    {
        $result = (new SyncDanceShortVideosAction(
            $this->youtubeRepository(),
            $this->searchTargetRepository(),
            $this->persistAction(),
            $this->cleanupAction(),
            new DanceShortSearchConditionDTOFactory(),
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
    }

    public function test_job_has_queue_runtime_settings(): void
    {
        $job = new SyncDanceShortVideosJob();

        $this->assertSame(1, $job->tries);
        $this->assertSame(300, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
        $this->assertTrue(method_exists($job, 'failed'));
    }

    public function test_page2_job_has_queue_runtime_settings(): void
    {
        $job = new SyncDanceShortPage2VideosJob();

        $this->assertSame(1, $job->tries);
        $this->assertSame(300, $job->timeout);
        $this->assertTrue($job->failOnTimeout);
        $this->assertTrue(method_exists($job, 'failed'));
    }

    private function youtubeRepository(): YouTubeVideoApiRepositoryInterface
    {
        return $this->createStub(YouTubeVideoApiRepositoryInterface::class);
    }

    private function searchTargetRepository(): DanceShortSearchTargetRepositoryInterface
    {
        $repository = $this->createStub(DanceShortSearchTargetRepositoryInterface::class);
        $repository->method('activeRegions')->willReturn(new Collection());

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
            new DanceShortSnapshotRetentionService(),
        );
    }
}
