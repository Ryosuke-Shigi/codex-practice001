<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Sync\EarthquakeFeedEntrySyncResultDTO;
use App\DTO\Earthquake\Sync\EarthquakeMapPinSyncResultDTO;
use Inertia\Inertia;
use Inertia\Response;

final readonly class QuakeWavePreviewIndexResponder
{
    /**
     * @param  array{
     *     mocks: array<int, array<string, string>>,
     *     visualPreview: array<string, mixed>,
     *     savedFeedEntries: array<int, array<string, mixed>>,
     *     feedEntrySyncRuns: array<int, EarthquakeFeedEntrySyncResultDTO>,
     *     savedMapPins: array<int, array<string, mixed>>,
     *     mapPinSyncRuns: array<int, EarthquakeMapPinSyncResultDTO>
     * }  $preview
     */
    public function __invoke(array $preview): Response
    {
        /*
         * Responder は React Page が期待する props の形だけを決めます。
         * sync run DTO の toArray() や「最新1件を現在ステータスとして渡す」という Inertia 都合を
         * Controller / Action へ置かないことで、読み取り手順と出力整形の境界を分けます。
         */
        $feedEntrySyncRuns = array_map(
            fn (EarthquakeFeedEntrySyncResultDTO $syncRun): array => $syncRun->toArray(),
            $preview['feedEntrySyncRuns'],
        );
        $mapPinSyncRuns = array_map(
            fn (EarthquakeMapPinSyncResultDTO $syncRun): array => $syncRun->toArray(),
            $preview['mapPinSyncRuns'],
        );

        return Inertia::render('QuakeWavePreview/Index', [
            'mocks' => $preview['mocks'],
            'visualPreview' => $preview['visualPreview'],
            'savedFeedEntries' => $preview['savedFeedEntries'],
            'feedEntrySyncStatus' => $feedEntrySyncRuns[0] ?? null,
            'feedEntrySyncRuns' => $feedEntrySyncRuns,
            'savedMapPins' => $preview['savedMapPins'],
            'mapPinSyncStatus' => $mapPinSyncRuns[0] ?? null,
            'mapPinSyncRuns' => $mapPinSyncRuns,
        ]);
    }
}
