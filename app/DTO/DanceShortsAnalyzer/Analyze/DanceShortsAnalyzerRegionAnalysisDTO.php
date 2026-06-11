<?php

namespace App\DTO\DanceShortsAnalyzer\Analyze;

/**
 * 1 動画・1 region ごとの分析データをまとめる DTO です。
 *
 * 複数 region の snapshot は合算せず、この DTO 単位で分けて画面へ渡します。
 */
final readonly class DanceShortsAnalyzerRegionAnalysisDTO
{
    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @param  array<int, DanceShortsAnalyzerSnapshotMetricDTO>  $metrics
     * @param  array<int, DanceShortsAnalyzerMetricSeriesDTO>  $metricSeries
     * @param  array<int, DanceShortsAnalyzerDeltaRowDTO>  $deltaRows
     * @param  array<int, DanceShortsAnalyzerPerHourRowDTO>  $perHourRows
     */
    public function __construct(
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
