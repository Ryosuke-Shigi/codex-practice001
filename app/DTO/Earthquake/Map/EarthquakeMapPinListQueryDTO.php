<?php

namespace App\DTO\Earthquake\Map;

final readonly class EarthquakeMapPinListQueryDTO
{
    public function __construct(
        public int $limit,
        public ?string $startDate,
        public ?string $endDate,
    ) {
    }

    /**
     * @return array{startDate: string|null, endDate: string|null}
     */
    public function filtersToArray(): array
    {
        return [
            'startDate' => $this->startDate,
            'endDate' => $this->endDate,
        ];
    }
}
