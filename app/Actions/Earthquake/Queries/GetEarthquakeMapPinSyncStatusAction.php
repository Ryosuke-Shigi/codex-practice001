<?php

namespace App\Actions\Earthquake\Queries;

use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;

/**
 * QuakeWave map pin 同期 status を取得する Query Action です。
 *
 * Request が解釈した syncRunId を受け取り、現在状態の取得だけを Repository へ委譲します。
 */
final readonly class GetEarthquakeMapPinSyncStatusAction
{
    public function __construct(
        private EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
    ) {}

    public function execute(?int $syncRunId): ?EarthquakeMapPinSyncResultDTO
    {
        return $syncRunId !== null
            ? $this->syncRunRepository->findResult($syncRunId)
            : null;
    }
}
