<?php

namespace App\Http\Controllers;

use App\Repositories\Earthquake\EarthquakeMapPinSyncRunRepositoryInterface;
use App\Responders\Earthquake\EarthquakeMapPinSyncStatusResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuakeWavePreviewMapPinSyncStatusController extends Controller
{
    public function __invoke(
        Request $request,
        EarthquakeMapPinSyncRunRepositoryInterface $syncRunRepository,
        EarthquakeMapPinSyncStatusResponder $responder,
    ): JsonResponse {
        $syncRunId = $request->integer('syncRunId') > 0
            ? $request->integer('syncRunId')
            : $request->integer('sync_id');

        return $responder->status(
            $syncRunId > 0 ? $syncRunRepository->findResult($syncRunId) : null,
        );
    }
}
