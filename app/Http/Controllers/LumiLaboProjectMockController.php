<?php

namespace App\Http\Controllers;

use App\Actions\LumiLabo\Queries\GetLumiLaboProjectMockListAction;
use App\Responders\LumiLabo\LumiLaboProjectMockResponder;
use Inertia\Response;

/**
 * LumiLabo 案件一覧 MOCK の HTTP 入口です。
 *
 * 固定データの取得は Query Action、Inertia props は Responder へ分けます。
 */
class LumiLaboProjectMockController extends Controller
{
    public function __invoke(
        GetLumiLaboProjectMockListAction $action,
        LumiLaboProjectMockResponder $responder,
    ): Response {
        return $responder->index($action->execute());
    }
}
