<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;

interface EarthquakeFeedEntryRepositoryInterface
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
    public function upsertFromExtractedEntries(EarthquakeExtractedEntryListDTO $entries): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function latest(int $limit = 20): array;
}
