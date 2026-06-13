<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\SyncDanceShortPage2VideosAction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * DanceShortsRadar の expanded keyword page2 同期を Queue で実行する Job です。
 *
 * Scheduler / Artisan Command から投入され、同期本体は Command Action へ委譲します。
 * Job には YouTube API の検索条件や保存判断を置かず、非同期実行の timeout / tries 境界だけを持たせます。
 */
class SyncDanceShortPage2VideosJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public bool $failOnTimeout = true;

    /**
     * page2 同期 Action を呼び出す Queue worker 側の入口です。
     *
     * @param  SyncDanceShortPage2VideosAction  $action  expanded keyword の page2 以降を同期する Command Action。
     */
    public function handle(SyncDanceShortPage2VideosAction $action): void
    {
        $action->execute();
    }

    /**
     * 失敗時 hook です。
     *
     * 現時点では永続化する失敗状態を持たないため、例外を飲み込む処理や復旧処理はここに追加しません。
     */
    public function failed(?Throwable $exception): void
    {
        //
    }
}
