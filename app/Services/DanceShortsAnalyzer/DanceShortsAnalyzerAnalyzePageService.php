<?php

namespace App\Services\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzePageResultDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerRegionAnalysisDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSelectedVideoDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerVideoAnalysisDTO;

/**
 * DanceShortsAnalyzer Analyze 画面用の分析組み立て Service です。
 *
 * Repository が取得した保存済み動画と snapshot DTO から、latest snapshot、
 * active video / region、region別分析、comparison period 分析を組み立てます。
 * DB 取得、HTTP Response生成、Inertia props整形は扱いません。
 */
final readonly class DanceShortsAnalyzerAnalyzePageService
{
    public function __construct(
        private DanceShortsAnalyzerSnapshotMetricService $metricService,
    ) {}

    public function emptyResult(): DanceShortsAnalyzerAnalyzePageResultDTO
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
     * @param  array<int, DanceShortsAnalyzerSelectedVideoDTO>  $selectedVideos
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     */
    public function buildResult(
        array $selectedVideos,
        array $snapshots,
        ?int $requestedActiveVideoId,
    ): DanceShortsAnalyzerAnalyzePageResultDTO {
        if ($selectedVideos === []) {
            return $this->emptyResult();
        }

        $selectedVideoIds = array_map(
            fn (DanceShortsAnalyzerSelectedVideoDTO $video): int => $video->videoId,
            $selectedVideos,
        );
        $selectedVideosWithLatestSnapshot = $this->selectedVideosWithLatestSnapshot(
            selectedVideos: $selectedVideos,
            latestSnapshotsByVideoId: $this->latestSnapshotsByVideoId($snapshots),
        );
        $activeVideoId = $this->resolveActiveVideoId($selectedVideoIds, $requestedActiveVideoId);
        $activeVideo = $this->findSelectedVideo($selectedVideosWithLatestSnapshot, $activeVideoId);
        $videoAnalyses = $this->buildVideoAnalyses($selectedVideosWithLatestSnapshot, $snapshots);
        $regionAnalyses = $this->buildRegionAnalyses($this->snapshotsForVideo($snapshots, $activeVideoId));

        return new DanceShortsAnalyzerAnalyzePageResultDTO(
            selectedVideos: $selectedVideosWithLatestSnapshot,
            activeVideoId: $activeVideoId,
            activeVideo: $activeVideo,
            videoAnalyses: $videoAnalyses,
            comparisonPeriodVideoAnalyses: $this->buildComparisonPeriodVideoAnalyses($videoAnalyses),
            regionAnalyses: $regionAnalyses,
            activeRegionId: $this->resolveActiveRegionId($regionAnalyses),
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
     * @param  array<int, DanceShortsAnalyzerSelectedVideoDTO>  $selectedVideos
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $latestSnapshotsByVideoId
     * @return array<int, DanceShortsAnalyzerSelectedVideoDTO>
     */
    private function selectedVideosWithLatestSnapshot(array $selectedVideos, array $latestSnapshotsByVideoId): array
    {
        return array_map(
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

            $videoAnalyses[] = $this->buildVideoAnalysis($video, $comparisonSnapshots);
        }

        return $videoAnalyses;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     */
    private function buildVideoAnalysis(
        DanceShortsAnalyzerSelectedVideoDTO $video,
        array $snapshots,
    ): DanceShortsAnalyzerVideoAnalysisDTO {
        $metrics = $this->metricService->calculate($snapshots);
        $firstSnapshot = $snapshots[0];

        return new DanceShortsAnalyzerVideoAnalysisDTO(
            video: $video,
            regionId: $firstSnapshot->regionId,
            regionCode: $firstSnapshot->regionCode,
            regionName: $firstSnapshot->regionName,
            snapshots: $snapshots,
            metrics: $metrics,
            metricSeries: $this->metricService->metricSeries($snapshots),
            deltaRows: $this->metricService->deltaRows($metrics),
            perHourRows: $this->metricService->perHourRows($metrics),
            latestSnapshot: $this->latestSnapshot($snapshots),
        );
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
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, DanceShortsAnalyzerSnapshotPointDTO>
     */
    private function snapshotsForVideo(array $snapshots, int $videoId): array
    {
        return array_values(array_filter(
            $snapshots,
            fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): bool => $snapshot->videoId === $videoId,
        ));
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
