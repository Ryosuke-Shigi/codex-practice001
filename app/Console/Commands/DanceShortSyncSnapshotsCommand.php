<?php

namespace App\Console\Commands;

use App\Jobs\DanceShortsRadar\SyncDanceShortVideoSnapshotsJob;
use Illuminate\Console\Command;

/**
 * DanceShortsRadar の snapshot 専用同期 Job を投入する Artisan Command です。
 *
 * 手動実行と Scheduler の入口を共通化し、保存済み active 動画の選定や12時間枠判断は Job / Action 側へ分けます。
 */
class DanceShortSyncSnapshotsCommand extends Command
{
    protected $signature = 'dance-short:sync-snapshots';

    protected $description = 'Dispatch the DanceShortsRadar saved active video snapshot sync job.';

    /**
     * snapshot 専用同期 Job を Queue へ投入します。
     */
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
