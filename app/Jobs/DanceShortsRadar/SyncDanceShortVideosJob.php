<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortVideosAction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SyncDanceShortVideosJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public bool $failOnTimeout = true;

    public function handle(SyncDanceShortVideosAction $action): void
    {
        /*
         * Job は Queue worker が拾って実行する箱です。
         * retry / timeout など非同期実行の設定はここに置きますが、同期ユースケースの手順は
         * Action へ委譲します。これにより、後続で YouTube API Repository や保存 Repository を
         * 追加しても、Queue payload と業務ロジックが混ざらない状態を保てます。
         */
        $action->execute();
    }

    public function failed(?Throwable $exception): void
    {
        /*
         * 現段階では同期履歴テーブルや失敗ログ保存をまだ作りません。
         * failed hook だけ先に用意しておき、後続で sync run 管理を追加するときに
         * Job の公開インターフェースを変えずに終端状態の保存先を接続できるようにします。
         */
        //
    }
}
