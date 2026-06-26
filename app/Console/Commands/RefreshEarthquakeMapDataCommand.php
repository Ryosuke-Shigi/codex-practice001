<?php

namespace App\Console\Commands;

use App\Actions\Earthquake\Commands\StartEarthquakeMapRefreshAction;
use Illuminate\Console\Command;

/**
 * Japan Quake Wave Map の統合更新Jobを投入する Artisan Command です。
 *
 * CLI入口として既存Actionを呼ぶだけに留め、XML取得・解析・DB保存・map pin生成はQueue以降へ委譲します。
 */
class RefreshEarthquakeMapDataCommand extends Command
{
    protected $signature = 'earthquake:refresh-map';

    protected $description = 'Dispatch the Japan Quake Wave Map refresh job through the existing queue flow.';

    public function handle(StartEarthquakeMapRefreshAction $action): int
    {
        $syncRunIds = $action->execute();

        $this->info('Earthquake map refresh job dispatched.');
        $this->line('feedEntrySyncRunId: '.$syncRunIds['feedEntrySyncRunId']);
        $this->line('mapPinSyncRunId: '.$syncRunIds['mapPinSyncRunId']);

        return self::SUCCESS;
    }
}
