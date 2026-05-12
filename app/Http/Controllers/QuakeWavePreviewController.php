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
                'title' => '地震情報MAP',
                'summary' => 'DB保存済みの earthquake_map_pins を読み込み、震源・震度・波紋を地図上で確認します。',
                'status' => 'Ready',
                'href' => '/quakewave-preview/map',
            ],
            [
                'id' => 'map-mock',
                'title' => 'MAPモック',
                'summary' => '仮データを共通地図コンポーネントへ渡し、表示レイヤーの見え方だけを確認します。',
                'status' => 'Mock',
                'href' => '/quakewave-preview/map/mock',
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
