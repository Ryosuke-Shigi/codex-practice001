<?php

namespace App\Strategies\DanceShortsRadar\DisplayCards;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use App\Repositories\DanceShortsRadar\DanceShortRankingReadModelRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
use Carbon\CarbonImmutable;

/**
 * RISING タブ用の表示カード Strategy です。
 *
 * 事前生成済みの read model row を表示カード用 DTO へ詰め替えます。
 * 生成時の SQL 条件と JP 比較状態は read model 側で確定済みとして受け取り、
 * window 切り出しは DanceShortDisplayCardWindowService に分けます。
 */
final readonly class RisingDisplayCardStrategy implements DanceShortDisplayCardStrategyInterface
{
    public function __construct(
        private DanceShortRankingReadModelRepositoryInterface $readModelRepository,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
    ) {}

    /**
     * 上昇候補タブに表示するカード window を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        $scope = DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE;
        $startRank = $condition->startRank;
        $selectedRank = null;

        if ($condition->selectedVideoId !== null) {
            $selectedRank = $this->readModelRepository->activeRankForVideo(
                scope: $scope,
                comparisonDays: $condition->comparisonDays,
                sortKey: null,
                videoId: $condition->selectedVideoId,
            );

            if ($selectedRank !== null) {
                $startRank = $this->displayCardWindowService->startRankAroundSelectedRank(
                    selectedRank: $selectedRank,
                    totalItemCount: $this->readModelRepository->activeRowCount(
                        scope: $scope,
                        comparisonDays: $condition->comparisonDays,
                        sortKey: null,
                    ),
                    windowSize: $condition->windowSize,
                );
            } else {
                $startRank = 1;
            }
        }

        $rows = $this->readModelRepository->activeRowsWindow(
            scope: $scope,
            comparisonDays: $condition->comparisonDays,
            sortKey: null,
            startRank: $startRank,
            windowSize: $condition->windowSize,
        );
        $candidates = array_map(
            fn (object $row): DanceShortVideoRisingCandidateDTO => $this->risingCandidateFromRow($row, $condition->comparisonDays),
            $rows,
        );
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

    private function risingCandidateFromRow(object $row, int $comparisonDays): DanceShortVideoRisingCandidateDTO
    {
        /*
         * Repository row は事前生成済みの RISING read model です。
         * Strategy は表示カード用 DTO への詰め替えだけを担当し、レスポンス配列化は Responder に残します。
         */
        $sourceViewCountDelta = (int) $row->view_count_delta;

        return new DanceShortVideoRisingCandidateDTO(
            videoId: (int) $row->video_id,
            youtubeVideoId: (string) $row->youtube_video_id,
            title: (string) $row->title,
            channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
            thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
            url: $row->youtube_url === null ? null : (string) $row->youtube_url,
            publishedAt: $row->published_at === null ? null : $this->parseApplicationDate((string) $row->published_at),
            sourceRegionCode: (string) $row->source_region_code,
            sourceRegionName: (string) $row->source_region_label,
            sourceCurrentViewCount: (int) $row->current_view_count,
            sourcePreviousViewCount: $row->previous_view_count === null ? null : (int) $row->previous_view_count,
            sourceViewCountDelta: $sourceViewCountDelta,
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
            comparisonDays: $comparisonDays,
        );
    }

    private function parseApplicationDate(string $value): CarbonImmutable
    {
        return CarbonImmutable::parse($value, (string) config('app.timezone', 'Asia/Tokyo'));
    }
}
