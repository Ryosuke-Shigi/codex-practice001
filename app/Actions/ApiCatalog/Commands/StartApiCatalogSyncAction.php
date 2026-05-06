<?php

namespace App\Actions\ApiCatalog\Commands;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Jobs\ApiCatalog\SyncApiCatalogJob;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepositoryInterface;
use RuntimeException;

final readonly class StartApiCatalogSyncAction
{
    public function __construct(
        private ApiCatalogSyncStatusRepositoryInterface $repository,
    ) {
    }

    public function execute(): ApiCatalogSyncStatusDTO
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
         * 状態レコードは同期開始時に作り、Job 側で running / completed / failed へ進めます。
         */
        $syncRun = $this->repository->createQueued();

        SyncApiCatalogJob::dispatch((int) $syncRun->getKey());

        return $this->repository->findStatusById((int) $syncRun->getKey())
            ?? throw new RuntimeException('API catalog sync status was not created.');
    }
}
