<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Queries\GetQuakeWavePreviewIndexAction;
use App\Responders\Earthquake\QuakeWavePreviewIndexResponder;
use Inertia\Response;

/**
 * QuakeWave Preview 開発入口ページの HTTP 入口です。
 *
 * 入口カードや preview props の構築は Query Action / Responder に分け、Controller は接続だけを担当します。
 */
class QuakeWavePreviewController extends Controller
{
    /**
     * QuakeWave Preview index の画面データを取得して Inertia response に変換します。
     */
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
