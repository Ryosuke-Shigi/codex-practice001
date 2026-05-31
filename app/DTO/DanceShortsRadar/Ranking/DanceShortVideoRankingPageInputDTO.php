<?php

namespace App\DTO\DanceShortsRadar\Ranking;

/*
 * DanceShortsRadar 通常ランキング画面の入力境界 DTO です。
 *
 * HTTP query parameter は FormRequest で形式検証したあと、この DTO に詰めて Query Action へ渡します。
 * regionCode は未指定を許容します。未指定時にどの地域を選ぶかは、active region を取得できる
 * Query Action 側の責務に残し、この DTO では「画面から渡された条件」を保持するだけにします。
 *
 * comparisonDays / sortKey / limit の既定値はランキング Query の既存 DTO と揃えます。
 * ただし、この DTO 自体は不正値の正規化、DB 参照、Inertia props 生成を行いません。
 */
final readonly class DanceShortVideoRankingPageInputDTO
{
    public function __construct(
        public ?string $regionCode,
        public int $comparisonDays = DanceShortVideoRankingConditionDTO::DEFAULT_COMPARISON_DAYS,
        public int $limit = DanceShortVideoRankingConditionDTO::DEFAULT_LIMIT,
        public string $sortKey = DanceShortVideoRankingConditionDTO::DEFAULT_SORT_KEY,
    ) {
    }

    /**
     * @return array{
     *     regionCode: string|null,
     *     comparisonDays: int,
     *     limit: int,
     *     sortKey: string
     * }
     */
    public function toArray(): array
    {
        return [
            'regionCode' => $this->regionCode,
            'comparisonDays' => $this->comparisonDays,
            'limit' => $this->limit,
            'sortKey' => $this->sortKey,
        ];
    }
}
