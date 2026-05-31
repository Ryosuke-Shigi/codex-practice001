<?php

namespace App\Console\Commands;

use App\Actions\DanceShortsRadar\Commands\CleanupDanceShortVideoSnapshotsAction;
use Illuminate\Console\Command;

class DanceShortSnapshotCleanupCommand extends Command
{
    protected $signature = 'dance-short:snapshot:cleanup';

    protected $description = 'Delete DanceShortsRadar snapshots older than the configured retention window.';

    public function handle(CleanupDanceShortVideoSnapshotsAction $action): int
    {
        /*
         * Command は手動実行の入口です。
         * 削除条件の判断、DB query、Scheduler 登録、YouTube API 呼び出しはここに置かず、
         * cleanup Action の結果を標準出力へ表示するだけにします。
         *
         * この command は API quota を消費しない maintenance 操作です。
         * YouTube 同期 scheduler の有効化とは切り離し、必要なときに snapshot 保持期間だけを
         * 確認・実行できる入口として残します。
         */
        $result = $action->execute();

        $this->info(sprintf(
            'DanceShortsRadar snapshot cleanup deleted %d snapshots.',
            $result->deletedSnapshotCount,
        ));

        return self::SUCCESS;
    }
}
