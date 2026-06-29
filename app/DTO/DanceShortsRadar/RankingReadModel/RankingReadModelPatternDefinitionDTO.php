<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

/**
 * ranking_type + scope + comparison_days + sort_key で決まる read model pattern 定義です。
 */
final readonly class RankingReadModelPatternDefinitionDTO
{
    public const TYPE_NORMAL = 'normal';

    public const TYPE_SUMMARY = 'summary';

    public const TYPE_RISING = 'rising';

    public function __construct(
        public string $patternKey,
        public string $rankingType,
        public string $scope,
        public int $comparisonDays,
        public string $sortKey,
        public int $maxRows,
        public bool $enabled = true,
    ) {}
}
