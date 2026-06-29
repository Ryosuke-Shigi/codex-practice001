<?php

namespace App\Listeners\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\DispatchDanceShortRankingReadModelPatternsAction;
use App\Events\DanceShortsRadar\DanceShortRankingReadModelRefreshRequested;

/**
 * ranking read model 再生成要求を enabled pattern Job dispatch へつなぐ Listener です。
 */
final readonly class RequestDanceShortRankingReadModelRebuildListener
{
    public function __construct(
        private DispatchDanceShortRankingReadModelPatternsAction $dispatchAction,
    ) {}

    public function handle(DanceShortRankingReadModelRefreshRequested $event): void
    {
        $this->dispatchAction->execute();
    }
}
