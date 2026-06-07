<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Factories\DanceShortsRadar\DanceShortVideoSaveDTOFactory;
use App\Factories\DanceShortsRadar\DanceShortVideoSnapshotCreateDTOFactory;
use App\Models\DanceShortRegion;
use App\Repositories\DanceShortsRadar\DanceShortVideoRepositoryInterface;
use App\Repositories\DanceShortsRadar\DanceShortVideoSnapshotRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use App\Services\DanceShortsRadar\DanceShortSnapshotMetricService;
use App\Services\DanceShortsRadar\DanceShortVideoEligibilityService;
use App\Services\DanceShortsRadar\DanceShortVideoTrackingService;
use Carbon\CarbonInterface;
use Throwable;

class PersistDanceShortVideoDetailsAction
{
    public function __construct(
        private readonly YouTubeVideoApiRepositoryInterface $youTubeVideoApiRepository,
        private readonly DanceShortVideoRepositoryInterface $videoRepository,
        private readonly DanceShortVideoSnapshotRepositoryInterface $snapshotRepository,
        private readonly DanceShortVideoEligibilityService $eligibilityService,
        private readonly DanceShortSnapshotMetricService $snapshotMetricService,
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

                if (! $this->trackingService->isSnapshotSaveTarget($video->tracking_status)) {
                    $skippedSnapshotByTrackingCount++;
                    continue;
                }

                $previousSnapshot = $this->snapshotRepository->latestForVideoAndRegion(
                    (int) $video->getKey(),
                    (int) $region->getKey(),
                );
                $snapshotDTO = $this->snapshotCreateDTOFactory->fromYouTubeVideoDetail(
                    detail: $detail,
                    videoId: (int) $video->getKey(),
                    regionId: (int) $region->getKey(),
                    collectedAt: $collectedAt,
                );

                if ($previousSnapshot !== null) {
                    $this->snapshotMetricService->calculateSnapshotMetrics(
                        previousViewCount: $previousSnapshot->view_count,
                        previousCollectedAt: $previousSnapshot->collected_at,
                        currentViewCount: $snapshotDTO->view_count,
                        currentCollectedAt: $snapshotDTO->collected_at,
                    );
                }

                $this->snapshotRepository->create($snapshotDTO);
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
