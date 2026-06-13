<?php

namespace App\Console\Commands;

use App\Jobs\DanceShortsRadar\SyncDanceShortPage2VideosJob;
use Illuminate\Console\Command;

/**
 * DanceShortsRadar の page2 同期 Job を投入する Artisan Command です。
 *
 * CLI / Scheduler の入口に限定し、expanded keyword 判定や YouTube API 呼び出しは Job / Action 側へ委譲します。
 */
class DanceShortSyncPage2Command extends Command
{
    protected $signature = 'dance-short:sync-page2';

    protected $description = 'Dispatch the DanceShortsRadar expanded keyword page 2 sync job.';

    /**
     * page2 同期 Job を Queue へ投入し、同期本体は実行しません。
     */
    public function handle(): int
    {
        SyncDanceShortPage2VideosJob::dispatch();

        $this->info('DanceShortsRadar page 2 sync job dispatched.');

        return self::SUCCESS;
    }
}
