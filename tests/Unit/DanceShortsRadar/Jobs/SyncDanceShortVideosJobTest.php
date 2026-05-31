<?php

namespace Tests\Unit\DanceShortsRadar\Jobs;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortVideosAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSaveDTOFactory;
use App\Factories\DanceShortsRadar\DanceShortVideoSnapshotCreateDTOFactory;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortVideoEligibilityService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use PHPUnit\Framework\TestCase;

class SyncDanceShortVideosJobTest extends TestCase
{
    public function test_handle_calls_sync_action(): void
    {
        /*
         * Job の handle() は Action を呼ぶことだけを確認します。
         * YouTube API の取得・DB保存・snapshot比較は Job の責務ではないため、このテストへ持ち込みません。
         */
        $action = new class(
            $this->youtubeRepository(),
            $this->searchTargetRepository(),
            $this->videoRepository(),
            $this->snapshotRepository(),
            new DanceShortVideoEligibilityService(),
            new DanceShortVideoSaveDTOFactory(),
            new DanceShortVideoSnapshotCreateDTOFactory(),
        ) extends SyncDanceShortVideosAction {
            public bool $called = false;

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

    public function test_action_returns_initial_sync_result_dto(): void
    {
        /*
         * API 未接続の現段階では、Action はゼロ件の同期結果DTOを返すだけにします。
         * 後続で Repository / Service を接続するときも、外側の戻り値の型を保つための土台です。
         */
        $result = (new SyncDanceShortVideosAction(
            $this->youtubeRepository(),
            $this->searchTargetRepository(),
            $this->videoRepository(),
            $this->snapshotRepository(),
            new DanceShortVideoEligibilityService(),
            new DanceShortVideoSaveDTOFactory(),
            new DanceShortVideoSnapshotCreateDTOFactory(),
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
        $this->assertSame(0, $result->excludedByShortsCount);
        $this->assertSame(0, $result->skippedPersistenceCount);
        $this->assertSame(0, $result->failedCount);
    }

    public function test_job_has_queue_runtime_settings(): void
    {
        /*
         * Queue worker で動く前提を明示するため、最低限の retry / timeout / timeout failure を固定します。
         * 具体的な失敗記録は、同期履歴テーブルを追加する段階で failed hook に接続します。
         */
        $job = new SyncDanceShortVideosJob();

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

    private function videoRepository(): DanceShortVideoRepositoryInterface
    {
        return $this->createStub(DanceShortVideoRepositoryInterface::class);
    }

    private function snapshotRepository(): DanceShortVideoSnapshotRepositoryInterface
    {
        return $this->createStub(DanceShortVideoSnapshotRepositoryInterface::class);
    }
}
