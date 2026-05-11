<?php

namespace App\DTO\Earthquake\Sync;

use App\Models\EarthquakeFeedEntrySyncRun;
use Carbon\CarbonInterface;

final readonly class EarthquakeFeedEntrySyncResultDTO
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public function __construct(
        public int $syncRunId,
        public string $status,
        public int $totalCount,
        public int $insertedCount,
        public int $updatedCount,
        public int $skippedCount,
        public int $failedCount,
        public ?string $errorMessage,
        public ?CarbonInterface $startedAt,
        public ?CarbonInterface $finishedAt,
    ) {
    }

    public static function fromModel(EarthquakeFeedEntrySyncRun $syncRun): self
    {
        return new self(
            syncRunId: (int) $syncRun->getKey(),
            status: (string) $syncRun->status,
            totalCount: (int) $syncRun->total_count,
            insertedCount: (int) $syncRun->inserted_count,
            updatedCount: (int) $syncRun->updated_count,
            skippedCount: (int) $syncRun->skipped_count,
            failedCount: (int) $syncRun->failed_count,
            errorMessage: $syncRun->error_message,
            startedAt: $syncRun->started_at,
            finishedAt: $syncRun->finished_at,
        );
    }

    public function isRunning(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_RUNNING], true);
    }

    /**
     * @return array<string, int|string|null|bool>
     */
    public function toArray(): array
    {
        return [
            'syncRunId' => $this->syncRunId,
            'status' => $this->status,
            'isRunning' => $this->isRunning(),
            'totalCount' => $this->totalCount,
            'insertedCount' => $this->insertedCount,
            'updatedCount' => $this->updatedCount,
            'skippedCount' => $this->skippedCount,
            'failedCount' => $this->failedCount,
            'errorMessage' => $this->errorMessage,
            'startedAt' => $this->dateToString($this->startedAt),
            'finishedAt' => $this->dateToString($this->finishedAt),
        ];
    }

    private function dateToString(?CarbonInterface $date): ?string
    {
        return $date?->toIso8601String();
    }
}
