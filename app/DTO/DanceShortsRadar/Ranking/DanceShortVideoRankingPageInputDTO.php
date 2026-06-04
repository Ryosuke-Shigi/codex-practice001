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
    /*
     * RISING / ALL は dance_short_regions に保存する地域コードではなく、
     * 画面のタブ状態を URL query に残すための表示専用コードです。
     * React からは region query として渡されますが、Repository へ渡す地域条件とは
     * Action 側で必ず分けます。
     */
    public const RISING_TAB_CODE = 'RISING';

    public const ALL_TAB_CODE = 'ALL';

    /*
     * Request 層の許可値は「URL query として受け付ける値」の固定リストです。
     * active region かどうかの DB 状態判断は Request では扱わず、
     * Query Action が active region 一覧を取得したあとで選択状態として解決します。
     */
    /**
     * @var array<int, string>
     */
    public const ALLOWED_REGION_QUERY_VALUES = [
        self::RISING_TAB_CODE,
        self::ALL_TAB_CODE,
        'JP',
        'US',
        'KR',
    ];

    public function __construct(
        public ?string $regionCode,
        public int $comparisonDays = DanceShortVideoRankingConditionDTO::DEFAULT_COMPARISON_DAYS,
        public int $limit = DanceShortVideoRankingConditionDTO::DEFAULT_LIMIT,
        public string $sortKey = DanceShortVideoRankingConditionDTO::DEFAULT_SORT_KEY,
        public int $startRank = 1,
        public int $windowSize = 5,
        public ?int $selectedVideoId = null,
    ) {
    }

    /**
     * @return array{
     *     regionCode: string|null,
     *     comparisonDays: int,
     *     limit: int,
     *     sortKey: string,
     *     startRank: int,
     *     windowSize: int,
     *     selectedVideoId: int|null
     * }
     */
    public function toArray(): array
    {
        return [
            'regionCode' => $this->regionCode,
            'comparisonDays' => $this->comparisonDays,
            'limit' => $this->limit,
            'sortKey' => $this->sortKey,
            'startRank' => $this->startRank,
            'windowSize' => $this->windowSize,
            'selectedVideoId' => $this->selectedVideoId,
        ];
    }
}
