<?php

namespace App\Http\Controllers;

use App\Actions\DanceShortsRadar\Queries\GetDanceShortVideoRankingPageAction;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\Http\Requests\DanceShortsRadar\DanceShortVideoRankingRequest;
use App\Responders\DanceShortsRadar\DanceShortVideoRankingResponder;
use Inertia\Response;

/*
 * DanceShortsRadar 通常ランキング本画面の HTTP 入口です。
 *
 * Controller が担当するのは、FormRequest で検証済みの query を入力 DTO に移し、
 * Query Action の結果を Responder へ渡すところまでです。snapshot の取得条件、metric 計算、
 * region の初期選択、Inertia props の形は、それぞれ下位層へ分けます。
 *
 * ここに YouTube API 呼び出しや Eloquent query を置くと、通常ランキング表示と同期処理の境界が
 * 崩れるため、この Controller は橋渡しだけに保ちます。
 */
class DanceShortsRadarController extends Controller
{
    public function __invoke(
        DanceShortVideoRankingRequest $request,
        GetDanceShortVideoRankingPageAction $action,
        DanceShortVideoRankingResponder $responder,
    ): Response {
        $input = new DanceShortVideoRankingPageInputDTO(
            regionCode: $request->regionCode(),
            comparisonDays: $request->comparisonDays(),
            limit: $request->limit(),
            sortKey: $request->sortKey(),
            startRank: $request->startRank(),
            windowSize: $request->windowSize(),
            selectedVideoId: $request->selectedVideoId(),
        );

        return $responder->index($action->execute($input));
    }
}
