<?php

use App\Jobs\ApiCatalog\SyncApiCatalogJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Laravel 11 では Scheduler 定義を routes/console.php に置けます。
 * 定期バッチも同期本体の Action / Service を直接呼ばず、手動更新と同じ
 * SyncApiCatalogJob を Queue に積みます。
 *
 * withoutOverlapping は scheduler 側の多重投入を避けるための最低限の保険です。
 * worker 側の排他、同期履歴、失敗ログは別途追加する前提にしています。
 */
Schedule::job(new SyncApiCatalogJob())
    ->dailyAt('03:00')
    ->name('api-catalog-sync')
    ->withoutOverlapping();
