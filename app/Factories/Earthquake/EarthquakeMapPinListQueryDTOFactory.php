<?php

namespace App\Factories\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use Carbon\CarbonImmutable;

final readonly class EarthquakeMapPinListQueryDTOFactory
{
    public function fromDateRange(
        ?string $startDate,
        ?string $endDate,
        int $limit = 100,
    ): EarthquakeMapPinListQueryDTO {
        $filledStartDate = $this->filledDate($startDate);
        $filledEndDate = $this->filledDate($endDate);

        if ($filledStartDate !== null && $filledEndDate !== null) {
            return new EarthquakeMapPinListQueryDTO(
                limit: $limit,
                startDate: $filledStartDate,
                endDate: $filledEndDate,
            );
        }

        $defaultRange = $this->defaultDateRange();

        return new EarthquakeMapPinListQueryDTO(
            limit: $limit,
            startDate: $filledStartDate ?? $defaultRange['startDate'],
            endDate: $filledEndDate ?? $defaultRange['endDate'],
        );
    }

    /**
     * @return array{startDate: string, endDate: string}
     */
    private function defaultDateRange(): array
    {
        $endDate = CarbonImmutable::today(config('app.timezone', 'Asia/Tokyo'));
        $startDate = $endDate->subDays(3);

        return [
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
        ];
    }

    private function filledDate(?string $date): ?string
    {
        if ($date === null || trim($date) === '') {
            return null;
        }

        return trim($date);
    }
}
