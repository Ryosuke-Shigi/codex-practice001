<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateListDTO;
use App\Factories\DanceShortsRadar\DanceShortDisplayCardStrategyFactory;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortDisplayCardTabService;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;

/**
 * DanceShortsRadar 通常ランキング画面の Query Action です。
 *
 * この Action は初期 Inertia 表示用の入口として、active region、選択中タブ、
 * 比較日数、並び順、5枚 window 条件を組み立てます。カード取得そのものは
 * DanceShortDisplayCardStrategyFactory が選んだ Strategy へ委譲し、RISING / ALL / 地域別の
 * 取得分岐を Action 内に持ちません。
 */
class GetDanceShortVideoRankingPageAction
{
    private const MAX_LIMIT = 50;

    public function __construct(
        private readonly DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
        private readonly DanceShortDisplayCardTabService $displayCardTabService,
        private readonly DanceShortDisplayCardWindowService $displayCardWindowService,
        private readonly DanceShortDisplayCardStrategyFactory $displayCardStrategyFactory,
    ) {}

    /**
     * ランキング初期表示に必要な active region、選択タブ、表示カード window を組み立てます。
     */
    public function execute(DanceShortVideoRankingPageInputDTO $input): DanceShortVideoRankingPageDTO
    {
        $regions = $this->searchTargetRepository
            ->activeRegions()
            ->map(fn (DanceShortRegion $region): DanceShortVideoRankingRegionDTO => new DanceShortVideoRankingRegionDTO(
                code: (string) $region->code,
                name: (string) $region->name,
            ))
            ->values()
            ->all();

        $selectedTabCode = $this->displayCardTabService->selectedTabCode($input->regionCode, $regions);
        $selectedRegionCode = $this->displayCardTabService->selectedRegionCode($selectedTabCode, $regions);
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($input->comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($input->sortKey);
        $windowSize = $this->displayCardWindowService->normalizeWindowSize($input->windowSize);
        $startRank = $this->displayCardWindowService->normalizeStartRank($input->startRank, $windowSize);
        $displayCardField = $this->displayCardStrategyFactory
            ->make($selectedTabCode)
            ->getWindow(new DanceShortDisplayCardWindowConditionDTO(
                selectedTabCode: $selectedTabCode,
                activeRegionCodes: $this->displayCardTabService->activeRegionCodes($regions),
                comparisonDays: $comparisonDays,
                sortKey: $sortKey,
                startRank: $startRank,
                windowSize: $windowSize,
                selectedVideoId: $input->selectedVideoId,
            ))
            ->displayCardField;
        $rankingList = $this->rankingListFromDisplayCardField($displayCardField);
        $risingCandidateList = $this->risingCandidateListFromDisplayCardField($displayCardField);

        return new DanceShortVideoRankingPageDTO(
            regions: $regions,
            rankingList: $rankingList,
            rankingListsByRegion: $selectedRegionCode === null ? [] : [
                $selectedRegionCode => $rankingList,
            ],
            allRankingList: $selectedTabCode === DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE
                ? $rankingList
                : new DanceShortVideoRankingListDTO([]),
            risingCandidateList: $risingCandidateList,
            displayCardField: $displayCardField,
            selectedTabCode: $selectedTabCode,
            selectedRegionCode: $selectedRegionCode,
            comparisonDays: $comparisonDays,
            limit: min(self::MAX_LIMIT, max(1, $input->limit)),
            sortKey: $sortKey,
            comparisonDayOptions: $this->snapshotMetricService->allowedComparisonDays(),
            sortKeyOptions: $this->snapshotMetricService->allowedSortKeys(),
        );
    }

    private function rankingListFromDisplayCardField(DanceShortDisplayCardFieldDTO $field): DanceShortVideoRankingListDTO
    {
        $items = [];

        foreach ($field->visibleCards->cards as $card) {
            if ($card instanceof DanceShortRankingDisplayCardDTO) {
                $items[] = $card->rankingItem;
            }
        }

        return new DanceShortVideoRankingListDTO($items);
    }

    private function risingCandidateListFromDisplayCardField(DanceShortDisplayCardFieldDTO $field): DanceShortVideoRisingCandidateListDTO
    {
        $items = [];

        foreach ($field->visibleCards->cards as $card) {
            if ($card instanceof DanceShortRisingDisplayCardDTO) {
                $items[] = $card->risingCandidate;
            }
        }

        return new DanceShortVideoRisingCandidateListDTO($items);
    }
}
