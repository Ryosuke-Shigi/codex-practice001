<?php

namespace App\Repositories\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;

interface EarthquakeFeedEntrySyncRunRepositoryInterface
{
    public function isStorageReady(): bool;

    public function createPending(): int;

    public function markRunning(int $syncRunId): void;

    public function markCompleted(int $syncRunId, EarthquakeFeedEntrySyncResultDTO $result): void;

    public function markFailed(int $syncRunId, string $message): void;

    public function findResult(int $syncRunId): ?EarthquakeFeedEntrySyncResultDTO;

    /**
     * @return array<int, EarthquakeFeedEntrySyncResultDTO>
     */
    public function latest(int $limit = 10): array;
}
