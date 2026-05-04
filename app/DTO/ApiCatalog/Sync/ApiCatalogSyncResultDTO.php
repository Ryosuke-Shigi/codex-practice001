<?php

namespace App\DTO\ApiCatalog\Sync;

final readonly class ApiCatalogSyncResultDTO
{
    public function __construct(
        public int $totalCount,
        public int $insertedCount,
        public int $updatedCount,
        public int $skippedCount,
        public int $inactiveCount,
        public int $failedCount,
    ) {
    }

    /**
     * @return array<string, int>
     */
    public function toArray(): array
    {
        return [
            'total_count' => $this->totalCount,
            'inserted_count' => $this->insertedCount,
            'updated_count' => $this->updatedCount,
            'skipped_count' => $this->skippedCount,
            'inactive_count' => $this->inactiveCount,
            'failed_count' => $this->failedCount,
        ];
    }
}
