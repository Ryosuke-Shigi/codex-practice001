<?php

namespace App\Http\Controllers;

use App\Actions\DanceShortsAnalyzer\Queries\GetDanceShortsAnalyzerAnalyzePageAction;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzeInputDTO;
use App\Http\Requests\DanceShortsAnalyzer\DanceShortsAnalyzerAnalyzeRequest;
use App\Responders\DanceShortsAnalyzer\DanceShortsAnalyzerAnalyzeResponder;
use Inertia\Response;

/**
 * DanceShortsAnalyzer Analyze 画面の HTTP 入口です。
 *
 * Controller は検証済み query を InputDTO へ移し、Query Action と Responder をつなぐだけにします。
 */
class DanceShortsAnalyzerAnalyzeController extends Controller
{
    public function __invoke(
        DanceShortsAnalyzerAnalyzeRequest $request,
        GetDanceShortsAnalyzerAnalyzePageAction $action,
        DanceShortsAnalyzerAnalyzeResponder $responder,
    ): Response {
        $input = new DanceShortsAnalyzerAnalyzeInputDTO(
            videoIds: $request->videoIds(),
            activeVideoId: $request->activeVideoId(),
        );

        return $responder->index($action->execute($input));
    }
}
