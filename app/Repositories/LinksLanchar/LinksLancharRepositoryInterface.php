<?php

namespace App\Repositories\LinksLanchar;

use App\DTO\LinksLanchar\LinksLancharSnapshotDTO;
use App\DTO\LinksLanchar\LinkSnapshotDTO;

interface LinksLancharRepositoryInterface
{
    /**
     * 不存在と論理削除を区別するため、削除済みの本体も取得します。
     */
    public function find(string $linksLancharKey): ?LinksLancharSnapshotDTO;

    /**
     * @return list<LinkSnapshotDTO>
     */
    public function findVisibleLinks(string $linksLancharKey): array;
}
