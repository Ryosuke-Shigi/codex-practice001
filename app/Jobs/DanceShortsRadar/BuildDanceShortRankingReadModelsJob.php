<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelsAction;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * DanceShortsRadar ランキング read model の一括生成を Queue で実行する Job です。
 */
class BuildDanceShortRankingReadModelsJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public int $uniqueFor = 1800;

    public function uniqueId(): string
    {
        return 'dance-short-ranking-read-model-build';
    }

    public function handle(BuildDanceShortRankingReadModelsAction $action): void
    {
        $action->execute();
    }

    public function failed(?Throwable $exception): void
    {
        //
    }
}
