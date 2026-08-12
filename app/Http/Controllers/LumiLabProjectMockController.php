<?php

namespace App\Http\Controllers;

use App\Actions\LumiLab\Queries\GetLumiLabProjectMockListAction;
use App\Responders\LumiLab\LumiLabProjectMockResponder;
use Inertia\Response;

/**
 * LumiLab 案件一覧 MOCK の HTTP 入口です。
 *
 * 固定データの取得は Query Action、Inertia props は Responder へ分けます。
 */
class LumiLabProjectMockController extends Controller
{
    public function __invoke(
        GetLumiLabProjectMockListAction $action,
        LumiLabProjectMockResponder $responder,
    ): Response {
        return $responder->index($action->execute());
    }
}
