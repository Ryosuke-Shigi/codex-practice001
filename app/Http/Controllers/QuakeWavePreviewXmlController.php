<?php

namespace App\Http\Controllers;

use App\Services\Earthquake\EarthquakeXmlPreviewService;
use Inertia\Inertia;
use Inertia\Response;

/**
 * QuakeWave Preview の XML 確認画面の HTTP 入口です。
 *
 * 外部 XML 取得と preview DTO 化は Service / Repository に分け、Controller は Inertia 接続だけを扱います。
 */
class QuakeWavePreviewXmlController extends Controller
{
    /**
     * 高頻度 feed preview 結果を XML確認ページへ渡します。
     */
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
