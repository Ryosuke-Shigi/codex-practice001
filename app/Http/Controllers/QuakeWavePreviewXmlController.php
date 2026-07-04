<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Queries\GetQuakeWavePreviewXmlAction;
use App\Responders\Earthquake\QuakeWavePreviewXmlResponder;
use Inertia\Response;

/**
 * QuakeWave Preview の XML 確認画面の HTTP 入口です。
 *
 * 外部 XML 取得と preview DTO 化は Service / Repository に分け、Controller は Inertia 接続だけを扱います。
 */
class QuakeWavePreviewXmlController extends Controller
{
    /**
     * 高頻度 feed preview 結果を XML確認ページへ渡します。
     */
    public function __invoke(
        GetQuakeWavePreviewXmlAction $action,
        QuakeWavePreviewXmlResponder $responder,
    ): Response {
        return $responder($action->execute());
    }
}
