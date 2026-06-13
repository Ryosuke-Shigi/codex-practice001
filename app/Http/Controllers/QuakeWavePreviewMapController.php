<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Queries\GetEarthquakeMapPinsAction;
use App\Factories\Earthquake\EarthquakeMapPinListQueryDTOFactory;
use App\Http\Requests\Earthquake\QuakeWavePreviewMapRequest;
use App\Responders\Earthquake\EarthquakeMapResponder;
use Inertia\Response;

/**
 * Japan Quake Wave Map 本体表示の HTTP 入口です。
 *
 * FormRequest で日付形式を検証し、Query DTO / Action / Responder へ処理を渡します。
 * feed取得、XML解析、map pin保存、同期開始は別ルートに分け、表示リクエストへ混ぜません。
 */
class QuakeWavePreviewMapController extends Controller
{
    /**
     * 保存済み earthquake_map_pins を地図表示 props へ渡すための入口です。
     */
    public function __invoke(
        QuakeWavePreviewMapRequest $request,
        GetEarthquakeMapPinsAction $action,
        EarthquakeMapResponder $responder,
        EarthquakeMapPinListQueryDTOFactory $queryFactory,
    ): Response {
        /*
         * MAP 表示の HTTP 入口です。
         * 第1段階では保存済み earthquake_map_pins を読むだけにし、Atom feed取得、
         * 個別XML解析、Job起動、DB保存はこの画面表示から切り離します。
         */
        $query = $queryFactory->fromDateRange(
            startDate: $request->validated('startDate'),
            endDate: $request->validated('endDate'),
        );

        return $responder($action->execute($query), $query);
    }
}
