<?php

namespace App\DTO\ApiCatalog\Sync;

use App\Models\ApiCatalogSyncRun;
use Carbon\CarbonInterface;

final readonly class ApiCatalogSyncStatusDTO
{
    /*
     * Queue worker が止まっている、または Job が異常終了して failed hook まで届かない場合、
     * queued/running のまま状態レコードが残ることがあります。
     * 画面の同期ボタンを永久に disabled にしないため、一定時間更新がなければ stale として扱います。
     */
    private const STALE_AFTER_MINUTES = 20;

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
    ) {}

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
        /*
         * DB上の status が queued/running でも、古い状態は「現在実行中」とは見なしません。
         * React 側はこの値だけを見てボタン制御するため、DTO の時点で stale を除外します。
         */
        return in_array($this->status, [self::STATUS_QUEUED, self::STATUS_RUNNING], true)
            && ! $this->isStale();
    }

    public function isStale(): bool
    {
        /*
         * completed/failed は終端状態なので stale 判定の対象外です。
         * queued は worker が拾えていない状態、running は worker 処理中の状態として扱い、
         * updated_at が一定時間動かなければ「worker確認が必要な古い同期状態」と判断します。
         */
        if (! in_array($this->status, [self::STATUS_QUEUED, self::STATUS_RUNNING], true)) {
            return false;
        }

        $lastUpdatedAt = $this->updatedAt ?? $this->createdAt;

        return $lastUpdatedAt !== null
            && $lastUpdatedAt->lessThan(now()->subMinutes(self::STALE_AFTER_MINUTES));
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
            'isStale' => $this->isStale(),
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
