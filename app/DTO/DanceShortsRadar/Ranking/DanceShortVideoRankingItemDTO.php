<?php

namespace App\DTO\DanceShortsRadar\Ranking;

use Carbon\CarbonInterface;

final readonly class DanceShortVideoRankingItemDTO
{
    /*
     * previousViewCount / viewCountDelta / viewGrowthRate / viewsPerHour は null を許容します。
     * 取得開始直後の current 1件だけの動画も通常ランキングの fallback 候補として表示するためです。
     * null を 0 に潰すと「比較元が無い」と「実際に増えていない」が混ざるので、DTO 境界で区別を保ちます。
     */
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
        public ?int $previousViewCount,
        public ?int $viewCountDelta,
        public ?float $viewGrowthRate,
        public ?float $viewsPerHour,
        public ?int $likeCount,
        public ?int $commentCount,
        public CarbonInterface $currentCollectedAt,
        public ?CarbonInterface $previousCollectedAt,
        public int $comparisonDays,
        public bool $hasPreviousSnapshot,
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
     *     previousViewCount: int|null,
     *     viewCountDelta: int|null,
     *     viewGrowthRate: float|null,
     *     viewsPerHour: float|null,
     *     likeCount: int|null,
     *     commentCount: int|null,
     *     currentCollectedAt: string,
     *     previousCollectedAt: string|null,
     *     comparisonDays: int,
     *     hasPreviousSnapshot: bool
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
            'likeCount' => $this->likeCount,
            'commentCount' => $this->commentCount,
            'currentCollectedAt' => $this->currentCollectedAt->toIso8601String(),
            'previousCollectedAt' => $this->previousCollectedAt?->toIso8601String(),
            'comparisonDays' => $this->comparisonDays,
            'hasPreviousSnapshot' => $this->hasPreviousSnapshot,
        ];
    }
}
