<?php

namespace App\DTO\DanceShortsRadar\Ranking;

final readonly class DanceShortVideoRisingCandidateListDTO
{
    /**
     * @param  array<int, DanceShortVideoRisingCandidateDTO>  $items
     */
    public function __construct(
        public array $items,
    ) {}

    /**
     * @return array{items: array<int, array<string, bool|int|float|string|null>>}
     */
    public function toArray(): array
    {
        return [
            'items' => array_map(
                fn (DanceShortVideoRisingCandidateDTO $item): array => $item->toArray(),
                $this->items,
            ),
        ];
    }
}
