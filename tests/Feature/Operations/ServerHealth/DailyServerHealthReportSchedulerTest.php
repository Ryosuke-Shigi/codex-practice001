<?php

namespace Tests\Feature\Operations\ServerHealth;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DailyServerHealthReportSchedulerTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_scheduler_registers_daily_server_health_report_at_six_without_sync_option(): void
    {
        $event = $this->dailyServerHealthReportScheduleEvent();
        $command = Event::normalizeCommand($event->command ?? '');

        $this->assertSame('0 6 * * *', $event->getExpression());
        $this->assertSame('daily-server-health-report', $event->description);
        $this->assertStringContainsString('artisan health:send-daily-server-report', $command);
        $this->assertStringNotContainsString('--sync', $command);
        $this->assertTrue($event->withoutOverlapping);

        Carbon::setTestNow(Carbon::parse('2026-06-25 06:00:00'));
        $this->assertTrue($event->isDue($this->app));

        Carbon::setTestNow(Carbon::parse('2026-06-25 06:01:00'));
        $this->assertFalse($event->isDue($this->app));
    }

    private function dailyServerHealthReportScheduleEvent(): Event
    {
        $event = collect($this->app->make(Schedule::class)->events())
            ->first(fn (Event $event): bool => str_contains(
                Event::normalizeCommand($event->command ?? ''),
                'artisan health:send-daily-server-report',
            ));

        $this->assertInstanceOf(Event::class, $event);

        return $event;
    }
}
