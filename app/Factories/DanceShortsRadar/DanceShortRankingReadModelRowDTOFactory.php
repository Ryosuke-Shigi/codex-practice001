<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelBuildInputDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelRowDTO;

/**
 * snapshot query の row を read model 保存用 DTO へ詰め替える Factory です。
 */
final readonly class DanceShortRankingReadModelRowDTOFactory
{
    public function fromRankingRow(
        object $row,
        RankingReadModelBuildInputDTO $input,
        int $rank,
    ): RankingReadModelRowDTO {
        return new RankingReadModelRowDTO(
            patternBuildId: $input->patternBuildId,
            patternKey: $input->patternKey,
            rankingType: $input->rankingType,
            scope: $input->scope,
            comparisonDays: $input->comparisonDays,
            sortKey: $input->sortKey,
            rank: $rank,
            videoId: (int) $row->video_id,
            youtubeVideoId: (string) $row->youtube_video_id,
            title: (string) $row->title,
            channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
            thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
            youtubeUrl: $row->url === null ? null : (string) $row->url,
            publishedAt: $row->published_at === null ? null : (string) $row->published_at,
            regionCode: (string) $row->region_code,
            regionName: (string) $row->region_name,
            sourceRegionCode: null,
            sourceRegionLabel: null,
            currentViewCount: (int) $row->current_view_count,
            previousViewCount: $row->previous_view_count === null ? null : (int) $row->previous_view_count,
            viewCountDelta: $row->view_count_delta === null ? null : (int) $row->view_count_delta,
            viewGrowthRate: $row->view_growth_rate === null ? null : (float) $row->view_growth_rate,
            viewsPerHour: $row->views_per_hour === null ? null : (float) $row->views_per_hour,
            likeCount: $row->like_count === null ? null : (int) $row->like_count,
            commentCount: $row->comment_count === null ? null : (int) $row->comment_count,
            currentCollectedAt: (string) $row->current_collected_at,
            previousCollectedAt: $row->previous_collected_at === null ? null : (string) $row->previous_collected_at,
            hasPreviousSnapshot: $row->previous_snapshot_id !== null,
            japanCurrentViewCount: null,
            japanPreviousViewCount: null,
            japanViewCountDelta: null,
            japanViewGrowthRate: null,
            japanViewsPerHour: null,
            japanCurrentCollectedAt: null,
            japanPreviousCollectedAt: null,
            japanComparisonStatus: null,
            observationNote: null,
            calculatedAt: $input->calculatedAt,
        );
    }
}
