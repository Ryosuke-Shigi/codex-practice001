<?php

namespace App\Http\Controllers;

use App\Actions\LumiLabo\Queries\GetLumiLaboProjectMockListAction;
use App\Http\Requests\LumiLabo\LumiLaboProjectMockIndexRequest;
use App\Responders\LumiLabo\LumiLaboProjectMockResponder;
use Inertia\Response;

/**
 * LumiLabo 案件一覧 MOCK の HTTP 入口です。
 *
 * 固定データの検索、登録日順、ページ分割は Query Action、Inertia props は Responder へ分けます。
 */
class LumiLaboProjectMockController extends Controller
{
    public function __invoke(
        LumiLaboProjectMockIndexRequest $request,
        GetLumiLaboProjectMockListAction $action,
        LumiLaboProjectMockResponder $responder,
    ): Response {
        return $responder->index($action->execute(
            $request->keyword(),
            $request->sort(),
            $request->page(),
            $request->perPage(),
            $request->deletedProjectIds(),
            $request->projectOverrides(),
        ));
    }
}
