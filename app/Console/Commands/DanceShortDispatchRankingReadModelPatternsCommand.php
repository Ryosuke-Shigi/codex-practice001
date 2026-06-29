<?php

namespace App\Console\Commands;

use App\Actions\DanceShortsRadar\Commands\DispatchDanceShortRankingReadModelPatternsAction;
use Illuminate\Console\Command;

/**
 * DanceShortsRadar の全 enabled ranking read model pattern Job を dispatch する Artisan Command です。
 */
class DanceShortDispatchRankingReadModelPatternsCommand extends Command
{
    protected $signature = 'dance-shorts-radar:dispatch-ranking-read-model-patterns';

    protected $description = 'Dispatch DanceShortsRadar ranking read model pattern build jobs.';

    public function handle(DispatchDanceShortRankingReadModelPatternsAction $action): int
    {
        $result = $action->execute();

        $this->info('DanceShortsRadar ranking read model pattern jobs dispatched.');
        $this->line('normal_patterns: '.$result->normalPatternCount);
        $this->line('summary_patterns: '.$result->summaryPatternCount);
        $this->line('rising_patterns: '.$result->risingPatternCount);
        $this->line('dispatched_patterns: '.$result->dispatchedPatternCount);

        return self::SUCCESS;
    }
}
