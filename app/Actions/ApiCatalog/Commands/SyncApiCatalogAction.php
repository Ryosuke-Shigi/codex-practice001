<?php

namespace App\Actions\ApiCatalog\Commands;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\Services\ApiCatalog\ApiCatalogSyncService;

class SyncApiCatalogAction
{
    public function __construct(
        private readonly ApiCatalogSyncService $service,
    ) {
    }

    public function execute(): ApiCatalogSyncResultDTO
    {
        return $this->service->sync();
    }
}
