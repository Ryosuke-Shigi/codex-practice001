<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use App\DTO\Earthquake\Map\EarthquakeMapPinListQueryDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * QuakeWave Map 画面の Inertia props を整える Responder です。
 *
 * Repository から戻った MapPinListDTO と検索DTOを Page props に変換します。
 * DB取得条件やピンの表示演出はここで判断せず、出力形の固定だけを担当します。
 */
class EarthquakeMapResponder
{
    public function __invoke(EarthquakeMapPinListDTO $pins, EarthquakeMapPinListQueryDTO $query): Response
    {
        /*
         * Responder は Inertia props の形だけを決めます。
         * pin の取得件数や表示演出の判断を混ぜず、React 側がそのまま扱える camelCase の
         * pins 配列として渡します。空配列でも同じ props 形を維持します。
         *
         * latitude / longitude は DB と PHP DTO では string として守り、React の投影計算に
         * 入る直前だけ Number() へ変換します。そのためここでも数値化や丸めは行いません。
         */
        return Inertia::render('QuakeWavePreview/QuakeWaveMapPage', [
            'pins' => $pins->toArray()['items'],
            'filters' => $query->filtersToArray(),
        ]);
    }
}
