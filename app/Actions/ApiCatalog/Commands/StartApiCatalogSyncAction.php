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
         *
         * 注意:
         * .env の QUEUE_CONNECTION=redis だけに任せると、queue worker が動いていない環境では
         * ボタン押下後に「ジョブを積んだだけ」で同期が進みません。
         * API一覧の手動更新はユーザーがその場で反映を期待する操作なので、この入口だけは
         * sync connection を明示して、HTTPリクエスト内で同期処理まで完了させます。
         */
        SyncApiCatalogJob::dispatch()->onConnection('sync');
    }
}
