<?php

namespace App\Actions\DanceShortsAnalyzer\Queries;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzeInputDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzePageResultDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerRegionAnalysisDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSelectedVideoDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerVideoAnalysisDTO;
use App\Repositories\DanceShortsAnalyzer\DanceShortsAnalyzerVideoAnalysisRepositoryInterface;
use App\Services\DanceShortsAnalyzer\DanceShortsAnalyzerSnapshotMetricService;

/**
 * DanceShortsAnalyzer PRODUCT Analyze 画面の Query Action です。
 *
 * 保存済み動画と snapshot を取得し、region ごとの分析単位へ分けます。
 * YouTube API 呼び出し、新規同期、派生値の DB 保存は行いません。
 */
final class GetDanceShortsAnalyzerAnalyzePageAction
{
    public function __construct(
        private readonly DanceShortsAnalyzerVideoAnalysisRepositoryInterface $analysisRepository,
        private readonly DanceShortsAnalyzerSnapshotMetricService $metricService,
    ) {}

    /**
     * 保存済み動画と snapshot を読み、MOCK 契約に合わせた横比較用 ResultDTO を返します。
     */
    public function execute(DanceShortsAnalyzerAnalyzeInputDTO $input): DanceShortsAnalyzerAnalyzePageResultDTO
    {
        if ($input->videoIds === []) {
            return $this->emptyResult();
        }

        $selectedVideos = $this->analysisRepository->findVideosByIds($input->videoIds);

        if ($selectedVideos === []) {
            return $this->emptyResult();
        }

        $selectedVideoIds = array_map(
            fn (DanceShortsAnalyzerSelectedVideoDTO $video): int => $video->videoId,
            $selectedVideos,
        );
        $snapshots = $this->analysisRepository->findSnapshotsByVideoIds($selectedVideoIds);
        $latestSnapshotsByVideoId = $this->latestSnapshotsByVideoId($snapshots);
        $selectedVideosWithLatestSnapshot = array_map(
            fn (DanceShortsAnalyzerSelectedVideoDTO $video): DanceShortsAnalyzerSelectedVideoDTO => new DanceShortsAnalyzerSelectedVideoDTO(
                videoId: $video->videoId,
                youtubeVideoId: $video->youtubeVideoId,
                title: $video->title,
                channelTitle: $video->channelTitle,
                thumbnailUrl: $video->thumbnailUrl,
                publishedAt: $video->publishedAt,
                trackingStatus: $video->trackingStatus,
                latestSnapshot: $latestSnapshotsByVideoId[$video->videoId] ?? null,
            ),
            $selectedVideos,
        );
        $activeVideoId = $this->resolveActiveVideoId($selectedVideoIds, $input->activeVideoId);
        $activeVideo = $this->findSelectedVideo($selectedVideosWithLatestSnapshot, $activeVideoId);

        // MOCK の Analyze は小サムネイル単位で選択動画を横比較するため、active 動画とは別に全選択動画の比較 DTO を作ります。
        $videoAnalyses = $this->buildVideoAnalyses($selectedVideosWithLatestSnapshot, $snapshots);
        $comparisonPeriodVideoAnalyses = $this->buildComparisonPeriodVideoAnalyses($videoAnalyses);
        $regionAnalyses = $this->buildRegionAnalyses(
            array_values(array_filter(
                $snapshots,
                fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): bool => $snapshot->videoId === $activeVideoId,
            )),
        );

        return new DanceShortsAnalyzerAnalyzePageResultDTO(
            selectedVideos: $selectedVideosWithLatestSnapshot,
            activeVideoId: $activeVideoId,
            activeVideo: $activeVideo,
            videoAnalyses: $videoAnalyses,
            comparisonPeriodVideoAnalyses: $comparisonPeriodVideoAnalyses,
            regionAnalyses: $regionAnalyses,
            activeRegionId: $this->resolveActiveRegionId($regionAnalyses),
        );
    }

    private function emptyResult(): DanceShortsAnalyzerAnalyzePageResultDTO
    {
        return new DanceShortsAnalyzerAnalyzePageResultDTO(
            selectedVideos: [],
            activeVideoId: null,
            activeVideo: null,
            videoAnalyses: [],
            comparisonPeriodVideoAnalyses: $this->emptyComparisonPeriodVideoAnalyses(),
            regionAnalyses: [],
            activeRegionId: null,
        );
    }

    /**
     * @param  array<int, int>  $selectedVideoIds
     */
    private function resolveActiveVideoId(array $selectedVideoIds, ?int $requestedActiveVideoId): int
    {
        if ($requestedActiveVideoId !== null && in_array($requestedActiveVideoId, $selectedVideoIds, true)) {
            return $requestedActiveVideoId;
        }

        return $selectedVideoIds[0];
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSelectedVideoDTO>  $selectedVideos
     */
    private function findSelectedVideo(array $selectedVideos, int $activeVideoId): ?DanceShortsAnalyzerSelectedVideoDTO
    {
        foreach ($selectedVideos as $video) {
            if ($video->videoId === $activeVideoId) {
                return $video;
            }
        }

        return null;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, DanceShortsAnalyzerSnapshotPointDTO>
     */
    private function latestSnapshotsByVideoId(array $snapshots): array
    {
        $latestSnapshots = [];

        foreach ($snapshots as $snapshot) {
            $currentLatestSnapshot = $latestSnapshots[$snapshot->videoId] ?? null;

            if (! $currentLatestSnapshot instanceof DanceShortsAnalyzerSnapshotPointDTO
                || $this->isNewerSnapshot($snapshot, $currentLatestSnapshot)) {
                $latestSnapshots[$snapshot->videoId] = $snapshot;
            }
        }

        return $latestSnapshots;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSelectedVideoDTO>  $selectedVideos
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, DanceShortsAnalyzerVideoAnalysisDTO>
     */
    private function buildVideoAnalyses(array $selectedVideos, array $snapshots): array
    {
        $snapshotsByVideoId = [];

        foreach ($snapshots as $snapshot) {
            $snapshotsByVideoId[$snapshot->videoId][] = $snapshot;
        }

        $videoAnalyses = [];

        foreach ($selectedVideos as $video) {
            $videoSnapshots = $snapshotsByVideoId[$video->videoId] ?? [];
            $comparisonSnapshots = $this->latestRegionSnapshots($videoSnapshots);

            if ($comparisonSnapshots === []) {
                continue;
            }

            $metrics = $this->metricService->calculate($comparisonSnapshots);
            $firstSnapshot = $comparisonSnapshots[0];

            $videoAnalyses[] = new DanceShortsAnalyzerVideoAnalysisDTO(
                video: $video,
                regionId: $firstSnapshot->regionId,
                regionCode: $firstSnapshot->regionCode,
                regionName: $firstSnapshot->regionName,
                snapshots: $comparisonSnapshots,
                metrics: $metrics,
                metricSeries: $this->metricService->metricSeries($comparisonSnapshots),
                deltaRows: $this->metricService->deltaRows($metrics),
                perHourRows: $this->metricService->perHourRows($metrics),
                latestSnapshot: $this->latestSnapshot($comparisonSnapshots),
            );
        }

        return $videoAnalyses;
    }

    /**
     * @return array<string, array<int, DanceShortsAnalyzerVideoAnalysisDTO>>
     */
    private function emptyComparisonPeriodVideoAnalyses(): array
    {
        $periodAnalyses = [];

        foreach ($this->metricService->comparisonPeriodKeys() as $periodKey) {
            $periodAnalyses[$periodKey] = [];
        }

        return $periodAnalyses;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerVideoAnalysisDTO>  $videoAnalyses
     * @return array<string, array<int, DanceShortsAnalyzerVideoAnalysisDTO>>
     */
    private function buildComparisonPeriodVideoAnalyses(array $videoAnalyses): array
    {
        $latestSnapshot = $this->latestVideoAnalysisSnapshot($videoAnalyses);
        $periodAnalyses = [];

        foreach ($this->metricService->comparisonPeriodKeys() as $periodKey) {
            if ($latestSnapshot === null) {
                $periodAnalyses[$periodKey] = [];

                continue;
            }

            $periodAnalyses[$periodKey] = array_map(
                fn (DanceShortsAnalyzerVideoAnalysisDTO $analysis): DanceShortsAnalyzerVideoAnalysisDTO => $this->rebuildVideoAnalysis(
                    $analysis,
                    $this->metricService->filterSnapshotsForPeriod(
                        $analysis->snapshots,
                        $periodKey,
                        $latestSnapshot->collectedAt,
                    ),
                ),
                $videoAnalyses,
            );
        }

        return $periodAnalyses;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     */
    private function rebuildVideoAnalysis(
        DanceShortsAnalyzerVideoAnalysisDTO $baseAnalysis,
        array $snapshots,
    ): DanceShortsAnalyzerVideoAnalysisDTO {
        $metrics = $this->metricService->calculate($snapshots);

        return new DanceShortsAnalyzerVideoAnalysisDTO(
            video: $baseAnalysis->video,
            regionId: $baseAnalysis->regionId,
            regionCode: $baseAnalysis->regionCode,
            regionName: $baseAnalysis->regionName,
            snapshots: $snapshots,
            metrics: $metrics,
            metricSeries: $this->metricService->metricSeries($snapshots),
            deltaRows: $this->metricService->deltaRows($metrics),
            perHourRows: $this->metricService->perHourRows($metrics),
            latestSnapshot: $this->latestSnapshot($snapshots),
        );
    }

    /**
     * @param  array<int, DanceShortsAnalyzerVideoAnalysisDTO>  $videoAnalyses
     */
    private function latestVideoAnalysisSnapshot(array $videoAnalyses): ?DanceShortsAnalyzerSnapshotPointDTO
    {
        $latestSnapshot = null;

        foreach ($videoAnalyses as $analysis) {
            if ($analysis->latestSnapshot === null) {
                continue;
            }

            if ($latestSnapshot === null || $this->isNewerSnapshot($analysis->latestSnapshot, $latestSnapshot)) {
                $latestSnapshot = $analysis->latestSnapshot;
            }
        }

        return $latestSnapshot;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, DanceShortsAnalyzerSnapshotPointDTO>
     */
    private function latestRegionSnapshots(array $snapshots): array
    {
        // region を合算せず、動画ごとに最新 snapshot を持つ region の時系列だけを比較対象にします。
        $snapshotsByRegionId = [];

        foreach ($snapshots as $snapshot) {
            $snapshotsByRegionId[$snapshot->regionId][] = $snapshot;
        }

        $latestRegionId = null;
        $latestSnapshot = null;

        foreach ($snapshotsByRegionId as $regionId => $regionSnapshots) {
            $regionLatestSnapshot = $this->latestSnapshot($regionSnapshots);

            if ($regionLatestSnapshot === null) {
                continue;
            }

            if ($latestSnapshot === null || $this->isNewerSnapshot($regionLatestSnapshot, $latestSnapshot)) {
                $latestRegionId = $regionId;
                $latestSnapshot = $regionLatestSnapshot;
            }
        }

        if ($latestRegionId === null) {
            return [];
        }

        return $snapshotsByRegionId[$latestRegionId];
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, DanceShortsAnalyzerRegionAnalysisDTO>
     */
    private function buildRegionAnalyses(array $snapshots): array
    {
        $snapshotsByRegionId = [];

        foreach ($snapshots as $snapshot) {
            $snapshotsByRegionId[$snapshot->regionId][] = $snapshot;
        }

        $regionAnalyses = [];

        foreach ($snapshotsByRegionId as $regionSnapshots) {
            $metrics = $this->metricService->calculate($regionSnapshots);
            $firstSnapshot = $regionSnapshots[0];

            $regionAnalyses[] = new DanceShortsAnalyzerRegionAnalysisDTO(
                regionId: $firstSnapshot->regionId,
                regionCode: $firstSnapshot->regionCode,
                regionName: $firstSnapshot->regionName,
                snapshots: $regionSnapshots,
                metrics: $metrics,
                metricSeries: $this->metricService->metricSeries($regionSnapshots),
                deltaRows: $this->metricService->deltaRows($metrics),
                perHourRows: $this->metricService->perHourRows($metrics),
                latestSnapshot: $this->latestSnapshot($regionSnapshots),
            );
        }

        return $regionAnalyses;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerRegionAnalysisDTO>  $regionAnalyses
     */
    private function resolveActiveRegionId(array $regionAnalyses): ?int
    {
        $activeRegion = null;

        foreach ($regionAnalyses as $regionAnalysis) {
            if ($regionAnalysis->latestSnapshot === null) {
                continue;
            }

            if ($activeRegion === null
                || $this->isNewerSnapshot($regionAnalysis->latestSnapshot, $activeRegion->latestSnapshot)) {
                $activeRegion = $regionAnalysis;
            }
        }

        return $activeRegion?->regionId;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     */
    private function latestSnapshot(array $snapshots): ?DanceShortsAnalyzerSnapshotPointDTO
    {
        $latestSnapshot = null;

        foreach ($snapshots as $snapshot) {
            if ($latestSnapshot === null || $this->isNewerSnapshot($snapshot, $latestSnapshot)) {
                $latestSnapshot = $snapshot;
            }
        }

        return $latestSnapshot;
    }

    private function isNewerSnapshot(
        DanceShortsAnalyzerSnapshotPointDTO $candidate,
        DanceShortsAnalyzerSnapshotPointDTO $current,
    ): bool {
        $candidateTimestamp = $candidate->collectedAt->getTimestamp();
        $currentTimestamp = $current->collectedAt->getTimestamp();

        if ($candidateTimestamp !== $currentTimestamp) {
            return $candidateTimestamp > $currentTimestamp;
        }

        return $candidate->snapshotId > $current->snapshotId;
    }
}
