<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinListDTO;
use Inertia\Inertia;
use Inertia\Response;

class EarthquakeMapResponder
{
    public function __invoke(EarthquakeMapPinListDTO $pins): Response
    {
        /*
         * Responder は Inertia props の形だけを決めます。
         * pin の取得件数や表示演出の判断を混ぜず、React 側がそのまま扱える camelCase の
         * pins 配列として渡します。空配列でも同じ props 形を維持します。
         *
         * latitude / longitude は DB と PHP DTO では string として守り、React の投影計算に
         * 入る直前だけ Number() へ変換します。そのためここでも数値化や丸めは行いません。
         */
        return Inertia::render('QuakeWavePreview/Map', [
            'pins' => $pins->toArray()['items'],
        ]);
    }
}
