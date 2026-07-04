<?php

namespace App\DTO\Earthquake\Sync;

final readonly class EarthquakeMapRefreshStartResultDTO
{
    public function __construct(
        public int $feedEntrySyncRunId,
        public int $mapPinSyncRunId,
        public ?EarthquakeFeedEntrySyncResultDTO $feedEntrySyncStatus,
        public ?EarthquakeMapPinSyncResultDTO $mapPinSyncStatus,
    ) {}
}
