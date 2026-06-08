<?php

namespace App\Services\DanceShortsRadar;

class DanceShortVideoRegionService
{
    public function shouldSaveVideoRegion(int $videoId, int $regionId): bool
    {
        /*
         * 発見関係は保存済み動画と検索元 region の正の ID が揃った場合だけ作成します。
         * tracking_status の意味判断や DB 存在確認は別レイヤーに置きます。
         */
        return $videoId > 0 && $regionId > 0;
    }
}
