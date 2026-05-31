<?php

namespace App\Repositories\DanceShortsRadar;

use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use Illuminate\Database\Eloquent\Collection;

class DanceShortSearchTargetRepository implements DanceShortSearchTargetRepositoryInterface
{
    /**
     * @return Collection<int, DanceShortRegion>
     */
    public function activeRegions(): Collection
    {
        /*
         * 同期対象 region の DB 条件は Repository に閉じます。
         * Action 側は「有効な地域を順番に処理する」だけを知ればよく、
         * is_active や sort_order の Eloquent 条件を持ちません。
         */
        return DanceShortRegion::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    /**
     * @return Collection<int, DanceShortSearchKeyword>
     */
    public function activeKeywordsForRegion(DanceShortRegion $region): Collection
    {
        /*
         * keyword は region ごとの同期入力です。
         * 非アクティブ keyword を除く判断は DB 取得条件として扱い、YouTube API の検索条件 DTO は
         * Action 側で region と keyword を組み合わせて作ります。
         */
        return DanceShortSearchKeyword::query()
            ->where('region_id', $region->getKey())
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }
}
