<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotRefreshTargetDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSnapshotCreateDTOFactory;
use App\Repositories\DanceShortsRadar\DanceShortVideoRegionRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoDetailFetchResultRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotPeriodService;
use App\Services\DanceShortsRadar\DanceShortVideoTrackingService;
use App\Support\ApplicationTimeZone;
use Carbon\CarbonImmutable;
use Throwable;

class RefreshDanceShortVideoSnapshotsAction
{
    public function __construct(
        private readonly YouTubeVideoDetailFetchResultRepositoryInterface $youTubeVideoApiRepository,
        private readonly DanceShortVideoRegionRepositoryInterface $videoRegionRepository,
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortVideoSnapshotCreateDTOFactory $snapshotCreateDTOFactory,
        private readonly DanceShortSnapshotPeriodService $snapshotPeriodService,
        private readonly DanceShortVideoTrackingService $trackingService,
    ) {}

    public function execute(): DanceShortVideoSyncResultDTO
    {
        /*
         * snapshot 専用同期は保存済み video-region 関係に基づく継続観測だけを行います。
         * search.list は呼ばず、active 条件の決定、JST12時間枠 update/create、
         * 同期結果集約の手順をこの Action に閉じます。videos.list の50件分割、
         * API連携ログ集約、chunk失敗集計は Repository / Result DTO に任せます。
         */
        $executedAt = CarbonImmutable::now(ApplicationTimeZone::name());
        $collectedAt = $executedAt;
        $snapshotPeriod = $this->snapshotPeriodService->jstTwelveHourPeriod($executedAt);
        $targets = $this->videoRegionRepository->snapshotRefreshTargetsByTrackingStatus(
            trackingStatus: $this->trackingService->snapshotRefreshTargetStatus(),
            maxVideosPerRun: $this->maxVideosPerRun(),
        );

        if ($targets === []) {
            return new DanceShortVideoSyncResultDTO(executedAt: $executedAt);
        }

        $targetsByYoutubeVideoId = $this->targetsByYoutubeVideoId($targets);
        $fetchedVideoDetailCount = 0;
        $savedSnapshotCount = 0;
        $skippedVideoCount = 0;
        $skippedPersistenceCount = 0;
        $failedCount = 0;

        try {
            $detailFetchResult = $this->youTubeVideoApiRepository->fetchVideoDetailsResult(array_keys($targetsByYoutubeVideoId));
        } catch (Throwable) {
            $failedCount = count($targetsByYoutubeVideoId);

            return new DanceShortVideoSyncResultDTO(
                executedAt: $executedAt,
                fetchedVideoCount: count($targetsByYoutubeVideoId),
                failedCount: $failedCount,
            );
        }

        $details = $detailFetchResult->details;
        $failedCount += $detailFetchResult->failedTargetVideoIdCount;
        $fetchedVideoDetailCount = count($details);

        foreach ($details as $detail) {
            $target = $targetsByYoutubeVideoId[$detail->youtubeVideoId] ?? null;

            if ($target === null) {
                $skippedVideoCount++;

                continue;
            }

            if ($detail->viewCount === null) {
                $skippedPersistenceCount += count($target->region_ids);

                continue;
            }

            foreach ($target->region_ids as $regionId) {
                try {
                    $snapshotDTO = $this->snapshotCreateDTOFactory->fromYouTubeVideoDetail(
                        detail: $detail,
                        videoId: $target->video_id,
                        regionId: $regionId,
                        collectedAt: $collectedAt,
                    );

                    $this->snapshotRepository->updateLatestInPeriodOrCreate(
                        dto: $snapshotDTO,
                        periodStartAt: $snapshotPeriod['start'],
                        periodEndAt: $snapshotPeriod['end'],
                    );
                    $savedSnapshotCount++;
                } catch (Throwable) {
                    $failedCount++;
                }
            }
        }

        return new DanceShortVideoSyncResultDTO(
            executedAt: $executedAt,
            fetchedVideoCount: count($targetsByYoutubeVideoId),
            fetchedVideoDetailCount: $fetchedVideoDetailCount,
            savedSnapshotCount: $savedSnapshotCount,
            skippedVideoCount: $skippedVideoCount,
            skippedPersistenceCount: $skippedPersistenceCount,
            failedCount: $failedCount,
        );
    }

    private function maxVideosPerRun(): int
    {
        return max(1, (int) config('dance_short.snapshot_refresh.max_videos_per_run', 8000));
    }

    /**
     * @param  array<int, DanceShortVideoSnapshotRefreshTargetDTO>  $targets
     * @return array<string, DanceShortVideoSnapshotRefreshTargetDTO>
     */
    private function targetsByYoutubeVideoId(array $targets): array
    {
        $targetsByYoutubeVideoId = [];

        foreach ($targets as $target) {
            $youtubeVideoId = trim($target->youtube_video_id);

            if ($youtubeVideoId !== '') {
                $targetsByYoutubeVideoId[$youtubeVideoId] = $target;
            }
        }

        return $targetsByYoutubeVideoId;
    }
}
