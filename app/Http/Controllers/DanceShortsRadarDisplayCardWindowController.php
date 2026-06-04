<?php

namespace App\Http\Controllers;

use App\Actions\DanceShortsRadar\Queries\GetDanceShortDisplayCardWindowAction;
use App\DTO\DanceShortsRadar\Ranking\DanceShortVideoRankingPageInputDTO;
use App\Http\Requests\DanceShortsRadar\DanceShortDisplayCardWindowRequest;
use App\Responders\DanceShortsRadar\DanceShortVideoRankingResponder;
use Illuminate\Http\JsonResponse;

class DanceShortsRadarDisplayCardWindowController extends Controller
{
    public function __invoke(
        DanceShortDisplayCardWindowRequest $request,
        GetDanceShortDisplayCardWindowAction $action,
        DanceShortVideoRankingResponder $responder,
    ): JsonResponse {
        /*
         * 追加読み込み API 専用 Action へ検証済み query を渡します。
         *
         * Controller が直接 ranking / rising / ALL の分岐を持つと、初期表示と API で
         * 選択タブや window 正規化の仕様がずれやすくなります。ここでは Request から
         * DTO を作るだけにして、画面条件の解決は Action、JSON shape は Responder に任せます。
         */
        $input = new DanceShortVideoRankingPageInputDTO(
            regionCode: $request->regionCode(),
            comparisonDays: $request->comparisonDays(),
            limit: $request->limit(),
            sortKey: $request->sortKey(),
            startRank: $request->startRank(),
            windowSize: $request->windowSize(),
        );

        return $responder->cardWindow($action->execute($input)->displayCardField);
    }
}
