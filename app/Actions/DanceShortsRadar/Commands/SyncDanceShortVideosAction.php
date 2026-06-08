<?php

namespace App\Actions\DanceShortsRadar\Commands;

use App\DTO\DanceShortsRadar\Sync\DanceShortVideoSyncResultDTO;
use App\Factories\DanceShortsRadar\DanceShortSearchConditionDTOFactory;
use App\Models\DanceShortRegion;
use App\Models\DanceShortSearchKeyword;
use App\Repositories\DanceShortsRadar\DanceShortSearchTargetRepositoryInterface;
use App\Repositories\DanceShortsRadar\YouTubeVideoApiRepositoryInterface;
use Carbon\CarbonImmutable;
use Throwable;

class SyncDanceShortVideosAction
{
    public function __construct(
        private readonly YouTubeVideoApiRepositoryInterface $youTubeVideoApiRepository,
        private readonly DanceShortSearchTargetRepositoryInterface $searchTargetRepository,
        private readonly PersistDanceShortVideoDetailsAction $persistVideoDetailsAction,
        private readonly CleanupDanceShortVideoSnapshotsAction $cleanupAction,
        private readonly DanceShortSearchConditionDTOFactory $searchConditionFactory,
    ) {
    }

    public function execute(): DanceShortVideoSyncResultDTO
    {
        /*
         * 通常同期は active region / active keyword の page1 だけを検索します。
         * 動画詳細取得後の保存判定と snapshot 保存は共通 Action に委譲し、page2 同期と
         * Shorts 判定・必須項目判定・動画本体保存・snapshot update/create の実装を共有します。
         */
        $executedAt = CarbonImmutable::now();
        $collectedAt = $executedAt->utc();
        $regions = $this->searchTargetRepository->activeRegions();

        $searchedKeywordCount = 0;
        $fetchedVideoCount = 0;
        $fetchedVideoDetailCount = 0;
        $insertedVideoCount = 0;
        $updatedVideoCount = 0;
        $savedVideoCount = 0;
        $savedSnapshotCount = 0;
        $skippedVideoCount = 0;
        $skippedSnapshotByTrackingCount = 0;
        $excludedByShortsCount = 0;
        $skippedPersistenceCount = 0;
        $failedCount = 0;

        foreach ($regions as $region) {
            $keywords = $this->searchTargetRepository->activeKeywordsForRegion($region);
            $searchedKeywordCount += $keywords->count();

            $youtubeVideoIds = $this->collectYoutubeVideoIds($region, $keywords, $executedAt, $failedCount);
            $fetchedVideoCount += count($youtubeVideoIds);

            $persistenceResult = $this->persistVideoDetailsAction->execute(
                region: $region,
                youtubeVideoIds: $youtubeVideoIds,
                executedAt: $executedAt,
                collectedAt: $collectedAt,
            );

            $fetchedVideoDetailCount += $persistenceResult->fetchedVideoDetailCount;
            $insertedVideoCount += $persistenceResult->insertedVideoCount;
            $updatedVideoCount += $persistenceResult->updatedVideoCount;
            $savedVideoCount += $persistenceResult->savedVideoCount;
            $savedSnapshotCount += $persistenceResult->savedSnapshotCount;
            $skippedVideoCount += $persistenceResult->skippedVideoCount;
            $skippedSnapshotByTrackingCount += $persistenceResult->skippedSnapshotByTrackingCount;
            $excludedByShortsCount += $persistenceResult->excludedByShortsCount;
            $skippedPersistenceCount += $persistenceResult->skippedPersistenceCount;
            $failedCount += $persistenceResult->failedCount;
        }

        $cleanupResult = $this->cleanupAction->execute($executedAt);

        return new DanceShortVideoSyncResultDTO(
            executedAt: $executedAt,
            searchedRegionCount: $regions->count(),
            searchedKeywordCount: $searchedKeywordCount,
            fetchedVideoCount: $fetchedVideoCount,
            fetchedVideoDetailCount: $fetchedVideoDetailCount,
            insertedVideoCount: $insertedVideoCount,
            updatedVideoCount: $updatedVideoCount,
            savedVideoCount: $savedVideoCount,
            savedSnapshotCount: $savedSnapshotCount,
            skippedVideoCount: $skippedVideoCount,
            skippedSnapshotByTrackingCount: $skippedSnapshotByTrackingCount,
            excludedByShortsCount: $excludedByShortsCount,
            skippedPersistenceCount: $skippedPersistenceCount,
            cleanedUpSnapshotCount: $cleanupResult->deletedSnapshotCount,
            failedCount: $failedCount,
        );
    }

    /**
     * @param  iterable<int, DanceShortSearchKeyword>  $keywords
     * @return array<int, string>
     */
    private function collectYoutubeVideoIds(
        DanceShortRegion $region,
        iterable $keywords,
        CarbonImmutable $executedAt,
        int &$failedCount,
    ): array {
        $youtubeVideoIds = [];

        foreach ($keywords as $keyword) {
            try {
                $items = $this->youTubeVideoApiRepository->searchVideos(
                    $this->searchConditionFactory->fromRegionAndKeyword($region, $keyword, $executedAt),
                );
            } catch (Throwable) {
                $failedCount++;
                continue;
            }

            foreach ($items as $item) {
                $youtubeVideoId = trim($item->youtubeVideoId);

                if ($youtubeVideoId !== '') {
                    $youtubeVideoIds[$youtubeVideoId] = $youtubeVideoId;
                }
            }
        }

        return array_values($youtubeVideoIds);
    }
}
