<?php

namespace App\Http\Controllers;

use App\Services\Earthquake\EarthquakeXmlPreviewService;
use Inertia\Inertia;
use Inertia\Response;

class QuakeWavePreviewXmlController extends Controller
{
    public function __invoke(EarthquakeXmlPreviewService $service): Response
    {
        /*
         * Controller は HTTP 入口として Preview Service を呼ぶだけにします。
         * XML の HTTP 取得は Repository、Atom entry の DTO 化は Service に分け、
         * ここでは Inertia page と props の接続だけを担当します。
         */
        return Inertia::render('QuakeWavePreview/XmlPreview', [
            'result' => $service->fetchHighFrequencyFeedPreview(),
        ]);
    }
}
