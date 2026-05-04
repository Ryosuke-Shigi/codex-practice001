<?php

namespace App\Services\ApiCatalog;

use App\Repositories\ApiCatalog\ApisGuruRepositoryInterface;

class ApiCatalogSyncService
{
    public function __construct(
        private readonly ApisGuruRepositoryInterface $apisGuruRepository,
    ) {
    }

    public function sync(): void
    {
        $this->apisGuruRepository->fetchList();

        // TODO: DTO変換・差分判定・DB保存は後続で実装
    }
}
