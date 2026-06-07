<?php

namespace Tests\Feature\DanceShortsRadar;

use App\Jobs\DanceShortsRadar\CleanupDanceShortVideoSnapshotsJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortPage2VideosJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class DanceShortSchedulerTest extends TestCase
{
    private const FIRST_SYNC_SCHEDULED_AT = '2026-06-01 00:00:00';

    private const UNSCHEDULED_SYNC_HOUR = '2026-06-01 05:00:00';

    private const CLEANUP_SCHEDULED_AT = '2026-06-01 04:30:00';

    private const PAGE2_UNSCHEDULED_SYNC_HOUR = '2026-06-01 06:00:00';

    private const SYNC_SCHEDULED_TIMES = [
        '2026-06-01 00:00:00',
        '2026-06-01 03:00:00',
        '2026-06-01 06:00:00',
        '2026-06-01 09:00:00',
        '2026-06-01 12:00:00',
        '2026-06-01 15:00:00',
        '2026-06-01 18:00:00',
        '2026-06-01 21:00:00',
    ];

    private const PAGE2_SYNC_SCHEDULED_TIMES = [
        '2026-06-01 06:30:00',
        '2026-06-01 18:30:00',
    ];

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_schedule_registers_sync_quota_safe_windows(): void
    {
        /*
         * Scheduler は同期本体を実行せず、明示的に有効化された環境で command を呼ぶ入口だけを担当します。
         * Job dispatch の境界は DanceShortSyncCommandTest で固定し、ここでは schedule 登録だけを確認します。
         */
        $this->assertSame('0 */3 * * *', $this->syncScheduleEvent()->getExpression());
        $this->assertSame('30 6,18 * * *', $this->page2SyncScheduleEvent()->getExpression());
    }

    public function test_sync_schedule_is_due_at_each_quota_safe_window(): void
    {
        /*
         * 1時間ごとの同期ではなく、YouTube Data API quota を抑える3時間ごとの実行窓だけを固定します。
         */
        $event = $this->syncScheduleEvent();

        $this->assertSame('0 */3 * * *', $event->getExpression());
        $this->assertStringContainsString(
            'artisan dance-short:sync',
            Event::normalizeCommand($event->command),
        );

        foreach (self::SYNC_SCHEDULED_TIMES as $scheduledTime) {
            Carbon::setTestNow(Carbon::parse($scheduledTime));

            $this->assertTrue($event->isDue($this->app));
        }
    }

    public function test_page2_sync_schedule_is_due_twice_daily_on_non_regular_sync_windows(): void
    {
        $event = $this->page2SyncScheduleEvent();

        $this->assertSame('30 6,18 * * *', $event->getExpression());
        $this->assertSame('dance-short-video-page2-sync', $event->description);
        $this->assertStringContainsString(
            'artisan dance-short:sync-page2',
            Event::normalizeCommand($event->command),
        );

        foreach (self::PAGE2_SYNC_SCHEDULED_TIMES as $scheduledTime) {
            Carbon::setTestNow(Carbon::parse($scheduledTime));

            $this->assertTrue($event->isDue($this->app));
        }

        Carbon::setTestNow(Carbon::parse(self::PAGE2_UNSCHEDULED_SYNC_HOUR));

        $this->assertFalse($event->isDue($this->app));
    }

    public function test_page2_sync_schedule_keeps_without_overlapping_and_sync_enabled_gate(): void
    {
        $event = $this->page2SyncScheduleEvent();

        $this->assertTrue($event->withoutOverlapping);

        config(['dance_short.sync_enabled' => true]);
        $this->assertTrue($event->filtersPass($this->app));

        config(['dance_short.sync_enabled' => false]);
        $this->assertFalse($event->filtersPass($this->app));
    }

    public function test_scheduler_does_not_dispatch_sync_job_between_quota_safe_windows(): void
    {
        /*
         * 05:00 は以前の hourly() なら dispatch されます。
         * 非実行に固定し、1時間ごとや任意時刻の同期設定が戻らないことを守ります。
         */
        Queue::fake();
        config(['dance_short.sync_enabled' => true]);
        Carbon::setTestNow(Carbon::parse(self::UNSCHEDULED_SYNC_HOUR));

        $this->artisan('schedule:run')->assertExitCode(0);

        Queue::assertNotPushed(SyncDanceShortVideosJob::class);
    }

    public function test_scheduler_does_not_dispatch_page2_sync_job_when_disabled(): void
    {
        Queue::fake();
        config(['dance_short.sync_enabled' => false]);
        Carbon::setTestNow(Carbon::parse(self::PAGE2_SYNC_SCHEDULED_TIMES[0]));

        $this->artisan('schedule:run')->assertExitCode(0);

        Queue::assertNotPushed(SyncDanceShortPage2VideosJob::class);
        Queue::assertNotPushed(SyncDanceShortVideosJob::class);
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
        Carbon::setTestNow(Carbon::parse(self::FIRST_SYNC_SCHEDULED_AT));

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

    private function syncScheduleEvent(): Event
    {
        $event = collect($this->app->make(Schedule::class)->events())
            ->first(fn (Event $event): bool => str_contains(
                Event::normalizeCommand($event->command ?? ''),
                'artisan dance-short:sync',
            ));

        $this->assertInstanceOf(Event::class, $event);

        return $event;
    }

    private function page2SyncScheduleEvent(): Event
    {
        $event = collect($this->app->make(Schedule::class)->events())
            ->first(fn (Event $event): bool => str_contains(
                Event::normalizeCommand($event->command ?? ''),
                'artisan dance-short:sync-page2',
            ));

        $this->assertInstanceOf(Event::class, $event);

        return $event;
    }
}
