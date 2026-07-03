<?php

namespace App\Http\Controllers;

use App\Actions\ApiPreview\PreviewApisGuruListAction;
use App\Actions\ApiPreview\PreviewMockApisGuruErrorAction;
use App\Actions\ApiPreview\PreviewMockApisGuruListAction;
use App\Responders\ApiPreviewResponder;
use Illuminate\Http\Request;
use Inertia\Response;

/**
 * APIs.guru preview 画面群の HTTP 入口です。
 *
 * 実取得、成功モック、エラーモックを別 Action に分け、Controller では fetch query と Responder 接続だけを行います。
 */
class ApisGuruPreviewController extends Controller
{
    /**
     * fetch=1 の場合だけ実API取得を Action 側へ依頼します。
     */
    public function __invoke(
        Request $request,
        PreviewApisGuruListAction $action,
        ApiPreviewResponder $responder,
    ): Response {
        // 通常確認画面だけが fetch=1 を受け取り、Action 側で実 API 取得を判断します。
        return $responder->apisGuru($action->execute($request->boolean('fetch')));
    }

    /**
     * 成功レスポンスのレイアウト確認用モックを返します。
     */
    public function mock(PreviewMockApisGuruListAction $action, ApiPreviewResponder $responder): Response
    {
        // レイアウト確認用。Controller ではダミーデータを作らず Action に任せます。
        return $responder->apisGuru($action->execute());
    }

    /**
     * エラー表示確認用モックを返します。
     */
    public function mockError(PreviewMockApisGuruErrorAction $action, ApiPreviewResponder $responder): Response
    {
        // エラー表示確認用。成功モックとは別 Action にして責務を分けます。
        return $responder->apisGuru($action->execute());
    }
}
