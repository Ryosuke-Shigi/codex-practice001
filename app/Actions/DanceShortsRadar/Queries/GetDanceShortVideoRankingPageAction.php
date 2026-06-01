<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortRisingCandidateService;
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
        private readonly DanceShortRisingCandidateService $risingCandidateService,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
    ) {
    }

    public function execute(DanceShortVideoRankingPageInputDTO $input): DanceShortVideoRankingPageDTO
    {
        /*
         * 本画面の地域別候補は DB 上の active region をそのまま使います。
         * 「上昇候補」タブと「まとめ」タブは表示専用なので、DB region として作らず、
         * Repository へ RISING / ALL を渡さない境界をここで守ります。
         */
        $regions = $this->searchTargetRepository
            ->activeRegions()
            ->map(fn (DanceShortRegion $region): DanceShortVideoRankingRegionDTO => new DanceShortVideoRankingRegionDTO(
                code: (string) $region->code,
                name: (string) $region->name,
            ))
            ->values()
            ->all();

        $selectedTabCode = $this->selectedTabCode($input->regionCode, $regions);
        $selectedRegionCode = $this->selectedRegionCode($selectedTabCode, $regions);
        $comparisonDays = $this->snapshotMetricService->normalizeComparisonDays($input->comparisonDays);
        $sortKey = $this->snapshotMetricService->normalizeSortKey($input->sortKey);
        $limit = min(self::MAX_LIMIT, max(1, $input->limit));

        /*
         * 既存の確認画面では candidatesByRegion / allCandidates という表示用 props shape を先に固めています。
         * 本画面でも同じ見え方へ寄せるため、選択中 region だけでなく active region すべての通常ランキングを
         * Query 結果として持ちます。ここで持つのはあくまで保存済み snapshot から作った Result DTO であり、
         * 固定確認データや表示専用タブ値を本番 Query に混ぜるわけではありません。
         *
         * allCandidates への変換や snake_case の候補カード props 生成は Responder 側に残します。
         * Action が Inertia props のキー名まで知ると、ユースケース手順と画面出力形式が結びつきすぎるためです。
         */
        $rankingListsByRegion = [];

        foreach ($regions as $region) {
            $rankingListsByRegion[$region->code] = $this->rankingCandidatesAction->execute(
                new DanceShortVideoRankingConditionDTO(
                    regionCode: $region->code,
                    comparisonDays: $comparisonDays,
                    limit: $limit,
                    sortKey: $sortKey,
                ),
            );
        }

        /*
         * 「まとめ」タブは JP / US / KR の候補を同じ sortKey で横断表示します。
         * ALL を Repository に渡さず、地域別 Query の結果 DTO を集約してから、
         * RankingCandidatesAction と同じ sort を適用します。React はこの allRankingList 由来の
         * allCandidates を受け取って表示するだけで、再計算や再ソートを行いません。
         */
        $allRankingItems = [];

        foreach ($rankingListsByRegion as $rankingListByRegion) {
            foreach ($rankingListByRegion->items as $item) {
                $allRankingItems[] = $item;
            }
        }

        $allRankingList = new DanceShortVideoRankingListDTO(
            array_slice($this->rankingCandidatesAction->sortedItems($allRankingItems, $sortKey), 0, $limit),
        );

        /*
         * 上昇候補はユーザー選択の sortKey を使いません。
         * 通常ランキングの表示順とは別に、US / KR / JP の ranking DTO を固定の上昇候補順で Service に
         * 判定させます。Repository は引き続き実在 region の snapshot 取得だけを担当し、ALL / RISING を
         * DB region として扱いません。
         */
        $risingRankingListsByRegion = [];

        foreach ($regions as $region) {
            if (! in_array($region->code, ['JP', 'US', 'KR'], true)) {
                continue;
            }

            $risingRankingListsByRegion[$region->code] = $this->rankingCandidatesAction->execute(
                new DanceShortVideoRankingConditionDTO(
                    regionCode: $region->code,
                    comparisonDays: $comparisonDays,
                    limit: self::MAX_LIMIT,
                    sortKey: 'view_count_delta',
                ),
            );
        }

        $sourceRisingItems = [];

        foreach (['US', 'KR'] as $sourceRegionCode) {
            foreach (($risingRankingListsByRegion[$sourceRegionCode] ?? new DanceShortVideoRankingListDTO([]))->items as $item) {
                $sourceRisingItems[] = $item;
            }
        }

        $risingCandidateList = $this->risingCandidateService->buildRisingCandidates(
            sourceItems: $sourceRisingItems,
            japanItems: ($risingRankingListsByRegion['JP'] ?? new DanceShortVideoRankingListDTO([]))->items,
            limit: $limit,
        );

        $rankingList = match (true) {
            $selectedTabCode === 'RISING' => new DanceShortVideoRankingListDTO([]),
            $selectedTabCode === 'ALL' => $allRankingList,
            default => $rankingListsByRegion[$selectedRegionCode] ?? new DanceShortVideoRankingListDTO([]),
        };

        return new DanceShortVideoRankingPageDTO(
            regions: $regions,
            rankingList: $rankingList,
            rankingListsByRegion: $rankingListsByRegion,
            allRankingList: $allRankingList,
            risingCandidateList: $risingCandidateList,
            selectedTabCode: $selectedTabCode,
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
    private function selectedTabCode(?string $requestedRegionCode, array $regions): string
    {
        if ($requestedRegionCode === null || strtoupper($requestedRegionCode) === 'RISING') {
            return 'RISING';
        }

        if (strtoupper($requestedRegionCode) === 'ALL') {
            return 'ALL';
        }

        foreach ($regions as $region) {
            if ($region->code === $requestedRegionCode) {
                return $region->code;
            }
        }

        return 'RISING';
    }

    /**
     * @param  array<int, DanceShortVideoRankingRegionDTO>  $regions
     */
    private function selectedRegionCode(string $selectedTabCode, array $regions): ?string
    {
        foreach ($regions as $region) {
            if ($region->code === $selectedTabCode) {
                return $region->code;
            }
        }

        return null;
    }
}
