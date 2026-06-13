<?php

namespace App\Http\Controllers;

use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Responders\Earthquake\EarthquakeFeedEntrySyncStatusResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        Request $request,
        EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
        EarthquakeFeedEntrySyncStatusResponder $responder,
    ): JsonResponse {
        $syncRunId = $request->integer('syncRunId') > 0
            ? $request->integer('syncRunId')
            : $request->integer('sync_id');

        return $responder->status(
            $syncRunId > 0 ? $syncRunRepository->findResult($syncRunId) : null,
        );
    }
}
