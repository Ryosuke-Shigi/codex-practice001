<?php

namespace App\Actions\DanceShortsRadar\Queries;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardListDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRankingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Display\DanceShortRisingDisplayCardDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingConditionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingListDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingRegionDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateListDTO;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortDisplayCardWindowService;
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
        private readonly DanceShortDisplayCardWindowService $displayCardWindowService,
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
        $legacyLimit = min(self::MAX_LIMIT, max(1, $input->limit));
        $windowSize = $this->displayCardWindowService->normalizeWindowSize($input->windowSize);
        $startRank = $this->displayCardWindowService->normalizeStartRank($input->startRank, $windowSize);
        $windowFetchLimit = $this->displayCardWindowService->fetchLimitFor($startRank, $windowSize);
        $limit = max($legacyLimit, $windowFetchLimit);

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
                    limit: max(self::MAX_LIMIT, $limit),
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

        /*
         * ここで React が実際に描く「1つのカードフィールド」を確定します。
         *
         * rankingList / risingCandidateList / allRankingList は後方互換やテスト確認にも使う
         * ユースケース結果ですが、画面の主表示入口としては displayCardField だけを見ればよい形にします。
         * これにより React 側は selectedTab を見て allCandidates / candidatesByRegion / risingCandidates を
         * 選び直す必要がなくなり、タブ条件の意味づけはこの Action に閉じます。
         */
        $displayCardField = $this->displayCardField(
            selectedTabCode: $selectedTabCode,
            rankingList: $rankingList,
            risingCandidateList: $risingCandidateList,
            hasRegions: count($regions) > 0,
            startRank: $startRank,
            windowSize: $windowSize,
        );

        return new DanceShortVideoRankingPageDTO(
            regions: $regions,
            rankingList: $rankingList,
            rankingListsByRegion: $rankingListsByRegion,
            allRankingList: $allRankingList,
            risingCandidateList: $risingCandidateList,
            displayCardField: $displayCardField,
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
        /*
         * URL query の region は、実在地域だけでなく表示専用タブも受け取ります。
         * ここで「選択中タブ」として解決し、後続の selectedRegionCode() で
         * DB region として扱ってよい値だけを切り出すことで、RISING / ALL が
         * Repository の region 条件へ流れ込まないようにしています。
         */
        if ($requestedRegionCode === null || strtoupper($requestedRegionCode) === DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE) {
            return DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE;
        }

        if (strtoupper($requestedRegionCode) === DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE) {
            return DanceShortVideoRankingPageInputDTO::ALL_TAB_CODE;
        }

        foreach ($regions as $region) {
            if ($region->code === $requestedRegionCode) {
                return $region->code;
            }
        }

        return DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE;
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

    private function displayCardField(
        string $selectedTabCode,
        DanceShortVideoRankingListDTO $rankingList,
        DanceShortVideoRisingCandidateListDTO $risingCandidateList,
        bool $hasRegions,
        int $startRank,
        int $windowSize,
    ): DanceShortDisplayCardFieldDTO {
        /*
         * 上昇候補は通常ランキングとはカードの意味が違うため、カードDTOも分けます。
         * ただし外枠の Field DTO は共通にして、React 側は displayCardField.type を見て
         * 対応する表示コンポーネントへ渡すだけにします。
         *
         * emptyMessage も Field DTO に含めることで、Responder が「type から空文言を判断する」
         * 必要をなくし、Responder は Inertia props への配列変換に集中できます。
         */
        if ($selectedTabCode === DanceShortVideoRankingPageInputDTO::RISING_TAB_CODE) {
            $window = $this->displayCardWindowService->buildWindow(
                items: $risingCandidateList->items,
                startRank: $startRank,
                windowSize: $windowSize,
            );
            $visibleItems = $window['visibleItems'];

            return new DanceShortDisplayCardFieldDTO(
                type: DanceShortDisplayCardFieldDTO::TYPE_RISING,
                visibleCards: new DanceShortDisplayCardListDTO(array_map(
                    fn (DanceShortVideoRisingCandidateDTO $item): DanceShortRisingDisplayCardDTO => new DanceShortRisingDisplayCardDTO($item),
                    $visibleItems,
                )),
                activeIndex: 0,
                activeRank: $this->displayCardWindowService->activeRankFor($startRank, 0, count($visibleItems) > 0),
                pagination: $window['pagination'],
                emptyMessage: count($visibleItems) === 0 ? '表示できる上昇候補はまだありません。' : null,
            );
        }

        /*
         * 通常ランキングは、JP / US / KR などの実在地域だけでなく ALL もここへ来ます。
         * ALL の場合も Repository へ ALL を渡した結果ではなく、上で地域別ランキングを集約した
         * allRankingList 由来の rankingList を使うため、DB region と表示専用タブ値は混ざりません。
         */
        $window = $this->displayCardWindowService->buildWindow(
            items: $rankingList->items,
            startRank: $startRank,
            windowSize: $windowSize,
        );
        $visibleItems = $window['visibleItems'];

        return new DanceShortDisplayCardFieldDTO(
            type: DanceShortDisplayCardFieldDTO::TYPE_RANKING,
            visibleCards: new DanceShortDisplayCardListDTO(array_map(
                fn (DanceShortVideoRankingItemDTO $item): DanceShortRankingDisplayCardDTO => new DanceShortRankingDisplayCardDTO($item),
                $visibleItems,
            )),
            activeIndex: 0,
            activeRank: $this->displayCardWindowService->activeRankFor($startRank, 0, count($visibleItems) > 0),
            pagination: $window['pagination'],
            emptyMessage: count($visibleItems) === 0 ? ($hasRegions
                ? '表示できる通常ランキング候補はまだありません。'
                : '有効な地域がまだ登録されていません。') : null,
        );
    }
}
