<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Queries\GetEarthquakeFeedEntrySyncStatusAction;
use App\Http\Requests\Earthquake\QuakeWaveSyncStatusRequest;
use App\Responders\Earthquake\EarthquakeFeedEntrySyncStatusResponder;
use Illuminate\Http\JsonResponse;

/**
 * QuakeWave Preview の feed entry 同期 status API の HTTP 入口です。
 *
 * React polling から syncRunId / sync_id を受け取り、JSON shape の整形は Responder に任せます。
 * この Controller では同期本体の再実行や失敗復旧を行いません。
 */
class QuakeWavePreviewFeedEntrySyncStatusController extends Controller
{
    /**
     * 指定された同期runの現在状態を返します。
     */
    public function __invoke(
        QuakeWaveSyncStatusRequest $request,
        GetEarthquakeFeedEntrySyncStatusAction $action,
        EarthquakeFeedEntrySyncStatusResponder $responder,
    ): JsonResponse {
        $syncRunId = $request->syncRunId();

        return $responder->status($action->execute($syncRunId));
    }
}
