<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Commands\StartEarthquakeMapPinSyncAction;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Responders\Earthquake\EarthquakeMapPinSyncStatusResponder;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class QuakeWavePreviewMapPinSyncController extends Controller
{
    public function __invoke(
        StartEarthquakeMapPinSyncAction $action,
        EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
        EarthquakeMapPinSyncStatusResponder $responder,
    ): JsonResponse {
        try {
            /*
             * Controller はPOST入口だけを担当します。
             * map pin生成の対象選定、XML取得、解析、DB保存は Action / Job / Service / Repository に分けます。
             */
            $syncRunId = $action->execute();
        } catch (RuntimeException $exception) {
            /*
             * migration未適用など開始前提の欠落は、SQL例外ではなく短いJSON messageにします。
             * Reactはこのmessageを表示し、pollingは開始しません。
             */
            return $responder->unavailable($exception->getMessage());
        }

        return $responder->started(
            $syncRunId,
            $syncRunRepository->findResult($syncRunId),
        );
    }
}
