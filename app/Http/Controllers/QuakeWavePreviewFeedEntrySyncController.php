<?php

namespace App\Http\Controllers;

use App\Actions\Earthquake\Commands\StartEarthquakeFeedEntrySyncAction;
use App\Responders\Earthquake\EarthquakeFeedEntrySyncStatusResponder;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * QuakeWave Preview の feed entry 同期開始 API の HTTP 入口です。
 *
 * POST を受けて Command Action を呼び、Queue 投入後の sync status JSON を Responder へ委譲します。
 * Atom feed の取得や entry 保存は HTTP request 内では実行しません。
 */
class QuakeWavePreviewFeedEntrySyncController extends Controller
{
    /**
     * feed entry 同期を開始し、polling に必要な syncRunId と初期 status を返します。
     */
    public function __invoke(
        StartEarthquakeFeedEntrySyncAction $action,
        EarthquakeFeedEntrySyncStatusResponder $responder,
    ): JsonResponse {
        try {
            /*
             * Controller は POST の入口として Action を呼ぶだけに留めます。
             * Action が返す開始結果は「同期完了」ではなく「Queue へ投入した同期run」の初期状態です。
             */
            $result = $action->executeWithInitialStatus();
        } catch (RuntimeException $exception) {
            /*
             * migration 未適用など、同期開始の前提が欠けている場合は JSON で短く返します。
             * React はこの message を表示し、Laravel の SQL 例外や stack trace は画面へ出しません。
             */
            return $responder->unavailable($exception->getMessage());
        }

        return $responder->started($result);
    }
}
