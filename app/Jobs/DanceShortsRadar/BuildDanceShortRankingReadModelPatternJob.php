<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelPatternAction;
use App\Services\DanceShortsRadar\DanceShortRankingReadModelBuildLifecycleService;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Throwable;

/**
 * DanceShortsRadar 通常ランキング read model の1 pattern 生成を Queue で実行する Job です。
 */
class BuildDanceShortRankingReadModelPatternJob implements ShouldBeUniqueUntilProcessing, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public int $uniqueFor = 1800;

    public function __construct(public string $patternKey) {}

    public function uniqueId(): string
    {
        return 'dance-short-ranking-read-model-pattern-build:'.$this->patternKey;
    }

    /**
     * @return array<int, WithoutOverlapping>
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping($this->uniqueId()))
                ->releaseAfter(60)
                ->expireAfter(DanceShortRankingReadModelBuildLifecycleService::DEFAULT_LOCK_TTL_SECONDS),
        ];
    }

    public function handle(BuildDanceShortRankingReadModelPatternAction $action): void
    {
        $action->execute($this->patternKey);
    }

    public function failed(?Throwable $exception): void
    {
        //
    }
}
