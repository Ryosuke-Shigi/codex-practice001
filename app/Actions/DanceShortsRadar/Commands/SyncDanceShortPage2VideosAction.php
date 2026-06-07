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

class SyncDanceShortPage2VideosAction
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
         * page2 同期は expanded かつ max_search_pages >= 2 の keyword だけを検索します。
         * page1 は nextPageToken を得るために読むだけで、保存候補IDとしては page2 以降だけを集めます。
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
            $keywords = $this->searchTargetRepository->activeExpandedKeywordsForRegion($region);
            $searchedKeywordCount += $keywords->count();

            $youtubeVideoIds = $this->collectPage2AndLaterYoutubeVideoIds(
                region: $region,
                keywords: $keywords,
                executedAt: $executedAt,
                failedCount: $failedCount,
            );
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
    private function collectPage2AndLaterYoutubeVideoIds(
        DanceShortRegion $region,
        iterable $keywords,
        CarbonImmutable $executedAt,
        int &$failedCount,
    ): array {
        $youtubeVideoIds = [];

        foreach ($keywords as $keyword) {
            $condition = $this->searchConditionFactory->fromRegionAndKeyword($region, $keyword, $executedAt);

            try {
                $currentPage = $this->youTubeVideoApiRepository->searchVideoPage($condition);
            } catch (Throwable) {
                $failedCount++;
                continue;
            }

            $nextPageToken = $currentPage->nextPageToken;
            $maxSearchPages = max(1, (int) $keyword->max_search_pages);

            for ($pageNumber = 2; $pageNumber <= $maxSearchPages; $pageNumber++) {
                $nextPageToken = is_string($nextPageToken) ? trim($nextPageToken) : '';

                if ($nextPageToken === '') {
                    break;
                }

                try {
                    $currentPage = $this->youTubeVideoApiRepository->searchVideoPage($condition, $nextPageToken);
                } catch (Throwable) {
                    $failedCount++;
                    break;
                }

                foreach ($currentPage->items as $item) {
                    $youtubeVideoId = trim($item->youtubeVideoId);

                    if ($youtubeVideoId !== '') {
                        $youtubeVideoIds[$youtubeVideoId] = $youtubeVideoId;
                    }
                }

                $nextPageToken = $currentPage->nextPageToken;
            }
        }

        return array_values($youtubeVideoIds);
    }
}
