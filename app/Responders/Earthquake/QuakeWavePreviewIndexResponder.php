<?php

namespace App\Responders\Earthquake;

use App\DTO\Earthquake\Preview\QuakeWavePreviewIndexResultDTO;
use Inertia\Inertia;
use Inertia\Response;

final readonly class QuakeWavePreviewIndexResponder
{
    public function __invoke(QuakeWavePreviewIndexResultDTO $preview): Response
    {
        /*
         * Responder は React Page が期待する props の形だけを決めます。
         * sync run DTO の toArray() や「最新1件を現在ステータスとして渡す」という Inertia 都合を
         * Controller / Action へ置かないことで、読み取り手順と出力整形の境界を分けます。
         */
        $feedEntrySyncRuns = $preview->feedEntrySyncRunsToArray();
        $mapPinSyncRuns = $preview->mapPinSyncRunsToArray();

        return Inertia::render('QuakeWavePreview/Index', [
            'mocks' => $preview->mocks,
            'visualPreview' => $preview->visualPreview->toArray(),
            'savedFeedEntries' => $preview->savedFeedEntries,
            'feedEntrySyncStatus' => $feedEntrySyncRuns[0] ?? null,
            'feedEntrySyncRuns' => $feedEntrySyncRuns,
            'savedMapPins' => $preview->savedMapPins,
            'mapPinSyncStatus' => $mapPinSyncRuns[0] ?? null,
            'mapPinSyncRuns' => $mapPinSyncRuns,
        ]);
    }
}
