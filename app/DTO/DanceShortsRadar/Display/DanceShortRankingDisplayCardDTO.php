<?php

namespace App\DTO\DanceShortsRadar\Display;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingItemDTO;

/*
 * 通常ランキングカード 1件分の表示境界 DTO です。
 *
 * RankingItemDTO は snapshot 比較済みのランキング値を camelCase で持つ PHP レイヤー内の DTO です。
 * この DTO はそれを displayCardField.visibleCards に載せるための薄いラッパーであり、
 * React が直接読む snake_case の候補カード props へ変換する処理は Responder に残します。
 */
final readonly class DanceShortRankingDisplayCardDTO
{
    public function __construct(
        public DanceShortVideoRankingItemDTO $rankingItem,
    ) {
    }

    /**
     * @return array{type: string, rankingItem: array<string, bool|int|float|string|null>}
     */
    public function toArray(): array
    {
        return [
            'type' => DanceShortDisplayCardFieldDTO::TYPE_RANKING,
            'rankingItem' => $this->rankingItem->toArray(),
        ];
    }
}
