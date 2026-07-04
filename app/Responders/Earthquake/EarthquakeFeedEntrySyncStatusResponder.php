<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncStartResultDTO;
use Illuminate\Http\JsonResponse;

/**
 * QuakeWave feed entry 同期 status API の JSON shape を整える Responder です。
 *
 * polling に必要な `syncRunId` / `syncStatus` だけを返し、同期処理や例外整形は持ちません。
 */
final readonly class EarthquakeFeedEntrySyncStatusResponder
{
    /**
     * 同期開始直後の syncRunId と初期 status を返します。
     */
    public function started(EarthquakeFeedEntrySyncStartResultDTO $result): JsonResponse
    {
        return response()->json([
            'syncRunId' => $result->syncRunId,
            'syncStatus' => $result->syncStatus?->toArray(),
        ]);
    }

    /**
     * polling 用に現在の status だけを返します。
     */
    public function status(?EarthquakeFeedEntrySyncResultDTO $status): JsonResponse
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
