<?php

namespace App\Services\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerDeltaRowDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerMetricSeriesDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerPerHourRowDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotMetricDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;

/**
 * DanceShortsAnalyzer の snapshot 差分計算 Service です。
 *
 * DB 取得や Inertia props 整形は扱わず、snapshot の時系列 DTO から
 * delta と 1 時間あたり増加量を計算する責務だけを持ちます。
 */
final class DanceShortsAnalyzerSnapshotMetricService
{
    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, DanceShortsAnalyzerSnapshotMetricDTO>
     */
    public function calculate(array $snapshots): array
    {
        $metrics = [];
        $previousSnapshot = null;

        foreach ($snapshots as $snapshot) {
            $hours = $this->hoursBetween($previousSnapshot, $snapshot);
            $viewDelta = $this->intDelta($previousSnapshot?->viewCount, $snapshot->viewCount);
            $likeDelta = $this->intDelta($previousSnapshot?->likeCount, $snapshot->likeCount);
            $commentDelta = $this->intDelta($previousSnapshot?->commentCount, $snapshot->commentCount);

            $metrics[] = new DanceShortsAnalyzerSnapshotMetricDTO(
                snapshot: $snapshot,
                previousSnapshot: $previousSnapshot,
                hours: $hours,
                viewDelta: $viewDelta,
                likeDelta: $likeDelta,
                commentDelta: $commentDelta,
                viewPerHour: $this->perHour($viewDelta, $hours),
                likePerHour: $this->perHour($likeDelta, $hours),
                commentPerHour: $this->perHour($commentDelta, $hours),
            );

            $previousSnapshot = $snapshot;
        }

        return $metrics;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotMetricDTO>  $metrics
     * @return array<int, DanceShortsAnalyzerDeltaRowDTO>
     */
    public function deltaRows(array $metrics): array
    {
        return array_map(
            fn (DanceShortsAnalyzerSnapshotMetricDTO $metric): DanceShortsAnalyzerDeltaRowDTO => new DanceShortsAnalyzerDeltaRowDTO(
                snapshot: $metric->snapshot,
                previousSnapshot: $metric->previousSnapshot,
                viewDelta: $metric->viewDelta,
                likeDelta: $metric->likeDelta,
                commentDelta: $metric->commentDelta,
            ),
            $metrics,
        );
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotMetricDTO>  $metrics
     * @return array<int, DanceShortsAnalyzerPerHourRowDTO>
     */
    public function perHourRows(array $metrics): array
    {
        return array_map(
            fn (DanceShortsAnalyzerSnapshotMetricDTO $metric): DanceShortsAnalyzerPerHourRowDTO => new DanceShortsAnalyzerPerHourRowDTO(
                snapshot: $metric->snapshot,
                previousSnapshot: $metric->previousSnapshot,
                hours: $metric->hours,
                viewPerHour: $metric->viewPerHour,
                likePerHour: $metric->likePerHour,
                commentPerHour: $metric->commentPerHour,
            ),
            $metrics,
        );
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotPointDTO>  $snapshots
     * @return array<int, DanceShortsAnalyzerMetricSeriesDTO>
     */
    public function metricSeries(array $snapshots): array
    {
        return [
            new DanceShortsAnalyzerMetricSeriesDTO(
                metricKey: 'view_count',
                label: 'View推移',
                values: array_map(
                    fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): int => $snapshot->viewCount,
                    $snapshots,
                ),
            ),
            new DanceShortsAnalyzerMetricSeriesDTO(
                metricKey: 'like_count',
                label: 'Like推移',
                values: array_map(
                    fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): ?int => $snapshot->likeCount,
                    $snapshots,
                ),
            ),
            new DanceShortsAnalyzerMetricSeriesDTO(
                metricKey: 'comment_count',
                label: 'Comment推移',
                values: array_map(
                    fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): ?int => $snapshot->commentCount,
                    $snapshots,
                ),
            ),
        ];
    }

    private function hoursBetween(
        ?DanceShortsAnalyzerSnapshotPointDTO $previousSnapshot,
        DanceShortsAnalyzerSnapshotPointDTO $snapshot,
    ): ?float {
        if ($previousSnapshot === null) {
            return null;
        }

        return ($snapshot->collectedAt->getTimestamp() - $previousSnapshot->collectedAt->getTimestamp()) / 3600;
    }

    private function intDelta(?int $previousValue, ?int $currentValue): ?int
    {
        if ($previousValue === null || $currentValue === null) {
            return null;
        }

        return $currentValue - $previousValue;
    }

    private function perHour(?int $delta, ?float $hours): ?float
    {
        if ($delta === null || $hours === null || $hours <= 0) {
            return null;
        }

        return $delta / $hours;
    }
}
