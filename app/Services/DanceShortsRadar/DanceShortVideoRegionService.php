<?php

namespace App\Services\DanceShortsRadar;

/**
 * 動画と発見元 region の保存可否を判断する Service です。
 *
 * 正の ID が揃っているかだけを判断し、DB存在確認や tracking_status の意味判断は持ちません。
 */
class DanceShortVideoRegionService
{
    /**
     * dance_short_video_regions に保存してよい ID 組み合わせかを返します。
     */
    public function shouldSaveVideoRegion(int $videoId, int $regionId): bool
    {
        /*
         * 発見関係は保存済み動画と検索元 region の正の ID が揃った場合だけ作成します。
         * tracking_status の意味判断や DB 存在確認は別レイヤーに置きます。
         */
        return $videoId > 0 && $regionId > 0;
    }
}
