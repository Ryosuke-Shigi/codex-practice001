<?php

namespace App\DTO\ApiCatalog\Sync;

use App\Models\ApiCatalogSyncRun;
use Carbon\CarbonInterface;

final readonly class ApiCatalogSyncStatusDTO
{
    public const STATUS_QUEUED = 'queued';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public function __construct(
        public int $id,
        public string $status,
        public ApiCatalogSyncResultDTO $result,
        public ?string $errorMessage,
        public ?CarbonInterface $startedAt,
        public ?CarbonInterface $finishedAt,
        public ?CarbonInterface $createdAt,
        public ?CarbonInterface $updatedAt,
    ) {
    }

    public static function fromModel(ApiCatalogSyncRun $syncRun): self
    {
        return new self(
            id: (int) $syncRun->getKey(),
            status: (string) $syncRun->status,
            result: new ApiCatalogSyncResultDTO(
                totalCount: (int) $syncRun->total_count,
                insertedCount: (int) $syncRun->inserted_count,
                updatedCount: (int) $syncRun->updated_count,
                skippedCount: (int) $syncRun->skipped_count,
                inactiveCount: (int) $syncRun->inactive_count,
                failedCount: (int) $syncRun->failed_count,
            ),
            errorMessage: $syncRun->error_message,
            startedAt: $syncRun->started_at,
            finishedAt: $syncRun->finished_at,
            createdAt: $syncRun->created_at,
            updatedAt: $syncRun->updated_at,
        );
    }

    public function isRunning(): bool
    {
        return in_array($this->status, [self::STATUS_QUEUED, self::STATUS_RUNNING], true);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'isRunning' => $this->isRunning(),
            'result' => [
                'totalCount' => $this->result->totalCount,
                'insertedCount' => $this->result->insertedCount,
                'updatedCount' => $this->result->updatedCount,
                'skippedCount' => $this->result->skippedCount,
                'inactiveCount' => $this->result->inactiveCount,
                'failedCount' => $this->result->failedCount,
            ],
            'errorMessage' => $this->errorMessage,
            'startedAt' => $this->dateToString($this->startedAt),
            'finishedAt' => $this->dateToString($this->finishedAt),
            'createdAt' => $this->dateToString($this->createdAt),
            'updatedAt' => $this->dateToString($this->updatedAt),
        ];
    }

    private function dateToString(?CarbonInterface $date): ?string
    {
        return $date?->toIso8601String();
    }
}
