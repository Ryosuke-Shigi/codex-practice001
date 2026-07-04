<?php

namespace App\Actions\Earthquake\Queries;

use App\DTO\Earthquake\Preview\EarthquakeXmlFeedPreviewResultDTO;
use App\Services\Earthquake\EarthquakeXmlPreviewService;

/**
 * QuakeWave XML preview の取得結果を返す Query Action です。
 *
 * Controller から Preview Service を直接呼ばず、HTTP入口と取得手順の境界を分けます。
 */
final readonly class GetQuakeWavePreviewXmlAction
{
    public function __construct(
        private EarthquakeXmlPreviewService $service,
    ) {}

    public function execute(): EarthquakeXmlFeedPreviewResultDTO
    {
        return $this->service->fetchHighFrequencyFeedPreview();
    }
}
