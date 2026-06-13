<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\RefreshDanceShortVideoSnapshotsAction;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * 保存済み active 動画の snapshot 専用同期を Queue で実行する Job です。
 *
 * `dance-short:sync-snapshots` から投入され、Job 全体を固定 uniqueId で一意化します。
 * 動画選定、JST 12時間枠、保存/更新判断は Action / Service / Repository 側の責務です。
 */
class SyncDanceShortVideoSnapshotsJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public int $uniqueFor = 1800;

    /**
     * snapshot 専用同期全体の多重実行を防ぐための固定キーを返します。
     */
    public function uniqueId(): string
    {
        return 'dance-short-video-snapshots-refresh';
    }

    /**
     * snapshot 専用同期 Action を呼び出す Queue worker 側の入口です。
     */
    public function handle(RefreshDanceShortVideoSnapshotsAction $action): void
    {
        /*
         * Job は snapshot 専用同期 Action を呼ぶだけにします。
         * 同時実行防止は ShouldBeUnique の固定 uniqueId で Job 全体にかけ、
         * 動画ID単位や地域単位の排他にはしません。
         */
        $action->execute();
    }

    /**
     * 失敗時 hook です。
     *
     * 同期結果を永続化する status model は現時点では持たないため、ここでは追加の副作用を持たせません。
     */
    public function failed(?Throwable $exception): void
    {
        //
    }
}
