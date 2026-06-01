<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\CleanupDanceShortVideoSnapshotsAction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class CleanupDanceShortVideoSnapshotsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 120;

    public bool $failOnTimeout = true;

    public function handle(CleanupDanceShortVideoSnapshotsAction $action): void
    {
        /*
         * Job は Scheduler / Queue worker から見た cleanup の実行単位です。
         *
         * snapshot の保持期間、削除 cutoff、物理削除 query はこの Job へ書きません。
         * それらは既存の CleanupDanceShortVideoSnapshotsAction が Service / Repository へ委譲します。
         * ここを Action 呼び出しだけに保つことで、手動 command と Scheduler の入口が増えても
         * 削除条件が分岐せず、YouTube 同期 Job と同じ非同期境界で扱えます。
         */
        $action->execute();
    }

    public function failed(?Throwable $exception): void
    {
        /*
         * 現段階では cleanup 専用の履歴テーブルや失敗通知は作りません。
         * failed hook だけ用意し、後続で運用ログを追加するときも Job の外側の呼び出し方を
         * 変えずに終端処理を接続できるようにしておきます。
         */
        //
    }
}
