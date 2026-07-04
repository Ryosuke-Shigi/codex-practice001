<?php

namespace App\Actions\Earthquake\Queries;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;

/**
 * QuakeWave feed entry 同期 status を取得する Query Action です。
 *
 * Request が解釈した syncRunId を受け取り、現在状態の取得だけを Repository へ委譲します。
 */
final readonly class GetEarthquakeFeedEntrySyncStatusAction
{
    public function __construct(
        private EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
    ) {}

    public function execute(?int $syncRunId): ?EarthquakeFeedEntrySyncResultDTO
    {
        return $syncRunId !== null
            ? $this->syncRunRepository->findResult($syncRunId)
            : null;
    }
}
