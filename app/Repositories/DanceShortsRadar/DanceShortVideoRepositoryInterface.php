<?php

namespace App\Repositories\DanceShortsRadar;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSaveDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotRefreshTargetDTO;
use App\Models\DanceShortVideo;

interface DanceShortVideoRepositoryInterface
{
    public const UPSERT_INSERTED = 'inserted';

    public const UPSERT_UPDATED = 'updated';

    public const UPSERT_SKIPPED = 'skipped';

    public function findByYoutubeVideoId(string $youtubeVideoId): ?DanceShortVideo;

    public function findByYoutubeVideoIdAndTrackingStatus(
        string $youtubeVideoId,
        string $trackingStatus,
    ): ?DanceShortVideo;

    /**
     * snapshot 専用同期の候補動画を、渡された tracking_status 条件に基づいて取得します。
     *
     * Repository は active の意味判断をせず、Action / Service から渡された状態値で DB を絞ります。
     * region_id は snapshot 由来ではなく、呼び出し側から渡された保存対象 region を使います。
     * 上限に達する場合は latest snapshot が古い動画、published_at が新しい動画、id 昇順で安定取得します。
     *
     * @param  array<int, int>  $regionIds
     * @return array<int, DanceShortVideoSnapshotRefreshTargetDTO>
     */
    public function snapshotRefreshTargetsByTrackingStatus(
        string $trackingStatus,
        int $maxVideosPerRun,
        array $regionIds,
    ): array;

    /**
     * @return array{
     *     video: DanceShortVideo,
     *     status: self::UPSERT_INSERTED|self::UPSERT_UPDATED|self::UPSERT_SKIPPED
     * }
     */
    public function upsert(DanceShortVideoSaveDTO $dto): array;
}
