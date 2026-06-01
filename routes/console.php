<?php

use App\Jobs\ApiCatalog\SyncApiCatalogJob;
use App\Jobs\DanceShortsRadar\CleanupDanceShortVideoSnapshotsJob;
use App\Jobs\DanceShortsRadar\SyncDanceShortVideosJob;
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

/*
 * DanceShortsRadar の自動同期入口です。
 *
 * この Scheduler は「1時間ごとに同期 Job を Queue へ積むかどうか」だけを担当します。
 * YouTube API 呼び出し、動画保存、snapshot 保存、cleanup 実行は SyncDanceShortVideosJob
 * 以降の Action / Service / Repository 側に閉じ、Scheduler へ同期本体の責務を混ぜません。
 *
 * quota は現時点で 3 地域 x 1時間ごと x search.list 1回を上限想定にします。
 * search.list は 1回 100 units のため 1日約 7,200 units、videos.list はバッチ取得前提で少量です。
 * YouTube Data API のデフォルト quota 10,000 units/day を超えないよう、Scheduler 追加と同時に
 * 地域追加、キーワード追加、ページング追加、手動連打対策の拡張は行いません。
 *
 * local で scheduler コンテナや schedule:run を動かしても YouTube Data API を消費しないように、
 * DANCE_SHORT_SYNC_ENABLED=true を明示した環境だけ dispatch を許可します。
 * when() の gate は実行時に評価されるため、schedule:list には表示されても false 時は Job が積まれません。
 */
Schedule::job(new SyncDanceShortVideosJob())
    ->hourly()
    ->name('dance-short-video-sync')
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
Schedule::job(new CleanupDanceShortVideoSnapshotsJob())
    ->dailyAt('04:30')
    ->name('dance-short-snapshot-cleanup')
    ->withoutOverlapping();
