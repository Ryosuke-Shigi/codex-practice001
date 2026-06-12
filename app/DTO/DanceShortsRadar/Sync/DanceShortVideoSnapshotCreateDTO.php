<?php

namespace App\DTO\DanceShortsRadar\Sync;

use Carbon\CarbonInterface;

/*
 * dance_short_video_snapshots へ保存する取得時点の公開指標だけを運ぶ DTO です。
 *
 * view_count_delta / view_growth_rate / views_per_hour は snapshot 比較から算出する
 * 派生値なので、この DTO にも保存配列にも含めません。
 */
final readonly class DanceShortVideoSnapshotCreateDTO
{
    public function __construct(
        public int $video_id,
        public int $region_id,
        public int $view_count,
        public ?int $like_count,
        public ?int $comment_count,
        public CarbonInterface $collected_at,
    ) {}

    /**
     * @return array{
     *     video_id: int,
     *     region_id: int,
     *     view_count: int,
     *     like_count: int|null,
     *     comment_count: int|null,
     *     collected_at: string
     * }
     */
    public function toArray(): array
    {
        return [
            'video_id' => $this->video_id,
            'region_id' => $this->region_id,
            'view_count' => $this->view_count,
            'like_count' => $this->like_count,
            'comment_count' => $this->comment_count,
            'collected_at' => $this->collected_at->toDateTimeString(),
        ];
    }
}
