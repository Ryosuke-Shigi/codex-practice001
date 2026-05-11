<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;

interface EarthquakeMapPinRepositoryInterface
{
    public function isStorageReady(): bool;

    /**
     * @return array{
     *     totalCount: int,
     *     insertedCount: int,
     *     updatedCount: int,
     *     skippedCount: int,
     *     failedCount: int
     * }
     */
    public function upsertFromMapPins(EarthquakeMapPinListDTO $pins): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function latest(int $limit = 20): array;
}
