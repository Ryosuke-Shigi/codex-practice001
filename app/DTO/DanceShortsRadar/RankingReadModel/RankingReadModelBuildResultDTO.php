<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

use Carbon\CarbonInterface;

/**
 * ランキング read model 一括生成の結果を運ぶ DTO です。
 */
final readonly class RankingReadModelBuildResultDTO
{
    public function __construct(
        public string $buildId,
        public int $normalPatternCount,
        public int $risingPatternCount,
        public int $insertedRowCount,
        public CarbonInterface $calculatedAt,
    ) {}

    public function patternCount(): int
    {
        return $this->normalPatternCount + $this->risingPatternCount;
    }
}
