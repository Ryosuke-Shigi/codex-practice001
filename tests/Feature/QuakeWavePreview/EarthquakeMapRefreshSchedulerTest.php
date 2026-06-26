<?php

namespace Tests\Feature\QuakeWavePreview;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * QuakeWave map refresh の Scheduler 登録を固定する Feature Test です。
 */
class EarthquakeMapRefreshSchedulerTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_scheduler_registers_earthquake_map_refresh_every_fifteen_minutes(): void
    {
        $event = $this->earthquakeMapRefreshScheduleEvent();
        $command = Event::normalizeCommand($event->command ?? '');

        $this->assertSame('*/15 * * * *', $event->getExpression());
        $this->assertSame('earthquake-map-refresh', $event->description);
        $this->assertStringContainsString('artisan earthquake:refresh-map', $command);
        $this->assertTrue($event->withoutOverlapping);

        Carbon::setTestNow(Carbon::parse('2026-06-01 00:15:00'));
        $this->assertTrue($event->isDue($this->app));

        Carbon::setTestNow(Carbon::parse('2026-06-01 00:16:00'));
        $this->assertFalse($event->isDue($this->app));
    }

    public function test_schedule_list_shows_earthquake_map_refresh_command(): void
    {
        $this
            ->artisan('schedule:list')
            ->expectsOutputToContain('earthquake:refresh-map')
            ->assertExitCode(0);
    }

    private function earthquakeMapRefreshScheduleEvent(): Event
    {
        $event = collect($this->app->make(Schedule::class)->events())
            ->first(fn (Event $event): bool => str_contains(
                Event::normalizeCommand($event->command ?? ''),
                'artisan earthquake:refresh-map',
            ));

        $this->assertInstanceOf(Event::class, $event);

        return $event;
    }
}
