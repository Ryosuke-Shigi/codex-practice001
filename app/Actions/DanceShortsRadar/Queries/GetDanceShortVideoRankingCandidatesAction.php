<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;
use App\Support\ApplicationTimeZone;
use Carbon\CarbonImmutable;

class GetDanceShortVideoRankingCandidatesAction
{
    public function __construct(
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
    ) {}

    public function execute(DanceShortVideoRankingConditionDTO $condition): DanceShortVideoRankingListDTO
    {
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($condition->comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($condition->sortKey);
        $limit = max(1, $condition->limit);
        $records = [];
        $currentSnapshots = $this->snapshotRepository->latestRankingSnapshotsByRegionCode(
            regionCode: $condition->regionCode,
        );

        foreach ($currentSnapshots as $currentSnapshot) {
            $currentCollectedAt = $currentSnapshot->collected_at;
            $cutoffAt = $currentCollectedAt->copy()->subDays($comparisonDays);
            $previousSnapshot = $this->snapshotRepository->latestSnapshotAtOrBefore(
                videoId: (int) $currentSnapshot->video_id,
                regionId: (int) $currentSnapshot->region_id,
                cutoffAt: $cutoffAt,
            );

            if ($previousSnapshot === null) {
                $previousSnapshot = $this->snapshotRepository->latestSnapshotBefore(
                    videoId: (int) $currentSnapshot->video_id,
                    regionId: (int) $currentSnapshot->region_id,
                    currentCollectedAt: $currentCollectedAt,
                    currentSnapshotId: (int) $currentSnapshot->getKey(),
                );
            }

            $metrics = $this->snapshotMetricService->calculateSnapshotMetrics(
                previousViewCount: $previousSnapshot?->view_count,
                previousCollectedAt: $previousSnapshot?->collected_at,
                currentViewCount: $currentSnapshot->view_count,
                currentCollectedAt: $currentCollectedAt,
            );
            $video = $currentSnapshot->video;
            $region = $currentSnapshot->region;

            $records[] = [
                'item' => new DanceShortVideoRankingItemDTO(
                    videoId: (int) $video->getKey(),
                    youtubeVideoId: (string) $video->youtube_video_id,
                    title: (string) $video->title,
                    channelTitle: $video->channel_title === null ? null : (string) $video->channel_title,
                    thumbnailUrl: $video->thumbnail_url === null ? null : (string) $video->thumbnail_url,
                    url: $video->url === null ? null : (string) $video->url,
                    publishedAt: $video->published_at,
                    regionCode: (string) $region->code,
                    regionName: (string) $region->name,
                    currentViewCount: (int) $currentSnapshot->view_count,
                    previousViewCount: $previousSnapshot === null ? null : (int) $previousSnapshot->view_count,
                    viewCountDelta: $metrics['viewCountDelta'],
                    viewGrowthRate: $metrics['viewGrowthRate'],
                    viewsPerHour: $metrics['viewsPerHour'],
                    likeCount: $currentSnapshot->like_count === null ? null : (int) $currentSnapshot->like_count,
                    commentCount: $currentSnapshot->comment_count === null ? null : (int) $currentSnapshot->comment_count,
                    currentCollectedAt: $currentCollectedAt,
                    previousCollectedAt: $previousSnapshot?->collected_at,
                    comparisonDays: $comparisonDays,
                    hasPreviousSnapshot: $previousSnapshot !== null,
                ),
                'currentSnapshotId' => (int) $currentSnapshot->getKey(),
            ];
        }

        return new DanceShortVideoRankingListDTO(
            array_slice($this->sortedRecords($records, $sortKey), 0, $limit),
        );
    }

    /**
     * @param  array<int, string>  $regionCodes
     */
    public function executeWindowForRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
        int $startRank,
        int $windowSize,
    ): DanceShortVideoRankingListDTO {
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($sortKey);

        return new DanceShortVideoRankingListDTO(array_map(
            fn (object $row): DanceShortVideoRankingItemDTO => $this->rankingItemFromWindowRow($row, $comparisonDays),
            $this->snapshotRepository->rankingRowsWindowByRegionCodes(
                regionCodes: $regionCodes,
                comparisonDays: $comparisonDays,
                sortKey: $sortKey,
                startRank: $startRank,
                windowSize: $windowSize,
            ),
        ));
    }

    /**
     * @param  array<int, string>  $regionCodes
     */
    public function executeForRegionCodes(
        array $regionCodes,
        int $comparisonDays,
        string $sortKey,
    ): DanceShortVideoRankingListDTO {
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($sortKey);

        return new DanceShortVideoRankingListDTO(array_map(
            fn (object $row): DanceShortVideoRankingItemDTO => $this->rankingItemFromWindowRow($row, $comparisonDays),
            $this->snapshotRepository->rankingRowsByRegionCodes(
                regionCodes: $regionCodes,
                comparisonDays: $comparisonDays,
                sortKey: $sortKey,
            ),
        ));
    }

    /**
     * @param  array<int, DanceShortVideoRankingItemDTO>  $items
     * @return array<int, DanceShortVideoRankingItemDTO>
     */
    public function sortedItems(array $items, string $sortKey): array
    {
        $records = array_map(
            fn (DanceShortVideoRankingItemDTO $item): array => [
                'item' => $item,
                'currentSnapshotId' => 0,
            ],
            $items,
        );

        return $this->sortedRecords($records, $sortKey);
    }

    /**
     * @param  array<int, array{item: DanceShortVideoRankingItemDTO, currentSnapshotId: int}>  $records
     * @return array<int, DanceShortVideoRankingItemDTO>
     */
    private function sortedRecords(array $records, string $sortKey): array
    {
        usort($records, function (
            array $firstRecord,
            array $secondRecord,
        ) use ($sortKey): int {
            $first = $firstRecord['item'];
            $second = $secondRecord['item'];

            if ($first->hasPreviousSnapshot !== $second->hasPreviousSnapshot) {
                return $first->hasPreviousSnapshot ? -1 : 1;
            }

            if (! $first->hasPreviousSnapshot && ! $second->hasPreviousSnapshot) {
                return strcmp($second->currentCollectedAt->toDateTimeString(), $first->currentCollectedAt->toDateTimeString())
                    ?: ($secondRecord['currentSnapshotId'] <=> $firstRecord['currentSnapshotId'])
                    ?: ($first->videoId <=> $second->videoId);
            }

            $firstValue = $this->sortValue($first, $sortKey);
            $secondValue = $this->sortValue($second, $sortKey);

            if ($firstValue === null && $secondValue !== null) {
                return 1;
            }

            if ($firstValue !== null && $secondValue === null) {
                return -1;
            }

            return ($secondValue <=> $firstValue)
                ?: (($second->viewCountDelta ?? PHP_INT_MIN) <=> ($first->viewCountDelta ?? PHP_INT_MIN))
                ?: ($second->currentViewCount <=> $first->currentViewCount)
                ?: ($first->videoId <=> $second->videoId);
        });

        return array_map(
            fn (array $record): DanceShortVideoRankingItemDTO => $record['item'],
            $records,
        );
    }

    private function sortValue(DanceShortVideoRankingItemDTO $item, string $sortKey): int|float|null
    {
        return match ($sortKey) {
            'view_count_delta' => $item->viewCountDelta,
            'view_growth_rate' => $item->viewGrowthRate,
            'current_view_count' => $item->currentViewCount,
            default => $item->viewsPerHour,
        };
    }

    private function rankingItemFromWindowRow(object $row, int $comparisonDays): DanceShortVideoRankingItemDTO
    {
        $timezone = ApplicationTimeZone::name();

        return new DanceShortVideoRankingItemDTO(
            videoId: (int) $row->video_id,
            youtubeVideoId: (string) $row->youtube_video_id,
            title: (string) $row->title,
            channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
            thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
            url: $row->url === null ? null : (string) $row->url,
            publishedAt: $row->published_at === null ? null : CarbonImmutable::parse((string) $row->published_at, $timezone),
            regionCode: (string) $row->region_code,
            regionName: (string) $row->region_name,
            currentViewCount: (int) $row->current_view_count,
            previousViewCount: $row->previous_view_count === null ? null : (int) $row->previous_view_count,
            viewCountDelta: $row->view_count_delta === null ? null : (int) $row->view_count_delta,
            viewGrowthRate: $row->view_growth_rate === null ? null : (float) $row->view_growth_rate,
            viewsPerHour: $row->views_per_hour === null ? null : (float) $row->views_per_hour,
            likeCount: $row->like_count === null ? null : (int) $row->like_count,
            commentCount: $row->comment_count === null ? null : (int) $row->comment_count,
            currentCollectedAt: CarbonImmutable::parse((string) $row->current_collected_at, $timezone),
            previousCollectedAt: $row->previous_collected_at === null ? null : CarbonImmutable::parse((string) $row->previous_collected_at, $timezone),
            comparisonDays: $comparisonDays,
            hasPreviousSnapshot: $row->previous_snapshot_id !== null,
        );
    }
}
