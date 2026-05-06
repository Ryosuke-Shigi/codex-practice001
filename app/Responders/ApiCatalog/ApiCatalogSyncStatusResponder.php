<?php

namespace App\Responders\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use Illuminate\Http\JsonResponse;

final readonly class ApiCatalogSyncStatusResponder
{
    public function json(?ApiCatalogSyncStatusDTO $status): JsonResponse
    {
        return response()->json([
            'syncStatus' => $status?->toArray(),
        ]);
    }
}
