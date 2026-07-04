<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Queries\GetEarthquakeMapPinSyncStatusAction;
use App\Http\Requests\Earthquake\QuakeWaveSyncStatusRequest;
use App\Responders\Earthquake\EarthquakeMapPinSyncStatusResponder;
use Illuminate\Http\JsonResponse;

/**
 * QuakeWave Preview の map pin 同期 status API の HTTP 入口です。
 *
 * React polling 専用に同期状態を返し、map pin の再生成やXML解析は行いません。
 */
class QuakeWavePreviewMapPinSyncStatusController extends Controller
{
    /**
     * 指定された map pin 同期runの現在状態を返します。
     */
    public function __invoke(
        QuakeWaveSyncStatusRequest $request,
        GetEarthquakeMapPinSyncStatusAction $action,
        EarthquakeMapPinSyncStatusResponder $responder,
    ): JsonResponse {
        $syncRunId = $request->syncRunId();

        return $responder->status($action->execute($syncRunId));
    }
}
