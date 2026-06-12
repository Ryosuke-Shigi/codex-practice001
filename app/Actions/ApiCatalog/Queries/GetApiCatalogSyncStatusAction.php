<?php

namespace App\Actions\ApiCatalog\Queries;

use App\DTO\ApiCatalog\Sync\ApiCatalogSyncStatusDTO;
use App\Repositories\ApiCatalog\ApiCatalogSyncStatusRepositoryInterface;

/**
 * APIカタログ同期状態を読み取る Query Action です。
 *
 * 画面の polling と初期表示の両方から使われ、指定IDまたは最新runの状態DTOを返します。
 * 状態の保存・更新は Repository / Job 側に置き、この層では読み取り入口だけを扱います。
 */
final readonly class GetApiCatalogSyncStatusAction
{
    public function __construct(
        private ApiCatalogSyncStatusRepositoryInterface $repository,
    ) {}

    public function execute(?int $syncRunId = null): ?ApiCatalogSyncStatusDTO
    {
        if ($syncRunId !== null) {
            return $this->repository->findStatusById($syncRunId);
        }

        return $this->repository->findLatestStatus();
    }
}
