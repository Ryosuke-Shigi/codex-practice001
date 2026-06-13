<?php

namespace App\Responders\ApiCatalog;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use Illuminate\Http\JsonResponse;

/**
 * API Discovery Hub 同期状態 API の JSON shape を整える Responder です。
 *
 * status DTO の配列化だけを扱い、Queue の状態遷移や失敗判断は Action / Repository に置きます。
 */
final readonly class ApiCatalogSyncStatusResponder
{
    /**
     * React polling が読む `syncStatus` キーを固定して返します。
     */
    public function json(?ApiCatalogSyncStatusDTO $status): JsonResponse
    {
        return response()->json([
            'syncStatus' => $status?->toArray(),
        ]);
    }
}
