<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Queries\GetQuakeWavePreviewIndexAction;
use App\Responders\Earthquake\QuakeWavePreviewIndexResponder;
use Inertia\Response;

class QuakeWavePreviewController extends Controller
{
    public function __invoke(
        GetQuakeWavePreviewIndexAction $action,
        QuakeWavePreviewIndexResponder $responder,
    ): Response {
        /*
         * QuakeWave Preview 開発入口の HTTP 境界です。
         * ここでは Repository 取得、固定カード配列、Inertia props 組み立てを行わず、
         * Query Action が集めた画面データを Responder へ渡すだけにします。
         */
        return $responder($action->execute());
    }
}
