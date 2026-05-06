<?php

namespace App\Responders\ApiCatalog;

use App\DTO\ApiCatalog\List\ApiCatalogListResultDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use Inertia\Inertia;
use Inertia\Response;

final readonly class ApiCatalogListResponder
{
    public function index(ApiCatalogListResultDTO $result, ?ApiCatalogSyncStatusDTO $syncStatus): Response
    {
        /*
         * 将来の Inertia 部分更新に備え、props は filters / providers /
         * apiCatalogItems / pagination に分けて返します。
         */
        return Inertia::render('ApiCatalog/Index', array_merge($result->toArray(), [
            'syncStatus' => $syncStatus?->toArray(),
        ]));
    }
}
