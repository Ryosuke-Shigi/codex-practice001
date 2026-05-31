<?php

namespace App\Repositories\DanceShortsRadar;

use App\Models\DanceShortVideoCategory;

interface DanceShortVideoCategoryRepositoryInterface
{
    /**
     * YouTube categoryId と地域コードの組み合わせから、地域別カテゴリを1件だけ取得します。
     *
     * categoryId は地域をまたいで同じ値が使われるため、categoryId 単体の取得口は用意しません。
     */
    public function findByYoutubeCategoryIdAndRegionCode(
        string $youtubeCategoryId,
        string $regionCode
    ): ?DanceShortVideoCategory;
}
