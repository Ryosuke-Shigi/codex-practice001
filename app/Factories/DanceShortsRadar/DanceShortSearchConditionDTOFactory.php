<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortSearchConditionDTO;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use Carbon\CarbonImmutable;

class DanceShortSearchConditionDTOFactory
{
    public function fromRegionAndKeyword(
        DanceShortRegion $region,
        DanceShortSearchKeyword $keyword,
        CarbonImmutable $executedAt,
    ): DanceShortSearchConditionDTO {
        /*
         * 通常同期と page2 同期で検索条件を分岐させないための DTO 変換境界です。
         * YouTube API 固有の key / part / type / pageToken は Repository 側に残します。
         */
        return new DanceShortSearchConditionDTO(
            keyword: $keyword->keyword,
            regionCode: $region->code,
            relevanceLanguage: $this->relevanceLanguage($region->code),
            maxResults: $this->discoverMaxResults(),
            publishedAfter: $executedAt->subDays($this->publishedAfterDays())->utc(),
            videoDuration: 'short',
        );
    }

    private function relevanceLanguage(string $regionCode): string
    {
        return match (strtoupper($regionCode)) {
            'JP' => 'ja',
            'KR' => 'ko',
            'US' => 'en',
            default => strtolower($regionCode),
        };
    }

    private function discoverMaxResults(): int
    {
        $maxResults = (int) config('services.youtube.discover_max_results', 50);

        return max(1, min($maxResults, 50));
    }

    private function publishedAfterDays(): int
    {
        return max(0, (int) config('services.youtube.discover_published_after_days', 7));
    }
}
