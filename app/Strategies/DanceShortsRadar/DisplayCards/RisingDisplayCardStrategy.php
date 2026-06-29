<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
use App\Services\DanceShortsRadar\DanceShortRisingCandidateService;
use Carbon\CarbonImmutable;

/**
 * 上昇候補表示用の表示カード Strategy です。
 *
 * 上昇候補は read model の500件制限に巻き込まず、snapshot 由来の window を参照します。
 * JP 比較状態の DTO 化と window 切り出しだけを Strategy 側で担当します。
 */
final readonly class RisingDisplayCardStrategy implements DanceShortDisplayCardStrategyInterface
{
    public function __construct(
        private DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
        private DanceShortRisingCandidateService $risingCandidateService,
    ) {}

    /**
     * 上昇候補の表示カード window を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        $startRank = $condition->startRank;
        $selectedRank = null;

        if ($condition->selectedVideoId !== null) {
            $allCandidates = $this->risingCandidatesFromRows($this->snapshotRepository->risingRows(
                sourceRegionCodes: $condition->activeRegionCodes,
                comparisonDays: $condition->comparisonDays,
            ), $condition->comparisonDays);
            $selectedRank = $this->rankForVideo($allCandidates, $condition->selectedVideoId);
            $startRank = $selectedRank === null
                ? 1
                : $this->displayCardWindowService->startRankAroundSelectedRank(
                    selectedRank: $selectedRank,
                    totalItemCount: count($allCandidates),
                    windowSize: $condition->windowSize,
                );
        }

        $rows = $this->snapshotRepository->risingRowsWindow(
            sourceRegionCodes: $condition->activeRegionCodes,
            comparisonDays: $condition->comparisonDays,
            startRank: $startRank,
            windowSize: $condition->windowSize,
        );
        $candidates = $this->risingCandidatesFromRows($rows, $condition->comparisonDays);
        $window = $this->displayCardWindowService->buildWindowFromLookahead(
            lookaheadItems: $candidates,
            startRank: $startRank,
            windowSize: $condition->windowSize,
        );

        if ($condition->selectedVideoId !== null) {
            if ($selectedRank !== null && count($window['visibleItems']) > 0) {
                $window['activeIndex'] = min(
                    max(0, $selectedRank - $startRank),
                    count($window['visibleItems']) - 1,
                );
                $window['activeRank'] = $this->displayCardWindowService->activeRankFor(
                    startRank: $startRank,
                    activeIndex: $window['activeIndex'],
                    hasVisibleCards: true,
                );
            }
        }
        $visibleItems = $window['visibleItems'];
        $activeIndex = $window['activeIndex'] ?? 0;
        $activeRank = $window['activeRank'] ?? $this->displayCardWindowService->activeRankFor(
            startRank: $startRank,
            activeIndex: 0,
            hasVisibleCards: count($visibleItems) > 0,
        );

        return new DanceShortDisplayCardWindowDTO(new DanceShortDisplayCardFieldDTO(
            type: DanceShortDisplayCardFieldDTO::TYPE_RISING,
            visibleCards: new DanceShortDisplayCardListDTO(array_map(
                fn (DanceShortVideoRisingCandidateDTO $item): DanceShortRisingDisplayCardDTO => new DanceShortRisingDisplayCardDTO($item),
                $visibleItems,
            )),
            activeIndex: $activeIndex,
            activeRank: $activeRank,
            pagination: $window['pagination'],
            emptyMessage: count($visibleItems) === 0 ? '表示できる上昇候補はまだありません。' : null,
        ));
    }

    /**
     * @param  array<int, DanceShortVideoRisingCandidateDTO>  $candidates
     */
    private function rankForVideo(array $candidates, int $videoId): ?int
    {
        foreach ($candidates as $index => $candidate) {
            if ($candidate->videoId === $videoId) {
                return $index + 1;
            }
        }

        return null;
    }

    /**
     * @param  array<int, object>  $rows
     * @return array<int, DanceShortVideoRisingCandidateDTO>
     */
    private function risingCandidatesFromRows(array $rows, int $comparisonDays): array
    {
        $candidates = [];

        foreach ($rows as $row) {
            $candidate = $this->risingCandidateFromRow($row, $comparisonDays);

            if ($candidate !== null) {
                $candidates[] = $candidate;
            }
        }

        return $candidates;
    }

    private function risingCandidateFromRow(object $row, int $comparisonDays): ?DanceShortVideoRisingCandidateDTO
    {
        $sourceViewCountDelta = (int) $row->source_view_count_delta;
        $japanViewCountDelta = $row->japan_view_count_delta === null ? null : (int) $row->japan_view_count_delta;
        $japanComparisonStatus = $this->risingCandidateService->japanComparisonStatusForCandidate(
            sourceViewCountDelta: $sourceViewCountDelta,
            hasJapanCurrentSnapshot: $row->japan_current_snapshot_id !== null,
            japanViewCountDelta: $japanViewCountDelta,
        );

        if ($japanComparisonStatus === null) {
            return null;
        }

        return new DanceShortVideoRisingCandidateDTO(
            videoId: (int) $row->video_id,
            youtubeVideoId: (string) $row->youtube_video_id,
            title: (string) $row->title,
            channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
            thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
            url: $row->url === null ? null : (string) $row->url,
            publishedAt: $row->published_at === null ? null : $this->parseApplicationDate((string) $row->published_at),
            sourceRegionCode: (string) $row->source_region_code,
            sourceRegionName: (string) $row->source_region_name,
            sourceCurrentViewCount: (int) $row->source_current_view_count,
            sourcePreviousViewCount: $row->source_previous_view_count === null ? null : (int) $row->source_previous_view_count,
            sourceViewCountDelta: $sourceViewCountDelta,
            sourceViewGrowthRate: $row->source_view_growth_rate === null ? null : (float) $row->source_view_growth_rate,
            sourceViewsPerHour: $row->source_views_per_hour === null ? null : (float) $row->source_views_per_hour,
            sourceCurrentCollectedAt: $this->parseApplicationDate((string) $row->source_current_collected_at),
            sourcePreviousCollectedAt: $row->source_previous_collected_at === null ? null : $this->parseApplicationDate((string) $row->source_previous_collected_at),
            japanCurrentViewCount: $row->japan_current_view_count === null ? null : (int) $row->japan_current_view_count,
            japanPreviousViewCount: $row->japan_previous_view_count === null ? null : (int) $row->japan_previous_view_count,
            japanViewCountDelta: $japanViewCountDelta,
            japanViewGrowthRate: $row->japan_view_growth_rate === null ? null : (float) $row->japan_view_growth_rate,
            japanViewsPerHour: $row->japan_views_per_hour === null ? null : (float) $row->japan_views_per_hour,
            japanCurrentCollectedAt: $row->japan_current_collected_at === null ? null : $this->parseApplicationDate((string) $row->japan_current_collected_at),
            japanPreviousCollectedAt: $row->japan_previous_collected_at === null ? null : $this->parseApplicationDate((string) $row->japan_previous_collected_at),
            japanComparisonStatus: $japanComparisonStatus,
            comparisonDays: $comparisonDays,
        );
    }

    private function parseApplicationDate(string $value): CarbonImmutable
    {
        return CarbonImmutable::parse($value, (string) config('app.timezone', 'Asia/Tokyo'));
    }
}
