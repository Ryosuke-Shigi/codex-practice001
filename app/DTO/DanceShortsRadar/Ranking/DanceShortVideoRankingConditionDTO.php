<?php

namespace App\DTO\DanceShortsRadar\Ranking;

/*
 * DanceShortsRadar のランキング Query 条件を運ぶ DTO です。
 *
 * regionCode / comparisonDays / limit / sortKey は画面表示やランキング生成の入力ですが、
 * DTO 自体は DB 取得や並び替え処理を行いません。不正値の正規化は
 * DanceShortSnapshotMetricService と Query Action 側で扱います。
 */
final readonly class DanceShortVideoRankingConditionDTO
{
    /*
     * 比較期間は DanceShortsRadarMock.tsx の UI 仕様をそのままサーバー側にも写します。
     * ここで 8日などの別候補を足すと、モック画面で先に固めた操作仕様と Query 側の意味が
     * ズレるため、許可値は 1 / 3 / 7 / 14 / 30 に固定します。
     */
    public const DEFAULT_COMPARISON_DAYS = 7;

    public const DEFAULT_LIMIT = 20;

    public const DEFAULT_SORT_KEY = 'views_per_hour';

    /**
     * @var array<int, int>
     */
    public const ALLOWED_COMPARISON_DAYS = [1, 3, 7, 14, 30];

    /**
     * @var array<int, string>
     */
    public const ALLOWED_SORT_KEYS = [
        'views_per_hour',
        'view_count_delta',
        'view_growth_rate',
        'current_view_count',
    ];

    public function __construct(
        public string $regionCode,
        public int $comparisonDays = self::DEFAULT_COMPARISON_DAYS,
        public int $limit = self::DEFAULT_LIMIT,
        public string $sortKey = self::DEFAULT_SORT_KEY,
    ) {
    }

    /**
     * @return array{
     *     regionCode: string,
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
