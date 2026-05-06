<?php

namespace App\Actions\ApiCatalog\Queries;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepositoryInterface;

final readonly class GetApiCatalogSyncStatusAction
{
    public function __construct(
        private ApiCatalogSyncStatusRepositoryInterface $repository,
    ) {
    }

    public function execute(?int $syncRunId = null): ?ApiCatalogSyncStatusDTO
    {
        if ($syncRunId !== null) {
            return $this->repository->findStatusById($syncRunId);
        }

        return $this->repository->findLatestStatus();
    }
}
