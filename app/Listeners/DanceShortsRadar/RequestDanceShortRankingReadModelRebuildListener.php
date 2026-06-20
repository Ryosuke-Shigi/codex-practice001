<?php

namespace App\Listeners\DanceShortsRadar;

use App\Events\DanceShortsRadar\DanceShortRankingReadModelRefreshRequested;
use App\Jobs\DanceShortsRadar\BuildDanceShortRankingReadModelsJob;

/**
 * ranking read model 再生成要求を Queue Job へつなぐ Listener です。
 */
final readonly class RequestDanceShortRankingReadModelRebuildListener
{
    public function handle(DanceShortRankingReadModelRefreshRequested $event): void
    {
        BuildDanceShortRankingReadModelsJob::dispatch();
    }
}
