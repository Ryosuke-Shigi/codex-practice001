<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Preview\EarthquakeXmlFeedPreviewResultDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * QuakeWave XML preview 画面の Inertia props を整える Responder です。
 */
final readonly class QuakeWavePreviewXmlResponder
{
    public function __invoke(EarthquakeXmlFeedPreviewResultDTO $result): Response
    {
        return Inertia::render('QuakeWavePreview/XmlPreview', [
            'result' => $result->toArray(),
        ]);
    }
}
