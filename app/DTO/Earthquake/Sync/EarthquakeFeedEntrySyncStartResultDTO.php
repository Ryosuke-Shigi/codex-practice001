<?php

namespace App\DTO\Earthquake\Sync;

final readonly class EarthquakeFeedEntrySyncStartResultDTO
{
    public function __construct(
        public int $syncRunId,
        public ?EarthquakeFeedEntrySyncResultDTO $syncStatus,
    ) {}
}
