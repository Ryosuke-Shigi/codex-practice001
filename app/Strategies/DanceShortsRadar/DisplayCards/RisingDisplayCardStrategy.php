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
 * RISING タブ用の表示カード Strategy です。
 *
 * US / KR など source region と JP 側の観測状態を比較する read model を DTO に詰め替えます。
 * Repository query の条件は Repository に、window 切り出しは Service に分けます。
 */
final readonly class RisingDisplayCardStrategy implements DanceShortDisplayCardStrategyInterface
{
    /**
     * @var array<int, string>
     */
    private const SOURCE_REGION_CODES = ['US', 'KR'];

    public function __construct(
        private DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
    ) {}

    /**
     * 上昇候補タブに表示するカード window を返します。
     */
    public function getWindow(
        DanceShortDisplayCardWindowConditionDTO $condition,
    ): DanceShortDisplayCardWindowDTO {
        $sourceRegionCodes = array_values(array_intersect(
            self::SOURCE_REGION_CODES,
            $condition->activeRegionCodes,
        ));
        /*
         * 上昇候補は表示専用タブなので、RISING を DB region として扱いません。
         * active な source region だけで Repository read model を作り、JP との比較条件は
         * Repository の query に閉じます。
         */
        $rows = $condition->selectedVideoId === null
            ? $this->snapshotRepository->risingRowsWindow(
                sourceRegionCodes: $sourceRegionCodes,
                comparisonDays: $condition->comparisonDays,
                startRank: $condition->startRank,
                windowSize: $condition->windowSize,
            )
            : $this->snapshotRepository->risingRows(
                sourceRegionCodes: $sourceRegionCodes,
                comparisonDays: $condition->comparisonDays,
            );
        $candidates = array_map(
            fn (object $row): DanceShortVideoRisingCandidateDTO => $this->risingCandidateFromRow($row, $condition->comparisonDays),
            $rows,
        );
        $window = $condition->selectedVideoId === null
            ? $this->displayCardWindowService->buildWindowFromLookahead(
                lookaheadItems: $candidates,
                startRank: $condition->startRank,
                windowSize: $condition->windowSize,
            )
            : $this->displayCardWindowService->buildWindowAroundSelectedVideo(
                items: $candidates,
                selectedVideoId: $condition->selectedVideoId,
                windowSize: $condition->windowSize,
                videoIdResolver: fn (DanceShortVideoRisingCandidateDTO $item): int => $item->videoId,
            );
        $visibleItems = $window['visibleItems'];
        $activeIndex = $window['activeIndex'] ?? 0;
        $activeRank = $window['activeRank'] ?? $this->displayCardWindowService->activeRankFor(
            startRank: $condition->startRank,
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
         * Repository row は read model であり、この Strategy が表示カード用 DTO へ詰め替えます。
         * JP 側が未観測か、source より小さい伸びかという表示上の状態だけをここで確定し、
         * レスポンス配列化は Responder に残します。
         */
        return new DanceShortVideoRisingCandidateDTO(
            videoId: (int) $row->video_id,
            youtubeVideoId: (string) $row->youtube_video_id,
            title: (string) $row->title,
            channelTitle: $row->channel_title === null ? null : (string) $row->channel_title,
            thumbnailUrl: $row->thumbnail_url === null ? null : (string) $row->thumbnail_url,
            url: $row->url === null ? null : (string) $row->url,
            publishedAt: $row->published_at === null ? null : CarbonImmutable::parse((string) $row->published_at, 'UTC'),
            sourceRegionCode: (string) $row->source_region_code,
            sourceRegionName: (string) $row->source_region_name,
            sourceCurrentViewCount: (int) $row->source_current_view_count,
            sourcePreviousViewCount: $row->source_previous_view_count === null ? null : (int) $row->source_previous_view_count,
            sourceViewCountDelta: (int) $row->source_view_count_delta,
            sourceViewGrowthRate: $row->source_view_growth_rate === null ? null : (float) $row->source_view_growth_rate,
            sourceViewsPerHour: $row->source_views_per_hour === null ? null : (float) $row->source_views_per_hour,
            sourceCurrentCollectedAt: CarbonImmutable::parse((string) $row->source_current_collected_at, 'UTC'),
            sourcePreviousCollectedAt: $row->source_previous_collected_at === null ? null : CarbonImmutable::parse((string) $row->source_previous_collected_at, 'UTC'),
            japanCurrentViewCount: $row->japan_current_view_count === null ? null : (int) $row->japan_current_view_count,
            japanPreviousViewCount: $row->japan_previous_view_count === null ? null : (int) $row->japan_previous_view_count,
            japanViewCountDelta: $row->japan_view_count_delta === null ? null : (int) $row->japan_view_count_delta,
            japanViewGrowthRate: $row->japan_view_growth_rate === null ? null : (float) $row->japan_view_growth_rate,
            japanViewsPerHour: $row->japan_views_per_hour === null ? null : (float) $row->japan_views_per_hour,
            japanCurrentCollectedAt: $row->japan_current_collected_at === null ? null : CarbonImmutable::parse((string) $row->japan_current_collected_at, 'UTC'),
            japanPreviousCollectedAt: $row->japan_previous_collected_at === null ? null : CarbonImmutable::parse((string) $row->japan_previous_collected_at, 'UTC'),
            japanComparisonStatus: $row->japan_current_snapshot_id === null
                ? DanceShortRisingCandidateService::JAPAN_STATUS_UNOBSERVED
                : DanceShortRisingCandidateService::JAPAN_STATUS_SMALLER_DELTA,
            comparisonDays: $comparisonDays,
        );
    }
}
