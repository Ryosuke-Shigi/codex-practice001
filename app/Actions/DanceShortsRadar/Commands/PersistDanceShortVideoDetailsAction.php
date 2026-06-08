<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\DTO\DanceShortsRadar\Sync\DanceShortVideoRegionSaveDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSaveDTOFactory;
use App\Factories\DanceShortsRadar\DanceShortVideoSnapshotCreateDTOFactory;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoRegionRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotPeriodService;
use App\Services\DanceShortsRadar\DanceShortVideoEligibilityService;
use App\Services\DanceShortsRadar\DanceShortVideoRegionService;
use App\Services\DanceShortsRadar\DanceShortVideoTrackingService;
use Carbon\CarbonInterface;
use Throwable;

class PersistDanceShortVideoDetailsAction
{
    public function __construct(
        private readonly YouTubeVideoApiRepositoryInterface $youTubeVideoApiRepository,
        private readonly DanceShortVideoRepositoryInterface $videoRepository,
        private readonly DanceShortVideoRegionRepositoryInterface $videoRegionRepository,
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortVideoEligibilityService $eligibilityService,
        private readonly DanceShortSnapshotPeriodService $snapshotPeriodService,
        private readonly DanceShortVideoRegionService $videoRegionService,
        private readonly DanceShortVideoTrackingService $trackingService,
        private readonly DanceShortVideoSaveDTOFactory $videoSaveDTOFactory,
        private readonly DanceShortVideoSnapshotCreateDTOFactory $snapshotCreateDTOFactory,
    ) {
    }

    /**
     * @param  array<int, string>  $youtubeVideoIds
     */
    public function execute(
        DanceShortRegion $region,
        array $youtubeVideoIds,
        CarbonInterface $executedAt,
        CarbonInterface $collectedAt,
    ): DanceShortVideoSyncResultDTO {
        if ($youtubeVideoIds === []) {
            return new DanceShortVideoSyncResultDTO(executedAt: $executedAt);
        }

        $snapshotPeriod = $this->snapshotPeriodService->jstTwelveHourPeriod($executedAt);

        try {
            $details = $this->youTubeVideoApiRepository->fetchVideoDetails($youtubeVideoIds);
        } catch (Throwable) {
            return new DanceShortVideoSyncResultDTO(
                executedAt: $executedAt,
                failedCount: count($youtubeVideoIds),
            );
        }

        $insertedVideoCount = 0;
        $updatedVideoCount = 0;
        $savedSnapshotCount = 0;
        $skippedVideoCount = 0;
        $skippedSnapshotByTrackingCount = 0;
        $excludedByShortsCount = 0;
        $skippedPersistenceCount = 0;
        $failedCount = 0;

        foreach ($details as $detail) {
            if (! $this->eligibilityService->isShortsTarget($detail)) {
                $excludedByShortsCount++;
                continue;
            }

            if (! $this->eligibilityService->hasRequiredPersistenceFields($detail)) {
                $skippedPersistenceCount++;
                continue;
            }

            try {
                $saveResult = $this->videoRepository->upsert(
                    $this->videoSaveDTOFactory->fromYouTubeVideoDetail($detail),
                );

                match ($saveResult['status']) {
                    DanceShortVideoRepositoryInterface::UPSERT_INSERTED => $insertedVideoCount++,
                    DanceShortVideoRepositoryInterface::UPSERT_UPDATED => $updatedVideoCount++,
                    default => $skippedVideoCount++,
                };

                $video = $saveResult['video'];
                $videoId = (int) $video->getKey();
                $regionId = (int) $region->getKey();

                if ($this->videoRegionService->shouldSaveVideoRegion($videoId, $regionId)) {
                    $this->videoRegionRepository->upsert(new DanceShortVideoRegionSaveDTO(
                        video_id: $videoId,
                        region_id: $regionId,
                        detected_at: $collectedAt,
                    ));
                }

                if (! $this->trackingService->isSnapshotSaveTarget($video->tracking_status)) {
                    $skippedSnapshotByTrackingCount++;
                    continue;
                }

                $snapshotDTO = $this->snapshotCreateDTOFactory->fromYouTubeVideoDetail(
                    detail: $detail,
                    videoId: $videoId,
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

        return new DanceShortVideoSyncResultDTO(
            executedAt: $executedAt,
            fetchedVideoDetailCount: count($details),
            insertedVideoCount: $insertedVideoCount,
            updatedVideoCount: $updatedVideoCount,
            savedVideoCount: $insertedVideoCount + $updatedVideoCount,
            savedSnapshotCount: $savedSnapshotCount,
            skippedVideoCount: $skippedVideoCount,
            skippedSnapshotByTrackingCount: $skippedSnapshotByTrackingCount,
            excludedByShortsCount: $excludedByShortsCount,
            skippedPersistenceCount: $skippedPersistenceCount,
            failedCount: $failedCount,
        );
    }
}
