<?php

namespace App\Http\Controllers;

use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Responders\Earthquake\EarthquakeMapPinSyncStatusResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        Request $request,
        EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
        EarthquakeMapPinSyncStatusResponder $responder,
    ): JsonResponse {
        $syncRunId = $request->integer('syncRunId') > 0
            ? $request->integer('syncRunId')
            : $request->integer('sync_id');

        return $responder->status(
            $syncRunId > 0 ? $syncRunRepository->findResult($syncRunId) : null,
        );
    }
}
