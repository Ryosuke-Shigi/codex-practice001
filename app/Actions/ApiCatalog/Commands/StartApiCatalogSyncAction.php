<?php

namespace App\Actions\ApiCatalog\Commands;

use App\Jobs\ApiCatalog\SyncApiCatalogJob;

final readonly class StartApiCatalogSyncAction
{
    public function execute(): void
    {
        /*
         * 一覧画面のボタンは「同期開始」の入口です。
         * 同期処理本体は直接実行せず、SyncApiCatalogJob を Queue に積みます。
         * 実処理は queue worker が SyncApiCatalogAction / ApiCatalogSyncService を実行します。
         * Scheduler からも同じ Job を投入し、手動更新と定期更新で同期本体を二重化しません。
         *
         * ここで onConnection('sync') は指定しません。
         * Queue 接続先は .env / queue.php の設定に委ね、HTTP リクエストは
         * 「Job を受け付けた」時点で返します。
         * 完了判定、失敗通知、同期履歴は別の状態管理機能で扱う前提です。
         */
        SyncApiCatalogJob::dispatch();
    }
}
