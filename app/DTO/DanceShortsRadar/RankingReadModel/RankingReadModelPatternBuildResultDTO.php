<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

use Carbon\CarbonInterface;

/**
 * ランキング read model の1 pattern 生成結果を運ぶ DTO です。
 */
final readonly class RankingReadModelPatternBuildResultDTO
{
    public function __construct(
        public ?string $patternBuildId,
        public string $patternKey,
        public string $rankingType,
        public string $scope,
        public int $comparisonDays,
        public string $sortKey,
        public int $maxRows,
        public int $insertedRowCount,
        public CarbonInterface $calculatedAt,
        public bool $skipped = false,
        public ?string $skipReason = null,
        public int $cleanupDeletedRowCount = 0,
        public int $staleFailedBuildCount = 0,
        public int $staleDeletedRowCount = 0,
    ) {}

    public static function skipped(
        RankingReadModelPatternDefinitionDTO $definition,
        CarbonInterface $calculatedAt,
        string $skipReason,
        int $staleFailedBuildCount = 0,
        int $staleDeletedRowCount = 0,
    ): self {
        return new self(
            patternBuildId: null,
            patternKey: $definition->patternKey,
            rankingType: $definition->rankingType,
            scope: $definition->scope,
            comparisonDays: $definition->comparisonDays,
            sortKey: $definition->sortKey,
            maxRows: $definition->maxRows,
            insertedRowCount: 0,
            calculatedAt: $calculatedAt,
            skipped: true,
            skipReason: $skipReason,
            staleFailedBuildCount: $staleFailedBuildCount,
            staleDeletedRowCount: $staleDeletedRowCount,
        );
    }
}
