<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * DanceShortsAnalyzer Analyze 画面全体の Query Result DTO です。
 */
final readonly class DanceShortsAnalyzerAnalyzePageResultDTO
{
    /**
     * @param  array<int, DanceShortsAnalyzerSelectedVideoDTO>  $selectedVideos
     * @param  array<int, DanceShortsAnalyzerVideoAnalysisDTO>  $videoAnalyses
     * @param  array<string, array<int, DanceShortsAnalyzerVideoAnalysisDTO>>  $comparisonPeriodVideoAnalyses
     * @param  array<int, DanceShortsAnalyzerRegionAnalysisDTO>  $regionAnalyses
     */
    public function __construct(
        public array $selectedVideos,
        public ?int $activeVideoId,
        public ?DanceShortsAnalyzerSelectedVideoDTO $activeVideo,
        public array $videoAnalyses,
        public array $comparisonPeriodVideoAnalyses,
        public array $regionAnalyses,
        public ?int $activeRegionId,
    ) {}
}
