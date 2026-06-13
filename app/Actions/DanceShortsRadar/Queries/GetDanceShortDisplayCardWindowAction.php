<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowConditionDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardWindowDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\Factories\DanceShortsRadar\DanceShortDisplayCardStrategyFactory;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortDisplayCardTabService;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;

/**
 * displayCardField の先読み API 用 Query Action です。
 *
 * Request 由来の startRank / windowSize を受け取り、初期表示と同じ Strategy Factory へ
 * window 取得を委譲します。Controller は HTTP 入力、Responder は JSON shape に閉じ、
 * RISING / ALL / 地域別の取得分岐はここにも書きません。
 */
final readonly class GetDanceShortDisplayCardWindowAction
{
    public function __construct(
        private DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private DanceShortSnapshotMetricService $snapshotMetricService,
        private DanceShortDisplayCardTabService $displayCardTabService,
        private DanceShortDisplayCardWindowService $displayCardWindowService,
        private DanceShortDisplayCardStrategyFactory $displayCardStrategyFactory,
    ) {}

    /**
     * 追加取得 API 用に、選択タブと window 条件から表示カード DTO を取得します。
     */
    public function execute(DanceShortVideoRankingPageInputDTO $input): DanceShortDisplayCardWindowDTO
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
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($input->comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($input->sortKey);
        $windowSize = $this->displayCardWindowService->normalizeWindowSize($input->windowSize);
        $startRank = $this->displayCardWindowService->normalizeStartRank($input->startRank, $windowSize);

        return $this->displayCardStrategyFactory
            ->make($selectedTabCode)
            ->getWindow(new DanceShortDisplayCardWindowConditionDTO(
                selectedTabCode: $selectedTabCode,
                activeRegionCodes: $this->displayCardTabService->activeRegionCodes($regions),
                comparisonDays: $comparisonDays,
                sortKey: $sortKey,
                startRank: $startRank,
                windowSize: $windowSize,
                selectedVideoId: $input->selectedVideoId,
            ));
    }
}
