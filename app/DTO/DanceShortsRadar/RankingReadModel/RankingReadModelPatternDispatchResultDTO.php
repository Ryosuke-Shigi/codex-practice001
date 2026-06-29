<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

use Carbon\CarbonInterface;

/**
 * enabled pattern build Job の dispatch 結果を運ぶ DTO です。
 */
final readonly class RankingReadModelPatternDispatchResultDTO
{
    /**
     * @param  array<int, string>  $patternKeys
     */
    public function __construct(
        public int $dispatchedPatternCount,
        public int $normalPatternCount,
        public array $patternKeys,
        public CarbonInterface $dispatchedAt,
    ) {}
}
