<?php

namespace App\Http\Controllers;

use App\Actions\Lab\Queries\GetDanceShortsRadarMockCandidatesAction;
use App\Responders\Lab\DanceShortsRadarMockResponder;
use Inertia\Response;

/**
 * Dance Shorts Radar モック画面の HTTP 入口です。
 *
 * Controller は「どの画面を返すか」の入口に限定します。
 * モック候補の定義、地域別の並び替え、Inertia props の整形をここへ置くと、
 * API接続やDB保存を追加する次工程で責務が膨らみやすくなります。
 *
 * そのため、候補データの組み立ては Query Action、Inertia::render() は Responder へ渡し、
 * Controller 自体は Action の結果を Responder へ橋渡しするだけにしています。
 */
class DanceShortsRadarMockController extends Controller
{
    /**
     * 固定モック候補を Action から受け取り、Responder 経由で Inertia に渡します。
     */
    public function __invoke(
        GetDanceShortsRadarMockCandidatesAction $action,
        DanceShortsRadarMockResponder $responder,
    ): Response {
        /*
         * ここでは YouTube Data API、Repository、DB、snapshot には触りません。
         * API 疎通前モックであることをコード上でも明確にし、後続実装の混入を防ぎます。
         */
        return $responder->index($action->execute());
    }
}
