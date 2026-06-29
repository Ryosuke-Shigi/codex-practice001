<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use App\DTO\DanceShortsRadar\RankingReadModel\RankingReadModelSortKey;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
use Carbon\CarbonImmutable;

/**
 * 上昇候補表示用の表示カード Strategy です。
 *
 * 表示時は active read model の RISING pattern だけを参照します。
 * snapshot query は read model 生成 Strategy 側の入力取得に閉じます。
 */
final readonly class RisingDisplayCardStrategy implements DanceShortDisplayCardStrategyInterface
{
    public function __construct(
        private DanceShortRankingReadModelRepositoryInterface $readModelRepository,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
    ) {}

    /**
     * 上昇候補の表示カード window を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        $startRank = $condition->startRank;
        $selectedRank = null;
        $scope = DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE;
        $sortKey = RankingReadModelSortKey::RISING;

        if ($condition->selectedVideoId !== null) {
            $selectedRank = $this->readModelRepository->activeRankForVideo(
                scope: $scope,
                comparisonDays: $condition->comparisonDays,
                sortKey: $sortKey,
                videoId: $condition->selectedVideoId,
            );
            $startRank = $selectedRank === null
                ? 1
                : $this->displayCardWindowService->startRankAroundSelectedRank(
                    selectedRank: $selectedRank,
                    totalItemCount: $this->readModelRepository->activeRowCount(
                        scope: $scope,
                        comparisonDays: $condition->comparisonDays,
                        sortKey: $sortKey,
                    ),
                    windowSize: $condition->windowSize,
                );
        }

        $candidates = $this->risingCandidatesFromRows($this->readModelRepository->activeRowsWindow(
            scope: $scope,
            comparisonDays: $condition->comparisonDays,
            sortKey: $sortKey,
            startRank: $startRank,
            windowSize: $condition->windowSize,
        ));
        $window = $this->displayCardWindowService->buildWindowFromLookahead(
            lookaheadItems: $candidates,
            startRank: $startRank,
            windowSize: $condition->windowSize,
        );

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
     * @param  array<int, object>  $rows
     * @return array<int, DanceShortVideoRisingCandidateDTO>
     */
    private function risingCandidatesFromRows(array $rows): array
    {
        $candidates = [];

        foreach ($rows as $row) {
            $candidate = $this->risingCandidateFromRow($row);

            if ($candidate !== null) {
                $candidates[] = $candidate;
            }
        }

        return $candidates;
    }

    private function risingCandidateFromRow(object $row): ?DanceShortVideoRisingCandidateDTO
    {
        if ($row->source_region_code === null || $row->view_count_delta === null || $row->japan_comparison_status === null) {
            return null;
        }

        $sourceRegionCode = (string) $row->source_region_code;

        return new DanceShortVideoRisingCandidateDTO(
            videoId: (int) $row->video_id,
            youtubeVideoId: (string) $row->youtube_video_id,
            title: (string) $row->title,
            channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
            thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
            url: $row->youtube_url === null ? null : (string) $row->youtube_url,
            publishedAt: $row->published_at === null ? null : $this->parseApplicationDate((string) $row->published_at),
            sourceRegionCode: $sourceRegionCode,
            sourceRegionName: $row->source_region_label === null ? $sourceRegionCode : (string) $row->source_region_label,
            sourceCurrentViewCount: (int) $row->current_view_count,
            sourcePreviousViewCount: $row->previous_view_count === null ? null : (int) $row->previous_view_count,
            sourceViewCountDelta: (int) $row->view_count_delta,
            sourceViewGrowthRate: $row->view_growth_rate === null ? null : (float) $row->view_growth_rate,
            sourceViewsPerHour: $row->views_per_hour === null ? null : (float) $row->views_per_hour,
            sourceCurrentCollectedAt: $this->parseApplicationDate((string) $row->current_collected_at),
            sourcePreviousCollectedAt: $row->previous_collected_at === null ? null : $this->parseApplicationDate((string) $row->previous_collected_at),
            japanCurrentViewCount: $row->japan_current_view_count === null ? null : (int) $row->japan_current_view_count,
            japanPreviousViewCount: $row->japan_previous_view_count === null ? null : (int) $row->japan_previous_view_count,
            japanViewCountDelta: $row->japan_view_count_delta === null ? null : (int) $row->japan_view_count_delta,
            japanViewGrowthRate: $row->japan_view_growth_rate === null ? null : (float) $row->japan_view_growth_rate,
            japanViewsPerHour: $row->japan_views_per_hour === null ? null : (float) $row->japan_views_per_hour,
            japanCurrentCollectedAt: $row->japan_current_collected_at === null ? null : $this->parseApplicationDate((string) $row->japan_current_collected_at),
            japanPreviousCollectedAt: $row->japan_previous_collected_at === null ? null : $this->parseApplicationDate((string) $row->japan_previous_collected_at),
            japanComparisonStatus: (string) $row->japan_comparison_status,
            comparisonDays: (int) $row->comparison_days,
        );
    }

    private function parseApplicationDate(string $value): CarbonImmutable
    {
        return CarbonImmutable::parse($value, (string) config('app.timezone', 'Asia/Tokyo'));
    }
}
