<?php

namespace Tests\Feature\DanceShortsRadar;

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
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

class DanceShortSyncCommandTest extends TestCase
{
    public function test_command_dispatches_sync_job(): void
    {
        /*
         * Command の仕様は「同期依頼を Queue に積んで終了する」ことです。
         * Queue fake で worker 実行を止め、artisan 入口が正しい Job を投入する点だけを固定します。
         */
        Queue::fake();

        $this
            ->artisan('dance-short:sync')
            ->expectsOutput('DanceShortsRadar sync job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortVideosJob::class);
    }

    public function test_command_does_not_execute_sync_action_directly(): void
    {
        /*
         * Command に Action 呼び出しが混ざると、手動実行時に同期本体まで同期的に走ってしまいます。
         * Action を例外化して container に差し替え、Command が本体を直接触らない境界を守ります。
         */
        Queue::fake();
        $this->app->instance(SyncDanceShortVideosAction::class, new class(
            $this->youtubeRepository(),
            $this->searchTargetRepository(),
            $this->videoRepository(),
            $this->snapshotRepository(),
            new DanceShortVideoEligibilityService(),
            new DanceShortVideoSaveDTOFactory(),
            new DanceShortVideoSnapshotCreateDTOFactory(),
        ) extends SyncDanceShortVideosAction {
            public function execute(): DanceShortVideoSyncResultDTO
            {
                throw new RuntimeException('Command should only dispatch the sync job.');
            }
        });

        $this
            ->artisan('dance-short:sync')
            ->expectsOutput('DanceShortsRadar sync job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortVideosJob::class);
    }

    private function youtubeRepository(): YouTubeVideoApiRepositoryInterface
    {
        return $this->createStub(YouTubeVideoApiRepositoryInterface::class);
    }

    private function searchTargetRepository(): DanceShortSearchTargetRepositoryInterface
    {
        return $this->createStub(DanceShortSearchTargetRepositoryInterface::class);
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
