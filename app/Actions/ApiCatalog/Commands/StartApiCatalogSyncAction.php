<?php

namespace App\Actions\ApiCatalog\Commands;

use App\Jobs\ApiCatalog\SyncApiCatalogJob;

final readonly class StartApiCatalogSyncAction
{
    public function execute(): void
    {
        /*
         * 一覧画面のボタンは「同期開始」の入口です。
         * 実際の取得・差分判定・DB保存は既存の SyncApiCatalogJob / Service / Repository に委ねます。
         * HTTPリクエスト中に list.json の取得からDB保存まで待たせないよう、ここではJob投入だけにします。
         */
        SyncApiCatalogJob::dispatch();
    }
}
