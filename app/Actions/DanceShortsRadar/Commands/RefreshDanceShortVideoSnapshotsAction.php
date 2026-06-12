<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSnapshotRefreshTargetDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSnapshotCreateDTOFactory;
use App\Repositories\DanceShortsRadar\DanceShortVideoRegionRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotPeriodService;
use App\Services\DanceShortsRadar\DanceShortVideoTrackingService;
use Carbon\CarbonImmutable;
use Throwable;

class RefreshDanceShortVideoSnapshotsAction
{
    private const YOUTUBE_VIDEOS_LIST_CHUNK_SIZE = 50;

    public function __construct(
        private readonly YouTubeVideoApiRepositoryInterface $youTubeVideoApiRepository,
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
         * search.list は呼ばず、active 条件の決定、50件単位の videos.list 取得、
         * JST12時間枠 update/create の手順をこの Action に閉じます。
         */
        $executedAt = CarbonImmutable::now();
        $collectedAt = $executedAt->utc();
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

        foreach (array_chunk(array_keys($targetsByYoutubeVideoId), self::YOUTUBE_VIDEOS_LIST_CHUNK_SIZE) as $youtubeVideoIds) {
            try {
                $details = $this->youTubeVideoApiRepository->fetchVideoDetails($youtubeVideoIds);
            } catch (Throwable) {
                $failedCount += count($youtubeVideoIds);

                continue;
            }

            $fetchedVideoDetailCount += count($details);

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
