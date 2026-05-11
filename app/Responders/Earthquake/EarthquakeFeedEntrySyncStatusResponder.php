<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use Illuminate\Http\JsonResponse;

final readonly class EarthquakeFeedEntrySyncStatusResponder
{
    public function started(int $syncRunId, ?EarthquakeFeedEntrySyncResultDTO $status): JsonResponse
    {
        return response()->json([
            'syncRunId' => $syncRunId,
            'syncStatus' => $status?->toArray(),
        ]);
    }

    public function status(?EarthquakeFeedEntrySyncResultDTO $status): JsonResponse
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
