<?php

namespace App\Console\Commands;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelsAction;
use Illuminate\Console\Command;

/**
 * DanceShortsRadar のランキング read model を手動で初期生成する Artisan Command です。
 */
class DanceShortBuildRankingReadModelsCommand extends Command
{
    protected $signature = 'dance-shorts-radar:build-ranking-read-models';

    protected $description = 'Build the DanceShortsRadar ranking read models synchronously.';

    public function handle(BuildDanceShortRankingReadModelsAction $action): int
    {
        /*
         * migration 直後や local 初期化時の手動入口です。
         * 生成対象patternや行生成ロジックは Action 側に集約し、Command は結果表示だけを担当します。
         */
        $result = $action->execute();

        $this->info('DanceShortsRadar ranking read models built.');
        $this->line('build_id: '.$result->buildId);
        $this->line('normal_patterns: '.$result->normalPatternCount);
        $this->line('rising_patterns: '.$result->risingPatternCount);
        $this->line('inserted_rows: '.$result->insertedRowCount);

        return self::SUCCESS;
    }
}
