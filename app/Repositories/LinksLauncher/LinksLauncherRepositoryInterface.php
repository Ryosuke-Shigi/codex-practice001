<?php

namespace App\Repositories\LinksLauncher;

use App\DTO\LinksLauncher\LinksLauncherSnapshotDTO;
use App\DTO\LinksLauncher\LinkSnapshotDTO;

interface LinksLauncherRepositoryInterface
{
    /**
     * 不存在と論理削除を区別するため、削除済みの本体も取得します。
     */
    public function find(string $linksLauncherKey): ?LinksLauncherSnapshotDTO;

    /**
     * @return list<LinkSnapshotDTO>
     */
    public function findVisibleLinks(string $linksLauncherKey): array;
}
