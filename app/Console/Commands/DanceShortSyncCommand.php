<?php

namespace App\Console\Commands;

use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
use Illuminate\Console\Command;

/**
 * DanceShortsRadar の通常同期Jobを投入する Artisan Command です。
 *
 * CLIからの手動入口として Queue に積むだけに留め、同期本体の業務ロジックは Job / Action へ渡します。
 */
class DanceShortSyncCommand extends Command
{
    protected $signature = 'dance-short:sync';

    protected $description = 'Dispatch the DanceShortsRadar YouTube Data API sync job.';

    public function handle(): int
    {
        /*
         * この artisan command は同期処理の手動入口だけを担当します。
         * YouTube Data API 呼び出し、DB保存、snapshot保存、Shorts判定などは
         * Queue worker が実行する Job / Action / 後続 Repository・Service の責務です。
         *
         * Command で同期本体を直接呼ばないことで、手動実行時も HTTP や scheduler など
         * 将来の別入口と同じ Queue 経由の流れに揃えられます。
         */
        SyncDanceShortVideosJob::dispatch();

        $this->info('DanceShortsRadar sync job dispatched.');

        return self::SUCCESS;
    }
}
