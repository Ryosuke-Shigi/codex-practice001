<?php

namespace App\Http\Controllers;

use App\Actions\DanceShortsAnalyzer\Queries\GetDanceShortsAnalyzerSearchPageAction;
use App\DTO\DanceShortsAnalyzer\Search\DanceShortsAnalyzerSearchInputDTO;
use App\Http\Requests\DanceShortsAnalyzer\DanceShortsAnalyzerSearchRequest;
use App\Responders\DanceShortsAnalyzer\DanceShortsAnalyzerSearchResponder;
use Inertia\Response;

/*
 * DanceShortsAnalyzer PRODUCT 画面の HTTP 入口です。
 *
 * Controller は FormRequest で検証済みの query を InputDTO へ移し、
 * Query Action の結果を Responder へ渡すところまでに限定します。
 * DB検索、YouTube URL生成、Inertia props整形はそれぞれ Repository / Responder 側へ分離します。
 */
class DanceShortsAnalyzerController extends Controller
{
    /**
     * PRODUCT 検索画面を表示します。
     *
     * ここでは依存をつなぐだけに留めます。画面仕様の判断は Action、
     * DB 境界は Repository、表示 props と URL 生成は Responder に残すことで、
     * PR2 以降に snapshot / Analyze 処理を足しても入口が肥大化しないようにします。
     */
    public function __invoke(
        DanceShortsAnalyzerSearchRequest $request,
        GetDanceShortsAnalyzerSearchPageAction $action,
        DanceShortsAnalyzerSearchResponder $responder,
    ): Response {
        $input = new DanceShortsAnalyzerSearchInputDTO(
            keyword: $request->keyword(),
            page: $request->page(),
            sort: $request->sort(),
        );

        return $responder->index($action->execute($input));
    }
}
