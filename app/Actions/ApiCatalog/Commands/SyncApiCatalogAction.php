<?php

namespace App\Actions\ApiCatalog\Commands;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncResultDTO;
use App\Services\ApiCatalog\ApiCatalogSyncService;

/**
 * APIカタログ同期の Command Action です。
 *
 * Artisan Command / Job から呼ばれる同期ユースケースの入口として、同期本体の業務判断は
 * ApiCatalogSyncService に委譲し、ここでは実行手順と ResultDTO の受け渡しだけを扱います。
 */
class SyncApiCatalogAction
{
    public function __construct(
        private readonly ApiCatalogSyncService $service,
    ) {}

    /**
     * APIs.guru 由来のカタログを同期し、挿入・更新・無効化の件数を返します。
     */
    public function execute(): ApiCatalogSyncResultDTO
    {
        return $this->service->sync();
    }
}
