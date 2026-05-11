<?php

namespace App\Http\Controllers;

use App\Services\Earthquake\EarthquakeXmlPreviewService;
use Inertia\Inertia;
use Inertia\Response;

class QuakeWavePreviewMapController extends Controller
{
    public function __invoke(EarthquakeXmlPreviewService $service): Response
    {
        /*
         * MAP 表示は開いたタイミングで Atom feed の最新 entry だけを一度取得します。
         * ここでは DB 保存、Scheduler、個別 XML 解析による本座標変換には進まず、
         * 最新 entry と連動した仮ピンで、MAP 上のピン・波紋表示だけを確認します。
         */
        $latestFeedEntryPreview = $service->fetchLatestHighFrequencyEntryPreview();

        return Inertia::render('QuakeWavePreview/Map', [
            /*
             * pins は本番用 DTO ではなく、最新 entry と画面表現を結ぶサンプル props です。
             * 個別 XML 解析で緯度経度と震度が取れるようになったら、ここを本番用 DTO に置き換えます。
             */
            'pins' => $service->previewPinsFromLatestEntryPreview($latestFeedEntryPreview),
            'latestFeedEntryPreview' => $latestFeedEntryPreview,
        ]);
    }
}
