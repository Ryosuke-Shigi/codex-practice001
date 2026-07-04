<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Commands\StartEarthquakeMapRefreshAction;
use App\Responders\Earthquake\EarthquakeMapRefreshResponder;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * QuakeWave Map 更新POSTの HTTP 入口です。
 *
 * Controller は統合更新Actionを呼び、開始結果を JSON Responder へ渡します。
 * XML取得・pin生成・同期状態の業務判断は Action / Job / Service に分離します。
 */
class QuakeWavePreviewMapRefreshController extends Controller
{
    public function __invoke(
        StartEarthquakeMapRefreshAction $action,
        EarthquakeMapRefreshResponder $responder,
    ): JsonResponse {
        try {
            /*
             * Controller は地図更新POSTの入口だけを担当します。
             * ここでXML取得やpin生成を直接実行せず、Actionが作った2つのsyncRunIdと
             * 初期状態だけをJSON化します。
             */
            $result = $action->executeWithInitialStatus();
        } catch (RuntimeException $exception) {
            return $responder->unavailable($exception->getMessage());
        }

        return $responder->started($result);
    }
}
