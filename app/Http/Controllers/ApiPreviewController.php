<?php

namespace App\Http\Controllers;

use App\Actions\ApiPreview\ListApiPreviewsAction;
use App\Responders\ApiPreviewResponder;
use Inertia\Response;

/**
 * API Preview 一覧画面の HTTP 入口です。
 *
 * 本体機能の同期やDB保存から切り離した、外部API確認用ページだけを返します。
 */
class ApiPreviewController extends Controller
{
    /**
     * preview 対象一覧を Action から受け取り、Responder 経由で返します。
     */
    public function __invoke(ListApiPreviewsAction $action, ApiPreviewResponder $responder): Response
    {
        // 一覧画面の HTTP 入口です。Inertia Response 生成は Responder に任せます。
        return $responder->index($action->execute());
    }
}
