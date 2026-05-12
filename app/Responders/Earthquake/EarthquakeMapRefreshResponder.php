<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use Illuminate\Http\JsonResponse;

final readonly class EarthquakeMapRefreshResponder
{
    public function started(
        int $feedEntrySyncRunId,
        int $mapPinSyncRunId,
        ?EarthquakeFeedEntrySyncResultDTO $feedEntrySyncStatus,
        ?EarthquakeMapPinSyncResultDTO $mapPinSyncStatus,
    ): JsonResponse {
        return response()->json([
            'feedEntrySyncRunId' => $feedEntrySyncRunId,
            'mapPinSyncRunId' => $mapPinSyncRunId,
            'feedEntrySyncStatus' => $feedEntrySyncStatus?->toArray(),
            'mapPinSyncStatus' => $mapPinSyncStatus?->toArray(),
        ]);
    }

    public function unavailable(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'feedEntrySyncStatus' => null,
            'mapPinSyncStatus' => null,
        ], 503);
    }
}
