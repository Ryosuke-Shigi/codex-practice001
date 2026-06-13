<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use Illuminate\Http\JsonResponse;

/**
 * QuakeWave map refresh API の JSON shape を整える Responder です。
 *
 * feed entry 同期と map pin 同期を同時に開始した結果を画面用キーへ変換します。
 * 各同期の成功/失敗判断や進行状態の保存は Action / Repository 側の責務です。
 */
final readonly class EarthquakeMapRefreshResponder
{
    /**
     * feed entry / map pin の同期 run ID と初期 status を返します。
     */
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

    /**
     * 同期開始前提が欠けている場合に、画面へ公開してよい短い message を返します。
     */
    public function unavailable(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'feedEntrySyncStatus' => null,
            'mapPinSyncStatus' => null,
        ], 503);
    }
}
