<?php

namespace App\Strategies\DanceShortsRadar\RankingReadModels;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;

/**
 * active region 全体のまとめ ranking read model を生成する Strategy です。
 */
final class AllRankingReadModelStrategy extends RegionRankingReadModelStrategy
{
    public function build(RankingReadModelBuildInputDTO $input): array
    {
        return $this->rowsForRegionCodes($input, $input->activeRegionCodes);
    }
}
