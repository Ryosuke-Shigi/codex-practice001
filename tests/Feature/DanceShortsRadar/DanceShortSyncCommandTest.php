<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortVideosAction;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
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
        $this->app->instance(SyncDanceShortVideosAction::class, new class extends SyncDanceShortVideosAction {
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
}
