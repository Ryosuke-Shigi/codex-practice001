<?php

namespace App\DTO\DanceShortsRadar\Display;

final readonly class DanceShortDisplayCardPaginationDTO
{
    public function __construct(
        public int $startRank,
        public int $windowSize,
        public bool $hasPrev,
        public bool $hasNext,
        public ?int $prevStartRank,
        public ?int $nextStartRank,
    ) {}

    /**
     * @return array{
     *     startRank: int,
     *     windowSize: int,
     *     hasPrev: bool,
     *     hasNext: bool,
     *     prevStartRank: int|null,
     *     nextStartRank: int|null
     * }
     */
    public function toArray(): array
    {
        return [
            'startRank' => $this->startRank,
            'windowSize' => $this->windowSize,
            'hasPrev' => $this->hasPrev,
            'hasNext' => $this->hasNext,
            'prevStartRank' => $this->prevStartRank,
            'nextStartRank' => $this->nextStartRank,
        ];
    }
}
