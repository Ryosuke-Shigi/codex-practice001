<?php

namespace App\Responders\ApiCatalog;

use App\DTO\ApiCatalog\List\ApiCatalogListResultDTO;
use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * APIカタログ一覧の Inertia props を整える Responder です。
 *
 * Query Action が返した ListDTO と同期状態DTOを React Page が読む形へ変換します。
 * 検索条件のDB適用や同期中判定の更新は行わず、出力整形だけを担当します。
 */
final readonly class ApiCatalogListResponder
{
    public function index(ApiCatalogListResultDTO $result, ?ApiCatalogSyncStatusDTO $syncStatus): Response
    {
        /*
         * 将来の Inertia 部分更新に備え、props は filters / providers /
         * apiCatalogItems / pagination に分けて返します。
         */
        return Inertia::render('ApiCatalog/Index', array_merge($result->toArray(), [
            'syncStatus' => $syncStatus?->toArray(),
        ]));
    }
}
