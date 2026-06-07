<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortPage2VideosAction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SyncDanceShortPage2VideosJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public bool $failOnTimeout = true;

    public function handle(SyncDanceShortPage2VideosAction $action): void
    {
        $action->execute();
    }

    public function failed(?Throwable $exception): void
    {
        //
    }
}
