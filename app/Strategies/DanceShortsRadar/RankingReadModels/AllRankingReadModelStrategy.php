<?php

namespace App\Strategies\DanceShortsRadar\RankingReadModels;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;

/**
 * ALL タブ用に active region 全体の通常ランキング read model を生成します。
 */
final class AllRankingReadModelStrategy extends RegionRankingReadModelStrategy
{
    public function build(RankingReadModelBuildInputDTO $input): array
    {
        if ($input->sortKey === null) {
            return [];
        }

        return $this->rowsForRegionCodes($input, $input->activeRegionCodes);
    }
}
