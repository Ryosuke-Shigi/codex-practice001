<?php

namespace App\Repositories\DanceShortsRadar;

use App\Models\DanceShortVideoCategory;

class DanceShortVideoCategoryRepository implements DanceShortVideoCategoryRepositoryInterface
{
    /**
     * YouTube API の categoryId は「音楽 = 10」のように地域をまたいで共通の値になります。
     * 一方、タイトルや assignable の扱いは region_code ごとに変わる可能性があります。
     *
     * ここでは Eloquent の検索条件を Repository に閉じ込め、呼び出し側には
     * 「categoryId と regionCode の両方が必要」という境界だけを見せます。
     */
    public function findByYoutubeCategoryIdAndRegionCode(
        string $youtubeCategoryId,
        string $regionCode
    ): ?DanceShortVideoCategory {
        return DanceShortVideoCategory::query()
            ->where('youtube_category_id', $youtubeCategoryId)
            ->where('region_code', $regionCode)
            ->first();
    }
}
