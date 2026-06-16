<?php

namespace App\DTO\DanceShortsRadar\Ranking;

use Carbon\CarbonInterface;

/*
 * DanceShortsRadar の上昇候補1件を運ぶ DTO です。
 *
 * 上昇候補は DB region ではなく、source region と JP 側の観測状態を比較した結果です。
 * Service が通常ランキング DTO 配列から組み立てる場合も、Strategy が Repository の read model row を
 * 詰め替える場合も、この DTO には比較済みの値だけを保持します。DB 取得、候補判定、Inertia props
 * 生成、表示文言の組み立ては持たせません。
 *
 * sourceViewGrowthRate や japanViewGrowthRate は null を許容します。null を 0 に潰すと
 * 「算出不可」と「実際に伸び率 0」を区別できないため、この境界でも null のまま渡します。
 */
final readonly class DanceShortVideoRisingCandidateDTO
{
    public function __construct(
        public int $videoId,
        public string $youtubeVideoId,
        public string $title,
        public ?string $channelTitle,
        public ?string $thumbnailUrl,
        public ?string $url,
        public ?CarbonInterface $publishedAt,
        public string $sourceRegionCode,
        public string $sourceRegionName,
        public int $sourceCurrentViewCount,
        public ?int $sourcePreviousViewCount,
        public int $sourceViewCountDelta,
        public ?float $sourceViewGrowthRate,
        public ?float $sourceViewsPerHour,
        public CarbonInterface $sourceCurrentCollectedAt,
        public ?CarbonInterface $sourcePreviousCollectedAt,
        public ?int $japanCurrentViewCount,
        public ?int $japanPreviousViewCount,
        public ?int $japanViewCountDelta,
        public ?float $japanViewGrowthRate,
        public ?float $japanViewsPerHour,
        public ?CarbonInterface $japanCurrentCollectedAt,
        public ?CarbonInterface $japanPreviousCollectedAt,
        public string $japanComparisonStatus,
        public int $comparisonDays,
    ) {}

    /**
     * @return array<string, bool|int|float|string|null>
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
            'sourceRegionCode' => $this->sourceRegionCode,
            'sourceRegionName' => $this->sourceRegionName,
            'sourceCurrentViewCount' => $this->sourceCurrentViewCount,
            'sourcePreviousViewCount' => $this->sourcePreviousViewCount,
            'sourceViewCountDelta' => $this->sourceViewCountDelta,
            'sourceViewGrowthRate' => $this->sourceViewGrowthRate,
            'sourceViewsPerHour' => $this->sourceViewsPerHour,
            'sourceCurrentCollectedAt' => $this->sourceCurrentCollectedAt->toIso8601String(),
            'sourcePreviousCollectedAt' => $this->sourcePreviousCollectedAt?->toIso8601String(),
            'japanCurrentViewCount' => $this->japanCurrentViewCount,
            'japanPreviousViewCount' => $this->japanPreviousViewCount,
            'japanViewCountDelta' => $this->japanViewCountDelta,
            'japanViewGrowthRate' => $this->japanViewGrowthRate,
            'japanViewsPerHour' => $this->japanViewsPerHour,
            'japanCurrentCollectedAt' => $this->japanCurrentCollectedAt?->toIso8601String(),
            'japanPreviousCollectedAt' => $this->japanPreviousCollectedAt?->toIso8601String(),
            'japanComparisonStatus' => $this->japanComparisonStatus,
            'comparisonDays' => $this->comparisonDays,
        ];
    }
}
