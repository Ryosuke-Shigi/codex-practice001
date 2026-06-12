<?php

namespace App\DTO\DanceShortsRadar\Sync;

use Carbon\CarbonInterface;

/*
 * dance_short_video_regions へ保存する動画と発見元 region の関係だけを運ぶ DTO です。
 *
 * snapshot の有無や tracking_status の意味判断は持たせず、Repository 境界の保存値だけに限定します。
 */
final readonly class DanceShortVideoRegionSaveDTO
{
    public function __construct(
        public int $video_id,
        public int $region_id,
        public CarbonInterface $detected_at,
    ) {}
}
