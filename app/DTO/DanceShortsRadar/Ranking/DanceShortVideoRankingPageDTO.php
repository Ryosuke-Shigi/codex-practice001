<?php

namespace App\DTO\DanceShortsRadar\Ranking;

use App\DTO\DanceShortsRadar\Display\DanceShortDisplayCardFieldDTO;

/*
 * DanceShortsRadar 通常ランキング画面の Query Action 結果 DTO です。
 *
 * この DTO は「画面を描くために Responder が必要とするユースケース結果」を束ねます。
 * rankingList は現在選択中の通常ランキング表示で使うランキング window、allRankingList は
 * 「まとめ」表示で使うランキング window です。risingCandidateList は上昇候補表示の
 * window です。画面の主契約は displayCardField で、全件候補配列を保持する目的では使いません。
 * comparisonDayOptions や sortKeyOptions は画面操作に必要な許可済み選択肢です。
 *
 * Inertia props の最終形、href、表示ラベル、空メッセージは Responder で整えます。
 * DTO の toArray() は保持値の配列化だけに限定し、表示判断や metric 再計算を入れない方針です。
 */
final readonly class DanceShortVideoRankingPageDTO
{
    /**
     * @param  array<int, DanceShortVideoRankingRegionDTO>  $regions
     * @param  array<string, DanceShortVideoRankingListDTO>  $rankingListsByRegion
     * @param  array<int, int>  $comparisonDayOptions
     * @param  array<int, string>  $sortKeyOptions
     */
    public function __construct(
        public array $regions,
        public DanceShortVideoRankingListDTO $rankingList,
        public array $rankingListsByRegion,
        public DanceShortVideoRankingListDTO $allRankingList,
        public DanceShortVideoRisingCandidateListDTO $risingCandidateList,
        public DanceShortDisplayCardFieldDTO $displayCardField,
        public string $selectedTabCode,
        public ?string $selectedRegionCode,
        public int $comparisonDays,
        public int $limit,
        public string $sortKey,
        public array $comparisonDayOptions,
        public array $sortKeyOptions,
    ) {}

    /**
     * @return array{
     *     regions: array<int, array{code: string, name: string}>,
     *     rankingList: array{items: array<int, array<string, bool|int|float|string|null>>},
     *     rankingListsByRegion: array<string, array{items: array<int, array<string, bool|int|float|string|null>>}>,
     *     allRankingList: array{items: array<int, array<string, bool|int|float|string|null>>},
     *     risingCandidateList: array{items: array<int, array<string, bool|int|float|string|null>>},
     *     displayCardField: array{
     *         type: string,
     *         visibleCards: array<int, array<string, mixed>>,
     *         activeIndex: int,
     *         activeRank: int|null,
     *         pagination: array{
     *             startRank: int,
     *             windowSize: int,
     *             hasPrev: bool,
     *             hasNext: bool,
     *             prevStartRank: int|null,
     *             nextStartRank: int|null
     *         },
     *         emptyMessage: string|null
     *     },
     *     selectedTabCode: string,
     *     selectedRegionCode: string|null,
     *     comparisonDays: int,
     *     limit: int,
     *     sortKey: string,
     *     comparisonDayOptions: array<int, int>,
     *     sortKeyOptions: array<int, string>
     * }
     */
    public function toArray(): array
    {
        return [
            'regions' => array_map(
                fn (DanceShortVideoRankingRegionDTO $region): array => $region->toArray(),
                $this->regions,
            ),
            'rankingList' => $this->rankingList->toArray(),
            'rankingListsByRegion' => array_map(
                fn (DanceShortVideoRankingListDTO $rankingList): array => $rankingList->toArray(),
                $this->rankingListsByRegion,
            ),
            'allRankingList' => $this->allRankingList->toArray(),
            'risingCandidateList' => $this->risingCandidateList->toArray(),
            'displayCardField' => $this->displayCardField->toArray(),
            'selectedTabCode' => $this->selectedTabCode,
            'selectedRegionCode' => $this->selectedRegionCode,
            'comparisonDays' => $this->comparisonDays,
            'limit' => $this->limit,
            'sortKey' => $this->sortKey,
            'comparisonDayOptions' => $this->comparisonDayOptions,
            'sortKeyOptions' => $this->sortKeyOptions,
        ];
    }
}
