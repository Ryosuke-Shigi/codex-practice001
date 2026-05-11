<?php

namespace App\Http\Controllers;

use App\Factories\Earthquake\EarthquakeVisualPreviewFactory;
use App\Repositories\Earthquake\EarthquakeFeedEntryRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinRepositoryInterface;
use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use Inertia\Inertia;
use Inertia\Response;

class QuakeWavePreviewController extends Controller
{
    public function __invoke(
        EarthquakeVisualPreviewFactory $visualPreviewFactory,
        EarthquakeFeedEntryRepositoryInterface $feedEntryRepository,
        EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
        EarthquakeMapPinRepositoryInterface $mapPinRepository,
        EarthquakeMapPinSyncRunRepositoryInterface $mapPinSyncRunRepository,
    ): Response {
        $mocks = [
            [
                'id' => 'map-display',
                'title' => 'MAP表示',
                'summary' => '水背景の上に日本地図を重ね、後で地震ピンと波紋を配置する土台を確認します。',
                'status' => 'Ready',
                'href' => '/quakewave-preview/map',
            ],
            [
                'id' => 'xml-preview',
                'title' => 'XML取得プレビュー',
                'summary' => '気象庁の地震火山情報 Atom フィードを取得し、entry の title / updated / link を確認します。',
                'status' => 'Ready',
                'href' => '/quakewave-preview/xml',
            ],
        ];
        $syncRuns = $syncRunRepository->latest(10);
        $mapPinSyncRuns = $mapPinSyncRunRepository->latest(10);

        return Inertia::render('QuakeWavePreview/Index', [
            'mocks' => $mocks,
            'visualPreview' => $visualPreviewFactory->makeDefault()->toArray(),
            'savedFeedEntries' => $feedEntryRepository->latest(20),
            'feedEntrySyncStatus' => isset($syncRuns[0]) ? $syncRuns[0]->toArray() : null,
            'feedEntrySyncRuns' => array_map(
                fn ($syncRun): array => $syncRun->toArray(),
                $syncRuns,
            ),
            'savedMapPins' => $mapPinRepository->latest(20),
            'mapPinSyncStatus' => isset($mapPinSyncRuns[0]) ? $mapPinSyncRuns[0]->toArray() : null,
            'mapPinSyncRuns' => array_map(
                fn ($syncRun): array => $syncRun->toArray(),
                $mapPinSyncRuns,
            ),
        ]);
    }
}
