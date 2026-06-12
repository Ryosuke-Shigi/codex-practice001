<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\RefreshDanceShortVideoSnapshotsAction;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SyncDanceShortVideoSnapshotsJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public int $uniqueFor = 1800;

    public function uniqueId(): string
    {
        return 'dance-short-video-snapshots-refresh';
    }

    public function handle(RefreshDanceShortVideoSnapshotsAction $action): void
    {
        /*
         * Job は snapshot 専用同期 Action を呼ぶだけにします。
         * 同時実行防止は ShouldBeUnique の固定 uniqueId で Job 全体にかけ、
         * 動画ID単位や地域単位の排他にはしません。
         */
        $action->execute();
    }

    public function failed(?Throwable $exception): void
    {
        //
    }
}
