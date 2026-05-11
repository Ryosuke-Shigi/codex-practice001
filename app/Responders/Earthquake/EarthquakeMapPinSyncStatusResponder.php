<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use Illuminate\Http\JsonResponse;

final readonly class EarthquakeMapPinSyncStatusResponder
{
    public function started(int $syncRunId, ?EarthquakeMapPinSyncResultDTO $status): JsonResponse
    {
        return response()->json([
            'syncRunId' => $syncRunId,
            'syncStatus' => $status?->toArray(),
        ]);
    }

    public function status(?EarthquakeMapPinSyncResultDTO $status): JsonResponse
    {
        return response()->json([
            'syncStatus' => $status?->toArray(),
        ]);
    }

    public function unavailable(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'syncStatus' => null,
        ], 503);
    }
}
