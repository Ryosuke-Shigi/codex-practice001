<?php

namespace App\Console\Commands;

use App\Jobs\DanceShortsRadar\SyncDanceShortVideoSnapshotsJob;
use Illuminate\Console\Command;

class DanceShortSyncSnapshotsCommand extends Command
{
    protected $signature = 'dance-short:sync-snapshots';

    protected $description = 'Dispatch the DanceShortsRadar saved active video snapshot sync job.';

    public function handle(): int
    {
        /*
         * Command は snapshot 専用同期の手動入口だけを担当します。
         * active 条件、videos.list 取得、JST12時間枠 update/create は
         * Queue worker が実行する Job / Action / Repository 側に委譲します。
         */
        SyncDanceShortVideoSnapshotsJob::dispatch();

        $this->info('DanceShortsRadar snapshot sync job dispatched.');

        return self::SUCCESS;
    }
}
