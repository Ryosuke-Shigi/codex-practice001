<?php

namespace App\Console\Commands;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelPatternAction;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelPatternDefinitionDTO;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelPatternService;
use Illuminate\Console\Command;
use Throwable;

/**
 * DanceShortsRadar の通常ランキング read model を1 pattern だけ手動生成する Artisan Command です。
 */
class DanceShortBuildRankingReadModelPatternCommand extends Command
{
    protected $signature = 'dance-shorts-radar:build-ranking-read-model-pattern
        {--type=normal : Ranking type. Only normal is supported here.}
        {--scope= : Active region code.}
        {--comparison-days= : Comparison days.}
        {--sort-key= : Sort key.}';

    protected $description = 'Build one DanceShortsRadar normal ranking read model pattern synchronously.';

    public function handle(
        DanceShortRankingReadModelPatternService $patternService,
        BuildDanceShortRankingReadModelPatternAction $action,
    ): int {
        try {
            $patternKey = $patternService->keyFor(
                rankingType: (string) $this->option('type'),
                scope: (string) $this->option('scope'),
                comparisonDays: (int) $this->option('comparison-days'),
                sortKey: (string) $this->option('sort-key'),
            );
            $result = $action->execute($patternKey);
        } catch (Throwable $exception) {
            $this->error('DanceShortsRadar ranking read model pattern build failed.');
            $this->line('error: '.$exception->getMessage());

            return self::FAILURE;
        }

        if ($result->skipped) {
            $this->warn('DanceShortsRadar ranking read model pattern build skipped.');
            $this->line('pattern_key: '.$result->patternKey);
            $this->line('reason: '.$result->skipReason);
            $this->line('stale_failed_builds: '.$result->staleFailedBuildCount);
            $this->line('stale_deleted_rows: '.$result->staleDeletedRowCount);

            return self::SUCCESS;
        }

        $this->info('DanceShortsRadar ranking read model pattern built.');
        $this->line('pattern_build_id: '.$result->patternBuildId);
        $this->line('pattern_key: '.$result->patternKey);
        $this->line('ranking_type: '.RankingReadModelPatternDefinitionDTO::TYPE_NORMAL);
        $this->line('scope: '.$result->scope);
        $this->line('comparison_days: '.$result->comparisonDays);
        $this->line('sort_key: '.$result->sortKey);
        $this->line('max_rows: '.$result->maxRows);
        $this->line('inserted_rows: '.$result->insertedRowCount);
        $this->line('cleanup_deleted_rows: '.$result->cleanupDeletedRowCount);
        $this->line('stale_failed_builds: '.$result->staleFailedBuildCount);
        $this->line('stale_deleted_rows: '.$result->staleDeletedRowCount);

        return self::SUCCESS;
    }
}
