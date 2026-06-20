<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

use Carbon\CarbonInterface;

/**
 * ランキング read model の1パターン生成条件を運ぶ DTO です。
 */
final readonly class RankingReadModelBuildInputDTO
{
    /**
     * @param  array<int, string>  $activeRegionCodes
     */
    public function __construct(
        public string $buildId,
        public string $scope,
        public int $comparisonDays,
        public ?string $sortKey,
        public array $activeRegionCodes,
        public CarbonInterface $calculatedAt,
    ) {}
}
