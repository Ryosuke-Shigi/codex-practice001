<?php

namespace App\DTO\DanceShortsRadar\Ranking;

use Carbon\CarbonInterface;

final readonly class DanceShortVideoRankingItemDTO
{
    public function __construct(
        public int $videoId,
        public string $youtubeVideoId,
        public string $title,
        public ?string $channelTitle,
        public ?string $thumbnailUrl,
        public ?string $url,
        public ?CarbonInterface $publishedAt,
        public string $regionCode,
        public string $regionName,
        public int $currentViewCount,
        public int $previousViewCount,
        public int $viewCountDelta,
        public ?float $viewGrowthRate,
        public ?float $viewsPerHour,
        public CarbonInterface $currentCollectedAt,
        public CarbonInterface $previousCollectedAt,
        public int $comparisonDays,
    ) {
    }

    /**
     * @return array{
     *     videoId: int,
     *     youtubeVideoId: string,
     *     title: string,
     *     channelTitle: string|null,
     *     thumbnailUrl: string|null,
     *     url: string|null,
     *     publishedAt: string|null,
     *     regionCode: string,
     *     regionName: string,
     *     currentViewCount: int,
     *     previousViewCount: int,
     *     viewCountDelta: int,
     *     viewGrowthRate: float|null,
     *     viewsPerHour: float|null,
     *     currentCollectedAt: string,
     *     previousCollectedAt: string,
     *     comparisonDays: int
     * }
     */
    public function toArray(): array
    {
        return [
            'videoId' => $this->videoId,
            'youtubeVideoId' => $this->youtubeVideoId,
            'title' => $this->title,
            'channelTitle' => $this->channelTitle,
            'thumbnailUrl' => $this->thumbnailUrl,
            'url' => $this->url,
            'publishedAt' => $this->publishedAt?->toIso8601String(),
            'regionCode' => $this->regionCode,
            'regionName' => $this->regionName,
            'currentViewCount' => $this->currentViewCount,
            'previousViewCount' => $this->previousViewCount,
            'viewCountDelta' => $this->viewCountDelta,
            'viewGrowthRate' => $this->viewGrowthRate,
            'viewsPerHour' => $this->viewsPerHour,
            'currentCollectedAt' => $this->currentCollectedAt->toIso8601String(),
            'previousCollectedAt' => $this->previousCollectedAt->toIso8601String(),
            'comparisonDays' => $this->comparisonDays,
        ];
    }
}
