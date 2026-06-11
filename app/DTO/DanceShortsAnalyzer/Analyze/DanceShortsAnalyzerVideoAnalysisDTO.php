<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * Analyze 画面で選択動画を横比較するための 1 動画分の分析 DTO です。
 *
 * 複数 region の snapshot は合算せず、動画ごとに最新 snapshot を持つ
 * region の時系列だけを比較対象にします。
 */
final readonly class DanceShortsAnalyzerVideoAnalysisDTO
{
    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @param  array<int, DanceShortsAnalyzerSnapshotMetricDTO>  $metrics
     * @param  array<int, DanceShortsAnalyzerMetricSeriesDTO>  $metricSeries
     * @param  array<int, DanceShortsAnalyzerDeltaRowDTO>  $deltaRows
     * @param  array<int, DanceShortsAnalyzerPerHourRowDTO>  $perHourRows
     */
    public function __construct(
        public DanceShortsAnalyzerSelectedVideoDTO $video,
        public int $regionId,
        public string $regionCode,
        public string $regionName,
        public array $snapshots,
        public array $metrics,
        public array $metricSeries,
        public array $deltaRows,
        public array $perHourRows,
        public ?DanceShortsAnalyzerSnapshotPointDTO $latestSnapshot,
    ) {}
}
