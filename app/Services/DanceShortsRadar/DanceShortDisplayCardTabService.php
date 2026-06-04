<?php

namespace App\Services\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;

/*
 * displayCardField 取得前のタブ状態を解決する Service です。
 *
 * Request は形式バリデーション、Action は入口手順、Factory は Strategy 選択に集中させるため、
 * URL query の tab / region 値を画面タブとして安全な値へ寄せる処理をここへ分けます。
 */
class DanceShortDisplayCardTabService
{
    /**
     * @param  array<int, DanceShortVideoRankingRegionDTO>  $regions
     */
    public function selectedTabCode(?string $requestedRegionCode, array $regions): string
    {
        if ($requestedRegionCode === null || strtoupper($requestedRegionCode) === DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE) {
            return DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE;
        }

        if (strtoupper($requestedRegionCode) === DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE) {
            return DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE;
        }

        foreach ($regions as $region) {
            if ($region->code === $requestedRegionCode) {
                return $region->code;
            }
        }

        return DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE;
    }

    /**
     * @param  array<int, DanceShortVideoRankingRegionDTO>  $regions
     */
    public function selectedRegionCode(string $selectedTabCode, array $regions): ?string
    {
        foreach ($regions as $region) {
            if ($region->code === $selectedTabCode) {
                return $region->code;
            }
        }

        return null;
    }

    /**
     * @param  array<int, DanceShortVideoRankingRegionDTO>  $regions
     * @return array<int, string>
     */
    public function activeRegionCodes(array $regions): array
    {
        return array_map(
            fn (DanceShortVideoRankingRegionDTO $region): string => $region->code,
            $regions,
        );
    }
}
