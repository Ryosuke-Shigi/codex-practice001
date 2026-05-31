<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;

/*
 * DanceShortsRadar 通常ランキング画面の Query Action です。
 *
 * 既存の GetDanceShortVideoRankingCandidatesAction は「保存済み snapshot からランキング候補を作る」
 * ユースケースに集中しています。この Action は、その結果を本画面で使うために、active region、
 * 選択中 filter、許可済み選択肢をひとまとめにする画面接続用の薄い手順です。
 *
 * 重要な境界:
 * - YouTube API は呼ばない
 * - metric 計算は既存の RankingCandidatesAction / Service へ委譲する
 * - active region の取得は Repository 経由にする
 * - Inertia props の href や表示ラベルは Responder に残す
 */
class GetDanceShortVideoRankingPageAction
{
    private const MAX_LIMIT = 50;

    public function __construct(
        private readonly DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private readonly GetDanceShortVideoRankingCandidatesAction $rankingCandidatesAction,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
    ) {
    }

    public function execute(DanceShortVideoRankingPageInputDTO $input): DanceShortVideoRankingPageDTO
    {
        /*
         * 本画面の region tab は DB 上の active region をそのまま使います。
         * JP / US / KR のような既知コードをここで決め打ちせず、未指定時は表示順の先頭を初期値にします。
         */
        $regions = $this->searchTargetRepository
            ->activeRegions()
            ->map(fn (DanceShortRegion $region): DanceShortVideoRankingRegionDTO => new DanceShortVideoRankingRegionDTO(
                code: (string) $region->code,
                name: (string) $region->name,
            ))
            ->values()
            ->all();

        $selectedRegionCode = $this->selectedRegionCode($input->regionCode, $regions);
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($input->comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($input->sortKey);
        $limit = min(self::MAX_LIMIT, max(1, $input->limit));

        $rankingList = new DanceShortVideoRankingListDTO([]);

        if ($selectedRegionCode !== null) {
            $rankingList = $this->rankingCandidatesAction->execute(
                new DanceShortVideoRankingConditionDTO(
                    regionCode: $selectedRegionCode,
                    comparisonDays: $comparisonDays,
                    limit: $limit,
                    sortKey: $sortKey,
                ),
            );
        }

        return new DanceShortVideoRankingPageDTO(
            regions: $regions,
            rankingList: $rankingList,
            selectedRegionCode: $selectedRegionCode,
            comparisonDays: $comparisonDays,
            limit: $limit,
            sortKey: $sortKey,
            comparisonDayOptions: $this->snapshotMetricService->allowedComparisonDays(),
            sortKeyOptions: $this->snapshotMetricService->allowedSortKeys(),
        );
    }

    /**
     * @param  array<int, DanceShortVideoRankingRegionDTO>  $regions
     */
    private function selectedRegionCode(?string $requestedRegionCode, array $regions): ?string
    {
        if ($requestedRegionCode !== null) {
            foreach ($regions as $region) {
                if ($region->code === $requestedRegionCode) {
                    return $region->code;
                }
            }
        }

        return $regions[0]->code ?? null;
    }
}
