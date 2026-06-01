<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Jobs\DanceShortsRadar\CleanupDanceShortVideoSnapshotsJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class DanceShortSchedulerTest extends TestCase
{
    private const FIRST_SCHEDULED_HOUR = '2026-06-01 04:00:00';

    private const NEXT_SCHEDULED_HOUR = '2026-06-01 05:00:00';

    private const CLEANUP_SCHEDULED_AT = '2026-06-01 04:30:00';

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_scheduler_dispatches_sync_job_when_enabled(): void
    {
        /*
         * Scheduler は同期本体を実行せず、明示的に有効化された環境で Queue へ Job を積む入口だけを担当します。
         * ここでは Queue fake で worker 実行を止め、schedule:run から dispatch までの境界だけを確認します。
         */
        Queue::fake();
        config(['dance_short.sync_enabled' => true]);
        Carbon::setTestNow(Carbon::parse(self::FIRST_SCHEDULED_HOUR));

        $this->artisan('schedule:run')->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortVideosJob::class);
    }

    public function test_scheduler_dispatches_sync_job_each_hour_when_enabled(): void
    {
        /*
         * 04:00 だけの確認だと dailyAt('04:00') でも通ってしまいます。
         * 次の 05:00 でも dispatch されることを固定し、「1時間ごと」の Scheduler 登録を守ります。
         */
        Queue::fake();
        config(['dance_short.sync_enabled' => true]);
        Carbon::setTestNow(Carbon::parse(self::NEXT_SCHEDULED_HOUR));

        $this->artisan('schedule:run')->assertExitCode(0);

        Queue::assertPushed(SyncDanceShortVideosJob::class);
    }

    public function test_scheduler_does_not_dispatch_sync_job_when_disabled(): void
    {
        /*
         * local のデフォルトでは false にしておき、schedule:run や scheduler コンテナが動いても
         * YouTube Data API へ進む Job が勝手に投入されないことを固定します。
         * false 時は Job 自体を積まないため、Queue worker 側の同期処理や外部API取得へ進みません。
         */
        Queue::fake();
        config(['dance_short.sync_enabled' => false]);
        Carbon::setTestNow(Carbon::parse(self::FIRST_SCHEDULED_HOUR));

        $this->artisan('schedule:run')->assertExitCode(0);

        Queue::assertNotPushed(SyncDanceShortVideosJob::class);
    }

    public function test_scheduler_dispatches_snapshot_cleanup_job_daily_even_when_sync_is_disabled(): void
    {
        /*
         * snapshot cleanup は YouTube API を呼ばない DB maintenance です。
         * そのため DANCE_SHORT_SYNC_ENABLED=false でも、1日1回の cleanup Job は Queue へ投入します。
         */
        Queue::fake();
        config(['dance_short.sync_enabled' => false]);
        Carbon::setTestNow(Carbon::parse(self::CLEANUP_SCHEDULED_AT));

        $this->artisan('schedule:run')->assertExitCode(0);

        Queue::assertPushed(CleanupDanceShortVideoSnapshotsJob::class);
        Queue::assertNotPushed(SyncDanceShortVideosJob::class);
    }
}
