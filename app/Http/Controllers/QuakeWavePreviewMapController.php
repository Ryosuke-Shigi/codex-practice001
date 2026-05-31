<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Queries\GetEarthquakeMapPinsAction;
use App\Factories\Earthquake\EarthquakeMapPinListQueryDTOFactory;
use App\Http\Requests\Earthquake\QuakeWavePreviewMapRequest;
use App\Responders\Earthquake\EarthquakeMapResponder;
use Inertia\Response;

class QuakeWavePreviewMapController extends Controller
{
    public function __invoke(
        QuakeWavePreviewMapRequest $request,
        GetEarthquakeMapPinsAction $action,
        EarthquakeMapResponder $responder,
        EarthquakeMapPinListQueryDTOFactory $queryFactory,
    ): Response
    {
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
