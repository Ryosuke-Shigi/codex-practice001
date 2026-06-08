<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortPage2VideosAction;
use App\Actions\DanceShortsRadar\Commands\SyncDanceShortVideosAction;
use App\Actions\DanceShortsRadar\Commands\RefreshDanceShortVideoSnapshotsAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Jobs\DanceShortsRadar\SyncDanceShortPage2VideosJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideoSnapshotsJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

class DanceShortSyncCommandTest extends TestCase
{
    public function test_command_dispatches_sync_job(): void
    {
        Queue::fake();

        $this
            ->artisan('dance-short:sync')
            ->expectsOutput('DanceShortsRadar sync job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortVideosJob::class);
    }

    public function test_command_does_not_execute_sync_action_directly(): void
    {
        Queue::fake();
        $this->app->instance(SyncDanceShortVideosAction::class, new class extends SyncDanceShortVideosAction {
            public function __construct()
            {
            }

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

    public function test_page2_command_dispatches_page2_sync_job(): void
    {
        Queue::fake();

        $this
            ->artisan('dance-short:sync-page2')
            ->expectsOutput('DanceShortsRadar page 2 sync job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortPage2VideosJob::class);
    }

    public function test_page2_command_does_not_execute_page2_sync_action_directly(): void
    {
        Queue::fake();
        $this->app->instance(SyncDanceShortPage2VideosAction::class, new class extends SyncDanceShortPage2VideosAction {
            public function __construct()
            {
            }

            public function execute(): DanceShortVideoSyncResultDTO
            {
                throw new RuntimeException('Command should only dispatch the page2 sync job.');
            }
        });

        $this
            ->artisan('dance-short:sync-page2')
            ->expectsOutput('DanceShortsRadar page 2 sync job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortPage2VideosJob::class);
    }

    public function test_snapshot_command_dispatches_snapshot_sync_job(): void
    {
        Queue::fake();

        $this
            ->artisan('dance-short:sync-snapshots')
            ->expectsOutput('DanceShortsRadar snapshot sync job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortVideoSnapshotsJob::class);
    }

    public function test_snapshot_command_does_not_execute_snapshot_action_directly(): void
    {
        Queue::fake();
        $this->app->instance(RefreshDanceShortVideoSnapshotsAction::class, new class extends RefreshDanceShortVideoSnapshotsAction {
            public function __construct()
            {
            }

            public function execute(): DanceShortVideoSyncResultDTO
            {
                throw new RuntimeException('Command should only dispatch the snapshot sync job.');
            }
        });

        $this
            ->artisan('dance-short:sync-snapshots')
            ->expectsOutput('DanceShortsRadar snapshot sync job dispatched.')
            ->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortVideoSnapshotsJob::class);
    }
}
