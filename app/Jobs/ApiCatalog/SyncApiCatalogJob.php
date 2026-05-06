<?php

namespace App\Jobs\ApiCatalog;

use App\Actions\ApiCatalog\Commands\SyncApiCatalogAction;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SyncApiCatalogJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly ?int $syncRunId = null,
    ) {
    }

    public function handle(
        SyncApiCatalogAction $action,
        ApiCatalogSyncStatusRepositoryInterface $statusRepository,
    ): void {
        $syncRunId = $this->syncRunId ?? (int) $statusRepository->createQueued()->getKey();
        $statusRepository->markRunning($syncRunId, CarbonImmutable::now());

        try {
            $result = $action->execute();
        } catch (Throwable $exception) {
            $statusRepository->markFailed($syncRunId, $exception->getMessage(), CarbonImmutable::now(), 1);

            throw $exception;
        }

        $statusRepository->markCompleted($syncRunId, $result, CarbonImmutable::now());
    }
}
