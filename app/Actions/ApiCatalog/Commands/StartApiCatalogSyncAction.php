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
    ) {}

    public function execute(): ?ApiCatalogSyncStatusDTO
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
         *
         * 本番反映直後は、コードだけが先に更新されて migration がまだ未適用の時間帯があり得ます。
         * そのタイミングで状態テーブルを読みに行くと 42S02 で一覧画面ごと落ちるため、
         * 保存先が未準備なら「状態表示なし」で既存の同期 Job だけを投入します。
         * 状態追跡はテーブル作成後に自動で有効になるため、同期本体の可用性を優先します。
         */
        if (! $this->repository->isStorageReady()) {
            SyncApiCatalogJob::dispatch();

            return null;
        }

        $syncRun = $this->repository->createQueued();

        SyncApiCatalogJob::dispatch((int) $syncRun->getKey());

        return $this->repository->findStatusById((int) $syncRun->getKey())
            ?? throw new RuntimeException('API catalog sync status was not created.');
    }
}
