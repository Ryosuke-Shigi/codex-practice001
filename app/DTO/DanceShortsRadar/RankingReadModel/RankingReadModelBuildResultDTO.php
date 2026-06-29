<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

use Carbon\CarbonInterface;

/**
 * ランキング read model 一括生成の結果を運ぶ DTO です。
 */
final readonly class RankingReadModelBuildResultDTO
{
    public function __construct(
        public ?string $buildId,
        public int $normalPatternCount,
        public int $risingPatternCount,
        public int $insertedRowCount,
        public CarbonInterface $calculatedAt,
        public bool $skipped = false,
        public ?string $skipReason = null,
        public int $cleanupDeletedRowCount = 0,
        public int $staleFailedBuildCount = 0,
        public int $staleDeletedRowCount = 0,
    ) {}

    public static function skipped(
        CarbonInterface $calculatedAt,
        string $skipReason,
        int $staleFailedBuildCount = 0,
        int $staleDeletedRowCount = 0,
    ): self {
        return new self(
            buildId: null,
            normalPatternCount: 0,
            risingPatternCount: 0,
            insertedRowCount: 0,
            calculatedAt: $calculatedAt,
            skipped: true,
            skipReason: $skipReason,
            staleFailedBuildCount: $staleFailedBuildCount,
            staleDeletedRowCount: $staleDeletedRowCount,
        );
    }

    public function patternCount(): int
    {
        return $this->normalPatternCount + $this->risingPatternCount;
    }
}
