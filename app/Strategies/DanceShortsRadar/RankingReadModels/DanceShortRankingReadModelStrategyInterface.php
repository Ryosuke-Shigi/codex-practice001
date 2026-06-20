<?php

namespace App\Strategies\DanceShortsRadar\RankingReadModels;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelRowDTO;

interface DanceShortRankingReadModelStrategyInterface
{
    /**
     * @return array<int, RankingReadModelRowDTO>
     */
    public function build(RankingReadModelBuildInputDTO $input): array;
}
