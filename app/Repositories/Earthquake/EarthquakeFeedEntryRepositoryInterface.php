<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeExtractedEntryListDTO;
use Carbon\CarbonImmutable;

interface EarthquakeFeedEntryRepositoryInterface
{
    public function isStorageReady(): bool;

    /**
     * @return array{
     *     totalCount: int,
     *     insertedCount: int,
     *     updatedCount: int,
     *     skippedCount: int,
     *     failedCount: int,
     *     changedEntryIds: array<int, int>
     * }
     */
    public function upsertFromExtractedEntries(EarthquakeExtractedEntryListDTO $entries): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function latest(int $limit = 20): array;

    public function latestUpdatedAtFromFeed(): ?CarbonImmutable;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function entriesForMapPinBuild(int $limit = 100): array;

    /**
     * @param  array<int, int>  $sourceEntryIds
     * @return array<int, array<string, mixed>>
     */
    public function entriesForMapPinBuildByIds(array $sourceEntryIds): array;
}
