<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;

interface EarthquakeMapPinSyncRunRepositoryInterface
{
    public function isStorageReady(): bool;

    public function createPending(): int;

    public function markRunning(int $syncRunId): void;

    public function markCompleted(int $syncRunId, EarthquakeMapPinSyncResultDTO $result): void;

    public function markFailed(int $syncRunId, string $message): void;

    public function findResult(int $syncRunId): ?EarthquakeMapPinSyncResultDTO;

    /**
     * @return array<int, EarthquakeMapPinSyncResultDTO>
     */
    public function latest(int $limit = 10): array;
}
