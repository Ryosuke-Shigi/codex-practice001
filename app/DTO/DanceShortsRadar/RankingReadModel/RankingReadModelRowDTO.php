<?php

namespace App\DTO\DanceShortsRadar\RankingReadModel;

use Carbon\CarbonInterface;

/**
 * dance_short_radar_ranking_read_models へ保存する1順位分の DTO です。
 */
final readonly class RankingReadModelRowDTO
{
    public function __construct(
        public string $buildId,
        public string $scope,
        public int $comparisonDays,
        public ?string $sortKey,
        public int $rank,
        public int $videoId,
        public string $youtubeVideoId,
        public string $title,
        public ?string $channelTitle,
        public ?string $thumbnailUrl,
        public ?string $youtubeUrl,
        public ?string $publishedAt,
        public ?string $regionCode,
        public ?string $regionName,
        public ?string $sourceRegionCode,
        public ?string $sourceRegionLabel,
        public int $currentViewCount,
        public ?int $previousViewCount,
        public ?int $viewCountDelta,
        public ?float $viewGrowthRate,
        public ?float $viewsPerHour,
        public ?int $likeCount,
        public ?int $commentCount,
        public string $currentCollectedAt,
        public ?string $previousCollectedAt,
        public bool $hasPreviousSnapshot,
        public ?int $japanCurrentViewCount,
        public ?int $japanPreviousViewCount,
        public ?int $japanViewCountDelta,
        public ?float $japanViewGrowthRate,
        public ?float $japanViewsPerHour,
        public ?string $japanCurrentCollectedAt,
        public ?string $japanPreviousCollectedAt,
        public ?string $japanComparisonStatus,
        public ?string $observationNote,
        public CarbonInterface $calculatedAt,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $now = $this->calculatedAt->toDateTimeString();

        return [
            'build_id' => $this->buildId,
            'scope' => $this->scope,
            'comparison_days' => $this->comparisonDays,
            'sort_key' => $this->sortKey,
            'rank' => $this->rank,
            'video_id' => $this->videoId,
            'youtube_video_id' => $this->youtubeVideoId,
            'title' => $this->title,
            'channel_title' => $this->channelTitle,
            'thumbnail_url' => $this->thumbnailUrl,
            'youtube_url' => $this->youtubeUrl,
            'published_at' => $this->publishedAt,
            'region_code' => $this->regionCode,
            'region_name' => $this->regionName,
            'source_region_code' => $this->sourceRegionCode,
            'source_region_label' => $this->sourceRegionLabel,
            'current_view_count' => $this->currentViewCount,
            'previous_view_count' => $this->previousViewCount,
            'view_count_delta' => $this->viewCountDelta,
            'view_growth_rate' => $this->viewGrowthRate,
            'views_per_hour' => $this->viewsPerHour,
            'like_count' => $this->likeCount,
            'comment_count' => $this->commentCount,
            'current_collected_at' => $this->currentCollectedAt,
            'previous_collected_at' => $this->previousCollectedAt,
            'has_previous_snapshot' => $this->hasPreviousSnapshot,
            'japan_current_view_count' => $this->japanCurrentViewCount,
            'japan_previous_view_count' => $this->japanPreviousViewCount,
            'japan_view_count_delta' => $this->japanViewCountDelta,
            'japan_view_growth_rate' => $this->japanViewGrowthRate,
            'japan_views_per_hour' => $this->japanViewsPerHour,
            'japan_current_collected_at' => $this->japanCurrentCollectedAt,
            'japan_previous_collected_at' => $this->japanPreviousCollectedAt,
            'japan_comparison_status' => $this->japanComparisonStatus,
            'observation_note' => $this->observationNote,
            'calculated_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
}
