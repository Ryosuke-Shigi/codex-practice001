<?php

namespace App\Jobs\DanceShortsRadar;

use App\Actions\DanceShortsRadar\Commands\BuildDanceShortRankingReadModelsAction;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Throwable;

/**
 * DanceShortsRadar ランキング read model の一括生成を Queue で実行する Job です。
 */
class BuildDanceShortRankingReadModelsJob implements ShouldBeUniqueUntilProcessing, ShouldQueue
{
    use Queueable;

    private const UNIQUE_ID = 'dance-short-ranking-read-model-build';

    public int $tries = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public int $uniqueFor = 1800;

    public function uniqueId(): string
    {
        return self::UNIQUE_ID;
    }

    /**
     * @return array<int, WithoutOverlapping>
     */
    public function middleware(): array
    {
        /*
         * UniqueUntilProcessing は待機中の重複だけをまとめ、処理開始後の更新要求は次回buildとして残します。
         * そのうえで WithoutOverlapping が実行中buildの並走だけを防ぎます。
         */
        return [
            (new WithoutOverlapping(self::UNIQUE_ID))
                ->releaseAfter(60)
                ->expireAfter(900),
        ];
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
