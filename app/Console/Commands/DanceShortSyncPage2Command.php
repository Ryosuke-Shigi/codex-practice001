<?php

namespace App\Console\Commands;

use App\Jobs\DanceShortsRadar\SyncDanceShortPage2VideosJob;
use Illuminate\Console\Command;

class DanceShortSyncPage2Command extends Command
{
    protected $signature = 'dance-short:sync-page2';

    protected $description = 'Dispatch the DanceShortsRadar expanded keyword page 2 sync job.';

    public function handle(): int
    {
        SyncDanceShortPage2VideosJob::dispatch();

        $this->info('DanceShortsRadar page 2 sync job dispatched.');

        return self::SUCCESS;
    }
}
