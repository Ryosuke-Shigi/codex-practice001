<?php

namespace App\DTO\Earthquake\Sync;

final readonly class EarthquakeMapPinSyncStartResultDTO
{
    public function __construct(
        public int $syncRunId,
        public ?EarthquakeMapPinSyncResultDTO $syncStatus,
    ) {}
}
