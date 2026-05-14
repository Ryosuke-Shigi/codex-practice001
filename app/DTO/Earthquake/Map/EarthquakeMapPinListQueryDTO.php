<?php

namespace App\DTO\Earthquake\Map;

use Carbon\CarbonImmutable;

final readonly class EarthquakeMapPinListQueryDTO
{
    public function __construct(
        public int $limit,
        public ?string $startDate,
        public ?string $endDate,
    ) {
    }

    public static function forLatest(int $limit = 50): self
    {
        return new self(
            limit: $limit,
            startDate: null,
            endDate: null,
        );
    }

    public static function forMap(?string $startDate, ?string $endDate, int $limit = 100): self
    {
        $defaultRange = self::defaultDateRange();

        return new self(
            limit: $limit,
            startDate: self::filledDate($startDate) ?? $defaultRange['startDate'],
            endDate: self::filledDate($endDate) ?? $defaultRange['endDate'],
        );
    }

    /**
     * @return array{startDate: string, endDate: string}
     */
    public static function defaultDateRange(): array
    {
        $endDate = CarbonImmutable::today(config('app.timezone', 'UTC'));
        $startDate = $endDate->subDays(3);

        return [
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
        ];
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

    private static function filledDate(?string $date): ?string
    {
        if ($date === null || trim($date) === '') {
            return null;
        }

        return trim($date);
    }
}
