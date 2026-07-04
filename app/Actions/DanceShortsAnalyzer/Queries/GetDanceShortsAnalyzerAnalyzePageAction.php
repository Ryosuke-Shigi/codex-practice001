<?php

namespace App\Actions\DanceShortsAnalyzer\Queries;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzeInputDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzePageResultDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSelectedVideoDTO;
use App\Repositories\DanceShortsAnalyzer\DanceShortsAnalyzerVideoAnalysisRepositoryInterface;
use App\Services\DanceShortsAnalyzer\DanceShortsAnalyzerAnalyzePageService;

/**
 * DanceShortsAnalyzer PRODUCT Analyze 画面の Query Action です。
 *
 * 保存済み動画と snapshot を取得し、Analyze Page Service へ分析組み立てを委譲します。
 * YouTube API 呼び出し、新規同期、派生値の DB 保存は行いません。
 */
final class GetDanceShortsAnalyzerAnalyzePageAction
{
    public function __construct(
        private readonly DanceShortsAnalyzerVideoAnalysisRepositoryInterface $analysisRepository,
        private readonly DanceShortsAnalyzerAnalyzePageService $analyzePageService,
    ) {}

    /**
     * 保存済み動画と snapshot を読み、Analyze 画面用 ResultDTO を返します。
     */
    public function execute(DanceShortsAnalyzerAnalyzeInputDTO $input): DanceShortsAnalyzerAnalyzePageResultDTO
    {
        if ($input->videoIds === []) {
            return $this->analyzePageService->emptyResult();
        }

        $selectedVideos = $this->analysisRepository->findVideosByIds($input->videoIds);

        if ($selectedVideos === []) {
            return $this->analyzePageService->emptyResult();
        }

        $selectedVideoIds = array_map(
            fn (DanceShortsAnalyzerSelectedVideoDTO $video): int => $video->videoId,
            $selectedVideos,
        );
        $snapshots = $this->analysisRepository->findSnapshotsByVideoIds($selectedVideoIds);

        return $this->analyzePageService->buildResult(
            selectedVideos: $selectedVideos,
            snapshots: $snapshots,
            requestedActiveVideoId: $input->activeVideoId,
        );
    }
}
