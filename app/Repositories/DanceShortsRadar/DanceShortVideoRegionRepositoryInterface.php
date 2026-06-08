<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoRegionSaveDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotRefreshTargetDTO;
use App\Models\DanceShortVideoRegion;

interface DanceShortVideoRegionRepositoryInterface
{
    public function upsert(DanceShortVideoRegionSaveDTO $dto): DanceShortVideoRegion;

    /**
     * snapshot 専用同期の候補を、動画と region の発見関係に基づいて取得します。
     *
     * Repository は active の意味判断をせず、Action / Service から渡された tracking_status 条件で DB を絞ります。
     * snapshot は保存先の履歴なので、対象 video_id / region_id の根拠には使いません。
     *
     * @return array<int, DanceShortVideoSnapshotRefreshTargetDTO>
     */
    public function snapshotRefreshTargetsByTrackingStatus(
        string $trackingStatus,
        int $maxVideosPerRun,
    ): array;
}
