<?php

use App\Jobs\ApiCatalog\SyncApiCatalogJob;
use App\Jobs\DanceShortsRadar\CleanupDanceShortVideoSnapshotsJob;
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
Schedule::job(new SyncApiCatalogJob)
    ->dailyAt('03:00')
    ->name('api-catalog-sync')
    ->withoutOverlapping();

/*
 * DanceShortsRadar の自動同期入口です。
 *
 * この Scheduler は「3時間ごとに同期 command を呼ぶかどうか」だけを担当します。
 * YouTube API 呼び出し、動画保存、snapshot 保存、cleanup 実行は dance-short:sync
 * 以降の Action / Service / Repository 側に閉じ、Scheduler へ同期本体の責務を混ぜません。
 *
 * search keyword は JP / US / KR 各3件、合計9件です。
 * 3時間ごとの1日8回実行にすることで、search.list は最大72回/日に収めます。
 *
 * local で scheduler コンテナや schedule:run を動かしても YouTube Data API を消費しないように、
 * DANCE_SHORT_SYNC_ENABLED=true を明示した環境だけ command 実行を許可します。
 * when() の gate は実行時に評価されるため、schedule:list には表示されても false 時は Job が積まれません。
 */
Schedule::command('dance-short:sync')
    ->cron('0 */3 * * *')
    ->name('dance-short-video-sync')
    ->withoutOverlapping()
    ->when(fn (): bool => (bool) config('dance_short.sync_enabled'));

/*
 * DanceShortsRadar の page2 同期入口です。
 *
 * 通常同期の検索条件は崩さず、DB 上で expanded 扱いにした keyword だけを1日2回 page2 以降まで
 * 追加取得します。06:30 / 18:30 は通常同期の 3時間ごとの実行窓と重ならない時刻です。
 */
Schedule::command('dance-short:sync-page2')
    ->twiceDailyAt(6, 18, 30)
    ->name('dance-short-video-page2-sync')
    ->withoutOverlapping()
    ->when(fn (): bool => (bool) config('dance_short.sync_enabled'));

/*
 * DanceShortsRadar の snapshot 専用同期入口です。
 *
 * 保存済み active 動画を videos.list で継続観測するための command を、毎時15分・45分に Queue へ
 * 投入します。既存 search 同期の 00分、page2 同期の 30分とは重ならない実行窓にします。
 *
 * videos.list も YouTube Data API quota を使うため、既存の DANCE_SHORT_SYNC_ENABLED gate で
 * 明示的に有効化した環境だけ command 実行を許可します。
 */
Schedule::command('dance-short:sync-snapshots')
    ->cron((string) config('dance_short.snapshot_refresh.cron'))
    ->name('dance-short-video-snapshot-sync')
    ->withoutOverlapping()
    ->when(fn (): bool => (bool) config('dance_short.sync_enabled'));

/*
 * DanceShortsRadar の snapshot cleanup 入口です。
 *
 * cleanup は YouTube API を呼ばない DB maintenance なので、同期 Job の env gate とは切り離して
 * 1日1回 Queue へ投入します。保持期間の読み取り、cutoff 算出、物理削除 query は
 * CleanupDanceShortVideoSnapshotsJob から既存 Action / Service / Repository へ委譲します。
 *
 * Scheduler には「毎日いつ Job を積むか」だけを置き、DANCE_SHORT_SNAPSHOT_RETENTION_DAYS の解釈や
 * dance_short_video_snapshots の削除条件はここへ書きません。
 */
Schedule::job(new CleanupDanceShortVideoSnapshotsJob)
    ->dailyAt('04:30')
    ->name('dance-short-snapshot-cleanup')
    ->withoutOverlapping();
