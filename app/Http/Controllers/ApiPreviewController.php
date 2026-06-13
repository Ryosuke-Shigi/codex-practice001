<?php

namespace App\Http\Controllers;

use App\Actions\ApiPreview\ListApiPreviewsAction;
use Inertia\Response;

/**
 * API Preview 一覧画面の HTTP 入口です。
 *
 * 本体機能の同期やDB保存から切り離した、外部API確認用ページだけを返します。
 */
class ApiPreviewController extends Controller
{
    /**
     * preview 対象一覧を Action へ委譲して返します。
     */
    public function __invoke(ListApiPreviewsAction $action): Response
    {
        // 一覧画面の HTTP 入口です。表示データの組み立ては Action に任せます。
        return $action->execute();
    }
}
