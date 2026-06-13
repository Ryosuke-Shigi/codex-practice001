<?php

namespace App\Factories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotCreateDTO;
use App\DTO\DanceShortsRadar\Sync\YouTubeVideoDetailDTO;
use Carbon\CarbonInterface;
use InvalidArgumentException;

/**
 * YouTube 動画詳細 DTO から snapshot 保存 DTO を生成する Factory です。
 *
 * viewCount 欠落時は snapshot の実測値を作れないため例外にし、0 補完や保存可否判断は行いません。
 */
class DanceShortVideoSnapshotCreateDTOFactory
{
    /**
     * videos.list の詳細値を dance_short_video_snapshots 保存用 DTO に変換します。
     *
     * @throws InvalidArgumentException viewCount が欠落し、snapshot の実測値として保存できない場合。
     */
    public function fromYouTubeVideoDetail(
        YouTubeVideoDetailDTO $detail,
        int $videoId,
        int $regionId,
        CarbonInterface $collectedAt,
    ): DanceShortVideoSnapshotCreateDTO {
        /*
         * snapshot は取得時点の実測値を保存するため、viewCount が欠落している動画は
         * DTO 化しません。0 を補完すると「実測0」と「未取得」の区別が消えるので、
         * 通常は EligibilityService で skip し、ここでは最後の防御として例外にします。
         */
        if ($detail->viewCount === null) {
            throw new InvalidArgumentException('YouTube video view count is required to create a snapshot.');
        }

        return new DanceShortVideoSnapshotCreateDTO(
            video_id: $videoId,
            region_id: $regionId,
            view_count: $detail->viewCount,
            like_count: $detail->likeCount,
            comment_count: $detail->commentCount,
            collected_at: $collectedAt,
        );
    }
}
