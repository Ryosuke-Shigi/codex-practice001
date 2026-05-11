<?php

namespace App\DTO\Earthquake\Map;

final readonly class EarthquakeMapPinListDTO
{
    /**
     * @param  array<int, EarthquakeMapPinDTO>  $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public function count(): int
    {
        return count($this->items);
    }

    /**
     * @return array{items: array<int, array<string, int|string|null>>, count: int}
     */
    public function toArray(): array
    {
        return [
            'items' => array_map(
                fn (EarthquakeMapPinDTO $item): array => $item->toArray(),
                $this->items,
            ),
            'count' => $this->count(),
        ];
    }
}
