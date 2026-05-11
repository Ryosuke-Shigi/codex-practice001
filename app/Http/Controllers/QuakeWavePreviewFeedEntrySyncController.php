<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Commands\StartEarthquakeFeedEntrySyncAction;
use App\Repositories\Earthquake\EarthquakeFeedEntrySyncRunRepositoryInterface;
use App\Responders\Earthquake\EarthquakeFeedEntrySyncStatusResponder;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class QuakeWavePreviewFeedEntrySyncController extends Controller
{
    public function __invoke(
        StartEarthquakeFeedEntrySyncAction $action,
        EarthquakeFeedEntrySyncRunRepositoryInterface $syncRunRepository,
        EarthquakeFeedEntrySyncStatusResponder $responder,
    ): JsonResponse {
        try {
            /*
             * Controller は POST の入口として Action を呼ぶだけに留めます。
             * Action が返す syncRunId は「同期完了」ではなく「Queue へ投入した同期run」のIDです。
             */
            $syncRunId = $action->execute();
        } catch (RuntimeException $exception) {
            /*
             * migration 未適用など、同期開始の前提が欠けている場合は JSON で短く返します。
             * React はこの message を表示し、Laravel の SQL 例外や stack trace は画面へ出しません。
             */
            return $responder->unavailable($exception->getMessage());
        }

        return $responder->started(
            $syncRunId,
            $syncRunRepository->findResult($syncRunId),
        );
    }
}
