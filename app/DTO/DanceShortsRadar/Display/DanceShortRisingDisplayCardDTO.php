<?php

namespace App\DTO\DanceShortsRadar\Display;

use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRisingCandidateDTO;

/*
 * 上昇候補カード 1件分の表示境界 DTO です。
 *
 * 上昇候補は「海外側の伸び」と「日本側の観測状態」を持つため、通常ランキングカードとは
 * props の意味が異なります。nullable だらけの共通カード DTO にせず、この専用 DTO で
 * RisingCandidateDTO をそのまま運び、表示用配列への変換だけを Responder に任せます。
 */
final readonly class DanceShortRisingDisplayCardDTO
{
    public function __construct(
        public DanceShortVideoRisingCandidateDTO $risingCandidate,
    ) {}

    /**
     * @return array{type: string, risingCandidate: array<string, bool|int|float|string|null>}
     */
    public function toArray(): array
    {
        return [
            'type' => DanceShortDisplayCardFieldDTO::TYPE_RISING,
            'risingCandidate' => $this->risingCandidate->toArray(),
        ];
    }
}
