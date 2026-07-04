<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncStartResultDTO;
use Illuminate\Http\JsonResponse;

/**
 * QuakeWave map pin 同期 status API の JSON shape を整える Responder です。
 *
 * React polling 用のキーを固定し、例外本文や内部スタック情報は返しません。
 */
final readonly class EarthquakeMapPinSyncStatusResponder
{
    /**
     * 同期開始直後の syncRunId と初期 status を返します。
     */
    public function started(EarthquakeMapPinSyncStartResultDTO $result): JsonResponse
    {
        return response()->json([
            'syncRunId' => $result->syncRunId,
            'syncStatus' => $result->syncStatus?->toArray(),
        ]);
    }

    /**
     * polling 用に現在の status だけを返します。
     */
    public function status(?EarthquakeMapPinSyncResultDTO $status): JsonResponse
    {
        return response()->json([
            'syncStatus' => $status?->toArray(),
        ]);
    }

    /**
     * storage 未準備など開始不能時の公開 message を返します。
     */
    public function unavailable(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'syncStatus' => null,
        ], 503);
    }
}
