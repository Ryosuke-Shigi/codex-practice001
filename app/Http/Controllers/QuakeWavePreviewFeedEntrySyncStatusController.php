<?php

namespace App\Http\Controllers;

use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Responders\Earthquake\EarthquakeFeedEntrySyncStatusResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuakeWavePreviewFeedEntrySyncStatusController extends Controller
{
    public function __invoke(
        Request $request,
        EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
        EarthquakeFeedEntrySyncStatusResponder $responder,
    ): JsonResponse {
        $syncRunId = $request->integer('syncRunId') > 0
            ? $request->integer('syncRunId')
            : $request->integer('sync_id');

        return $responder->status(
            $syncRunId > 0 ? $syncRunRepository->findResult($syncRunId) : null,
        );
    }
}
