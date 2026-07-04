<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Commands\StartEarthquakeMapPinSyncAction;
use App\Responders\Earthquake\EarthquakeMapPinSyncStatusResponder;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * QuakeWave Preview の map pin 同期開始 API の HTTP 入口です。
 *
 * POST から Command Action を起動し、個別XML取得と pin 生成は Queue Job 側へ渡します。
 * Controller には pin 生成可否や Repository 条件を置きません。
 */
class QuakeWavePreviewMapPinSyncController extends Controller
{
    /**
     * map pin 同期を開始し、polling 用の syncRunId と初期 status を返します。
     */
    public function __invoke(
        StartEarthquakeMapPinSyncAction $action,
        EarthquakeMapPinSyncStatusResponder $responder,
    ): JsonResponse {
        try {
            /*
             * Controller はPOST入口だけを担当します。
             * map pin生成の対象選定、XML取得、解析、DB保存は Action / Job / Service / Repository に分けます。
             */
            $result = $action->executeWithInitialStatus();
        } catch (RuntimeException $exception) {
            /*
             * migration未適用など開始前提の欠落は、SQL例外ではなく短いJSON messageにします。
             * Reactはこのmessageを表示し、pollingは開始しません。
             */
            return $responder->unavailable($exception->getMessage());
        }

        return $responder->started($result);
    }
}
