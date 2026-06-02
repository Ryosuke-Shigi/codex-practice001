<?php

namespace App\DTO\DanceShortsRadar\Display;

/*
 * 表示カード DTO を束ねる ListDTO です。
 *
 * 通常ランキングカードと上昇候補カードは持つ意味が違うため、カード DTO 自体は分けています。
 * 一方で画面外枠は同じ displayCardField.visibleCards として扱いたいので、この ListDTO では
 * どちらのカード DTO も同じ順序付きリストとして保持します。
 *
 * 並び順は Action / Service が作ったものを信頼し、ここで sort や filter は行いません。
 */
final readonly class DanceShortDisplayCardListDTO
{
    /**
     * @param  array<int, DanceShortRankingDisplayCardDTO|DanceShortRisingDisplayCardDTO>  $cards
     */
    public function __construct(
        public array $cards,
    ) {
    }

    /**
     * @return array{cards: array<int, array<string, mixed>>}
     */
    public function toArray(): array
    {
        return [
            'cards' => array_map(
                fn (DanceShortRankingDisplayCardDTO|DanceShortRisingDisplayCardDTO $card): array => $card->toArray(),
                $this->cards,
            ),
        ];
    }
}
