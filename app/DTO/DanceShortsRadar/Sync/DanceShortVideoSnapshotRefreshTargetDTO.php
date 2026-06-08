<?php

namespace App\DTO\DanceShortsRadar\Sync;

/*
 * snapshot 専用同期で videos.list へ渡す保存済み動画と、
 * その動画を再観測する region_id 群を運ぶ DTO です。
 *
 * tracking_status の意味判断や DB query はここには置かず、
 * Action / Service / Repository の境界をまたぐ値だけを保持します。
 */
final readonly class DanceShortVideoSnapshotRefreshTargetDTO
{
    /**
     * @param  array<int, int>  $region_ids
     */
    public function __construct(
        public int $video_id,
        public string $youtube_video_id,
        public array $region_ids,
    ) {
    }
}
