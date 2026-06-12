<?php

namespace App\Responders\DanceShortsAnalyzer;

use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerAnalyzePageResultDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerDeltaRowDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerMetricSeriesDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerPerHourRowDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerRegionAnalysisDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSelectedVideoDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotMetricDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerSnapshotPointDTO;
use App\DTO\DanceShortsAnalyzer\Analyze\DanceShortsAnalyzerVideoAnalysisDTO;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DanceShortsAnalyzer Analyze 画面の Responder です。
 *
 * YouTube URL、EChartsOption、表用配列、empty / no snapshot 文言をここで生成し、
 * React 側は props の表示に限定します。
 */
final readonly class DanceShortsAnalyzerAnalyzeResponder
{
    public function index(DanceShortsAnalyzerAnalyzePageResultDTO $result): Response
    {
        return Inertia::render('DanceShortsAnalyzer/Analyze', [
            'analyzeField' => $this->analyzeFieldProps($result),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function analyzeFieldProps(DanceShortsAnalyzerAnalyzePageResultDTO $result): array
    {
        return [
            'search_url' => route('dance-shorts-analyzer.index', [], false),
            'empty_message' => $result->selectedVideos === []
                ? '分析する動画を選択してください。'
                : null,
            'no_snapshot_message' => $result->selectedVideos !== [] && $result->videoAnalyses === []
                ? 'この動画には保存済みsnapshotがありません。'
                : null,
            'active_video_id' => $result->activeVideoId,
            'active_region_id' => $result->activeRegionId,
            'selected_videos' => $this->selectedVideosProps($result),
            'active_video' => $result->activeVideo === null
                ? null
                : $this->selectedVideoProps($result->activeVideo, $result),
            'regions' => array_map(
                fn (DanceShortsAnalyzerRegionAnalysisDTO $regionAnalysis): array => $this->regionAnalysisProps($regionAnalysis, $result),
                $result->regionAnalyses,
            ),
            // MOCK の Field 構成に合わせ、React 側が再計算しない形で chart / table props をまとめます。
            'comparison' => $this->comparisonProps($result),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function selectedVideosProps(DanceShortsAnalyzerAnalyzePageResultDTO $result): array
    {
        return array_map(
            fn (DanceShortsAnalyzerSelectedVideoDTO $video): array => $this->selectedVideoProps($video, $result),
            $result->selectedVideos,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function selectedVideoProps(
        DanceShortsAnalyzerSelectedVideoDTO $video,
        DanceShortsAnalyzerAnalyzePageResultDTO $result,
    ): array {
        return [
            'video_id' => $video->videoId,
            'youtube_video_id' => $video->youtubeVideoId,
            'title' => $video->title,
            'channel_title' => $video->channelTitle,
            'thumbnail_url' => $video->thumbnailUrl,
            'published_at' => $video->publishedAt?->format('Y-m-d H:i'),
            'youtube_url' => 'https://www.youtube.com/shorts/'.$video->youtubeVideoId,
            'tracking_status' => $video->trackingStatus,
            'is_active' => $video->videoId === $result->activeVideoId,
            'active_url' => $this->analyzeUrl($result, $video->videoId),
            'chart_color' => $this->chartColorForVideo($result, $video->videoId),
            'latest_snapshot' => $video->latestSnapshot === null
                ? null
                : $this->snapshotProps($video->latestSnapshot),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function comparisonProps(DanceShortsAnalyzerAnalyzePageResultDTO $result): array
    {
        $periods = [];

        foreach ($this->comparisonPeriodDefinitions() as $periodKey => $periodDefinition) {
            $videoAnalyses = $result->comparisonPeriodVideoAnalyses[$periodKey] ?? [];
            $periods[$periodKey] = [
                'label' => $periodDefinition['label'],
                'charts' => $this->comparisonChartProps($videoAnalyses, $periodKey),
                'tables' => [
                    'delta' => $this->comparisonMetricTables($result, $videoAnalyses, 'delta'),
                    'per_hour' => $this->comparisonMetricTables($result, $videoAnalyses, 'per_hour'),
                ],
            ];
        }

        return [
            'periods' => $periods,
        ];
    }

    /**
     * @param  array<int, DanceShortsAnalyzerVideoAnalysisDTO>  $videoAnalyses
     * @return array<string, array<string, mixed>>
     */
    private function comparisonChartProps(array $videoAnalyses, string $periodKey): array
    {
        $charts = [];

        foreach ($this->metricDefinitions() as $metricKey => $metricDefinition) {
            $charts[$metricKey] = [
                'title' => $metricDefinition['chart_label'],
                'option' => $this->comparisonChartOption(
                    $videoAnalyses,
                    $metricKey,
                    $metricDefinition['chart_label'],
                    $periodKey,
                ),
            ];
        }

        return $charts;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerVideoAnalysisDTO>  $videoAnalyses
     * @return array<string, mixed>
     */
    private function comparisonChartOption(
        array $videoAnalyses,
        string $metricKey,
        string $metricLabel,
        string $periodKey,
    ): array {
        $axisSnapshots = $this->comparisonChartAxisSnapshots($videoAnalyses);
        $axisTimestamps = array_keys($axisSnapshots);
        $labels = array_map(
            fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): string => $this->comparisonChartAxisLabel($snapshot, $periodKey),
            array_values($axisSnapshots),
        );
        $series = array_map(
            fn (DanceShortsAnalyzerVideoAnalysisDTO $analysis): array => [
                'name' => $analysis->video->title,
                'type' => 'line',
                'smooth' => true,
                'symbolSize' => 7,
                'lineStyle' => [
                    'width' => 3,
                ],
                'data' => $this->comparisonChartValues($analysis, $metricKey, $axisTimestamps),
            ],
            $videoAnalyses,
        );

        return [
            'backgroundColor' => 'transparent',
            'color' => $this->chartColors(),
            'tooltip' => [
                'trigger' => 'axis',
                'confine' => true,
                'backgroundColor' => 'rgba(15, 23, 42, 0.94)',
                'borderColor' => 'rgba(96, 165, 250, 0.32)',
                'textStyle' => [
                    'color' => '#f8fafc',
                ],
            ],
            'legend' => [
                'show' => false,
            ],
            'grid' => [
                'left' => 8,
                'right' => 8,
                'top' => 4,
                'bottom' => $this->comparisonChartGridBottom($periodKey),
                'containLabel' => true,
            ],
            'xAxis' => [
                'type' => 'category',
                'boundaryGap' => true,
                'data' => $labels,
                'axisLabel' => $this->comparisonChartAxisLabelProps($periodKey),
                'axisTick' => [
                    'show' => true,
                ],
                'axisLine' => [
                    'show' => true,
                    'lineStyle' => [
                        'color' => 'rgba(191, 219, 254, 0.28)',
                    ],
                ],
            ],
            'yAxis' => [
                'type' => 'value',
                'axisLabel' => [
                    'color' => '#bfdbfe',
                    'fontSize' => 10,
                    'formatter' => '{value}',
                ],
                'splitLine' => [
                    'lineStyle' => [
                        'color' => 'rgba(191, 219, 254, 0.14)',
                    ],
                ],
            ],
            'series' => $series,
        ];
    }

    /**
     * @param  array<int, DanceShortsAnalyzerVideoAnalysisDTO>  $videoAnalyses
     * @return array<int, DanceShortsAnalyzerSnapshotPointDTO>
     */
    private function comparisonChartAxisSnapshots(array $videoAnalyses): array
    {
        $axisSnapshots = [];

        foreach ($videoAnalyses as $analysis) {
            foreach ($analysis->snapshots as $snapshot) {
                $timestamp = $snapshot->collectedAt->getTimestamp();
                $axisSnapshots[$timestamp] ??= $snapshot;
            }
        }

        ksort($axisSnapshots, SORT_NUMERIC);

        return $axisSnapshots;
    }

    /**
     * @return array<int, int|null>
     */
    private function comparisonChartValues(
        DanceShortsAnalyzerVideoAnalysisDTO $analysis,
        string $metricKey,
        array $axisTimestamps,
    ): array {
        $snapshotsByTimestamp = [];

        foreach ($analysis->snapshots as $snapshot) {
            $snapshotsByTimestamp[$snapshot->collectedAt->getTimestamp()] = $snapshot;
        }

        return array_map(
            fn (int $timestamp): ?int => $this->snapshotMetricValue($snapshotsByTimestamp[$timestamp] ?? null, $metricKey),
            $axisTimestamps,
        );
    }

    private function snapshotMetricValue(?DanceShortsAnalyzerSnapshotPointDTO $snapshot, string $metricKey): ?int
    {
        if ($snapshot === null) {
            return null;
        }

        return match ($metricKey) {
            'view_count' => $snapshot->viewCount,
            'like_count' => $snapshot->likeCount,
            'comment_count' => $snapshot->commentCount,
            default => null,
        };
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function comparisonMetricTables(
        DanceShortsAnalyzerAnalyzePageResultDTO $result,
        array $videoAnalyses,
        string $tableType,
    ): array {
        $tables = [];

        foreach ($this->metricDefinitions() as $metricKey => $metricDefinition) {
            $tables[$metricKey] = [
                'columns' => array_map(
                    fn (DanceShortsAnalyzerSelectedVideoDTO $video): array => [
                        'video_id' => $video->videoId,
                        'title' => $video->title,
                    ],
                    $result->selectedVideos,
                ),
                'rows' => $this->comparisonMetricRows(
                    $result->selectedVideos,
                    $videoAnalyses,
                    $metricKey,
                    $tableType,
                ),
                'metric_label' => $metricDefinition['tab_label'],
            ];
        }

        return $tables;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSelectedVideoDTO>  $selectedVideos
     * @param  array<int, DanceShortsAnalyzerVideoAnalysisDTO>  $videoAnalyses
     * @return array<int, array<string, mixed>>
     */
    private function comparisonMetricRows(
        array $selectedVideos,
        array $videoAnalyses,
        string $metricKey,
        string $tableType,
    ): array {
        $rowEntries = [];

        foreach ($videoAnalyses as $analysis) {
            $analysisRows = $tableType === 'per_hour'
                ? $analysis->perHourRows
                : $analysis->deltaRows;

            foreach ($analysisRows as $row) {
                $timestamp = $row->snapshot->collectedAt->getTimestamp();
                $rowEntries[$timestamp]['row'] ??= $row;
                $rowEntries[$timestamp]['rowsByVideoId'][$analysis->video->videoId] = $row;
            }
        }

        ksort($rowEntries, SORT_NUMERIC);

        $rows = [];

        foreach ($rowEntries as $timestamp => $rowEntry) {
            $rowsByVideoId = $rowEntry['rowsByVideoId'] ?? [];

            if (! $this->comparisonRowHasMetricValue($rowsByVideoId, $metricKey, $tableType)) {
                continue;
            }

            $periodLabelRow = $rowEntry['row'];

            $rows[] = [
                'row_id' => $timestamp,
                'period_label' => $this->periodLabel($periodLabelRow->previousSnapshot, $periodLabelRow->snapshot),
                'cells' => array_map(
                    fn (DanceShortsAnalyzerSelectedVideoDTO $video): array => [
                        'video_id' => $video->videoId,
                        'value_label' => $this->comparisonMetricCellLabel(
                            $rowsByVideoId[$video->videoId] ?? null,
                            $metricKey,
                            $tableType,
                        ),
                    ],
                    $selectedVideos,
                ),
            ];
        }

        return $rows;
    }

    /**
     * @param  array<int, DanceShortsAnalyzerDeltaRowDTO|DanceShortsAnalyzerPerHourRowDTO>  $rowsByVideoId
     */
    private function comparisonRowHasMetricValue(array $rowsByVideoId, string $metricKey, string $tableType): bool
    {
        foreach ($rowsByVideoId as $row) {
            if ($this->comparisonMetricValue($row, $metricKey, $tableType) !== null) {
                return true;
            }
        }

        return false;
    }

    private function comparisonMetricCellLabel(
        DanceShortsAnalyzerDeltaRowDTO|DanceShortsAnalyzerPerHourRowDTO|null $row,
        string $metricKey,
        string $tableType,
    ): string {
        if ($tableType === 'per_hour') {
            $value = $this->comparisonMetricValue($row, $metricKey, $tableType);

            return $value === null ? '-' : $this->formatPerHour($value);
        }

        $value = $this->comparisonMetricValue($row, $metricKey, $tableType);

        return $value === null ? '-' : $this->formatInteger((int) $value);
    }

    private function comparisonMetricValue(
        DanceShortsAnalyzerDeltaRowDTO|DanceShortsAnalyzerPerHourRowDTO|null $row,
        string $metricKey,
        string $tableType,
    ): int|float|null {
        if ($row === null) {
            return null;
        }

        if ($tableType === 'per_hour' && $row instanceof DanceShortsAnalyzerPerHourRowDTO) {
            return match ($metricKey) {
                'view_count' => $row->viewPerHour,
                'like_count' => $row->likePerHour,
                'comment_count' => $row->commentPerHour,
                default => null,
            };
        }

        if ($tableType === 'delta' && $row instanceof DanceShortsAnalyzerDeltaRowDTO) {
            return match ($metricKey) {
                'view_count' => $row->viewDelta,
                'like_count' => $row->likeDelta,
                'comment_count' => $row->commentDelta,
                default => null,
            };
        }

        return null;
    }

    /**
     * @return array<string, array{tab_label: string, chart_label: string}>
     */
    private function metricDefinitions(): array
    {
        return [
            'view_count' => [
                'tab_label' => '視聴数',
                'chart_label' => 'View推移',
            ],
            'like_count' => [
                'tab_label' => '高評価数',
                'chart_label' => 'Like推移',
            ],
            'comment_count' => [
                'tab_label' => 'コメント数',
                'chart_label' => 'Comment推移',
            ],
        ];
    }

    /**
     * @return array<string, array{label: string}>
     */
    private function comparisonPeriodDefinitions(): array
    {
        return [
            'day' => ['label' => '日'],
            'week' => ['label' => '週'],
            'month' => ['label' => '月'],
            'all' => ['label' => 'ALL'],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function chartColors(): array
    {
        return ['#60a5fa', '#22c55e', '#f97316', '#a78bfa', '#facc15'];
    }

    private function chartColorForVideo(DanceShortsAnalyzerAnalyzePageResultDTO $result, int $videoId): string
    {
        foreach ($result->selectedVideos as $index => $video) {
            if ($video->videoId === $videoId) {
                return $this->chartColors()[$index % count($this->chartColors())];
            }
        }

        return $this->chartColors()[0];
    }

    private function comparisonChartAxisLabel(
        DanceShortsAnalyzerSnapshotPointDTO $snapshot,
        string $periodKey,
    ): string {
        return match ($periodKey) {
            'day' => $snapshot->collectedAt->format('H:i'),
            'week' => $snapshot->collectedAt->format('m/d H:i'),
            'month' => $snapshot->collectedAt->format('m/d'),
            'all' => $snapshot->collectedAt->format('Y/m/d'),
            default => $snapshot->collectedAt->format('m/d H:i'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function comparisonChartAxisLabelProps(string $periodKey): array
    {
        return [
            'color' => '#bfdbfe',
            'fontSize' => 10,
            'hideOverlap' => true,
            'margin' => 8,
            'rotate' => match ($periodKey) {
                'week', 'month' => 30,
                'all' => 45,
                default => 0,
            },
        ];
    }

    private function comparisonChartGridBottom(string $periodKey): int
    {
        return match ($periodKey) {
            'week', 'month' => 28,
            'all' => 36,
            default => 16,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function regionAnalysisProps(
        DanceShortsAnalyzerRegionAnalysisDTO $regionAnalysis,
        DanceShortsAnalyzerAnalyzePageResultDTO $result,
    ): array {
        return [
            'region_id' => $regionAnalysis->regionId,
            'region_code' => $regionAnalysis->regionCode,
            'region_name' => $regionAnalysis->regionName,
            'is_active' => $regionAnalysis->regionId === $result->activeRegionId,
            'snapshot_count' => count($regionAnalysis->snapshots),
            'latest_snapshot' => $regionAnalysis->latestSnapshot === null
                ? null
                : $this->snapshotProps($regionAnalysis->latestSnapshot),
            'metric_cards' => $this->metricCardProps($regionAnalysis->metrics),
            'charts' => $this->chartProps($regionAnalysis),
            'snapshots' => array_map(
                fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): array => $this->snapshotProps($snapshot),
                $regionAnalysis->snapshots,
            ),
            'delta_rows' => array_map(
                fn (DanceShortsAnalyzerDeltaRowDTO $row): array => $this->deltaRowProps($row),
                $regionAnalysis->deltaRows,
            ),
            'per_hour_rows' => array_map(
                fn (DanceShortsAnalyzerPerHourRowDTO $row): array => $this->perHourRowProps($row),
                $regionAnalysis->perHourRows,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshotProps(DanceShortsAnalyzerSnapshotPointDTO $snapshot): array
    {
        return [
            'snapshot_id' => $snapshot->snapshotId,
            'video_id' => $snapshot->videoId,
            'region_id' => $snapshot->regionId,
            'region_code' => $snapshot->regionCode,
            'region_name' => $snapshot->regionName,
            'collected_at' => $snapshot->collectedAt->toIso8601String(),
            'collected_at_label' => $snapshot->collectedAt->format('Y-m-d H:i'),
            'view_count' => $snapshot->viewCount,
            'view_count_label' => $this->formatInteger($snapshot->viewCount),
            'like_count' => $snapshot->likeCount,
            'like_count_label' => $this->formatNullableInteger($snapshot->likeCount),
            'comment_count' => $snapshot->commentCount,
            'comment_count_label' => $this->formatNullableInteger($snapshot->commentCount),
        ];
    }

    /**
     * @param  array<int, DanceShortsAnalyzerSnapshotMetricDTO>  $metrics
     * @return array<int, array<string, mixed>>
     */
    private function metricCardProps(array $metrics): array
    {
        $latestMetric = $metrics === [] ? null : $metrics[array_key_last($metrics)];

        return [
            [
                'key' => 'view_delta',
                'label' => 'Views増加',
                'value' => $latestMetric?->viewDelta,
                'display_value' => $this->formatNullableSignedInteger($latestMetric?->viewDelta),
                'sub_label' => '直近snapshot間',
            ],
            [
                'key' => 'view_per_hour',
                'label' => '1hあたり',
                'value' => $latestMetric?->viewPerHour,
                'display_value' => $this->formatNullablePerHour($latestMetric?->viewPerHour),
                'sub_label' => 'Views / h',
            ],
            [
                'key' => 'like_delta',
                'label' => 'Like増加',
                'value' => $latestMetric?->likeDelta,
                'display_value' => $this->formatNullableSignedInteger($latestMetric?->likeDelta),
                'sub_label' => '直近snapshot間',
            ],
            [
                'key' => 'comment_delta',
                'label' => 'Comment増加',
                'value' => $latestMetric?->commentDelta,
                'display_value' => $this->formatNullableSignedInteger($latestMetric?->commentDelta),
                'sub_label' => '直近snapshot間',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function chartProps(DanceShortsAnalyzerRegionAnalysisDTO $regionAnalysis): array
    {
        $labels = array_map(
            fn (DanceShortsAnalyzerSnapshotPointDTO $snapshot): string => $snapshot->collectedAt->format('m/d H:i'),
            $regionAnalysis->snapshots,
        );
        $charts = [];

        foreach ($regionAnalysis->metricSeries as $series) {
            $charts[$series->metricKey] = [
                'title' => $series->label,
                'option' => $this->chartOption($regionAnalysis, $series, $labels),
            ];
        }

        return $charts;
    }

    /**
     * @param  array<int, string>  $labels
     * @return array<string, mixed>
     */
    private function chartOption(
        DanceShortsAnalyzerRegionAnalysisDTO $regionAnalysis,
        DanceShortsAnalyzerMetricSeriesDTO $series,
        array $labels,
    ): array {
        return [
            'backgroundColor' => 'transparent',
            'color' => [$this->chartColors()[0]],
            'tooltip' => [
                'trigger' => 'axis',
                'backgroundColor' => 'rgba(15, 23, 42, 0.94)',
                'borderColor' => 'rgba(96, 165, 250, 0.32)',
                'textStyle' => [
                    'color' => '#f8fafc',
                ],
            ],
            'legend' => [
                'show' => false,
            ],
            'grid' => [
                'left' => 8,
                'right' => 8,
                'top' => 8,
                'bottom' => 8,
                'containLabel' => true,
            ],
            'xAxis' => [
                'type' => 'category',
                'boundaryGap' => true,
                'data' => $labels,
                'axisLabel' => [
                    'color' => '#bfdbfe',
                    'fontSize' => 10,
                    'hideOverlap' => true,
                ],
                'axisLine' => [
                    'lineStyle' => [
                        'color' => 'rgba(191, 219, 254, 0.28)',
                    ],
                ],
            ],
            'yAxis' => [
                'type' => 'value',
                'axisLabel' => [
                    'color' => '#bfdbfe',
                    'fontSize' => 10,
                ],
                'splitLine' => [
                    'lineStyle' => [
                        'color' => 'rgba(191, 219, 254, 0.14)',
                    ],
                ],
            ],
            'series' => [
                [
                    'name' => $series->label.' '.$regionAnalysis->regionCode,
                    'type' => 'line',
                    'smooth' => true,
                    'symbolSize' => 7,
                    'lineStyle' => [
                        'width' => 3,
                    ],
                    'data' => $series->values,
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function deltaRowProps(DanceShortsAnalyzerDeltaRowDTO $row): array
    {
        return [
            'row_id' => $row->snapshot->snapshotId,
            'period_label' => $this->periodLabel($row->previousSnapshot, $row->snapshot),
            'previous_collected_at_label' => $row->previousSnapshot?->collectedAt->format('Y-m-d H:i'),
            'current_collected_at_label' => $row->snapshot->collectedAt->format('Y-m-d H:i'),
            'view_delta' => $row->viewDelta,
            'view_delta_label' => $this->formatNullableSignedInteger($row->viewDelta),
            'like_delta' => $row->likeDelta,
            'like_delta_label' => $this->formatNullableSignedInteger($row->likeDelta),
            'comment_delta' => $row->commentDelta,
            'comment_delta_label' => $this->formatNullableSignedInteger($row->commentDelta),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function perHourRowProps(DanceShortsAnalyzerPerHourRowDTO $row): array
    {
        return [
            'row_id' => $row->snapshot->snapshotId,
            'period_label' => $this->periodLabel($row->previousSnapshot, $row->snapshot),
            'hours' => $row->hours,
            'hours_label' => $row->hours === null ? '計算不能' : number_format($row->hours, 2).'h',
            'view_per_hour' => $row->viewPerHour,
            'view_per_hour_label' => $this->formatNullablePerHour($row->viewPerHour),
            'like_per_hour' => $row->likePerHour,
            'like_per_hour_label' => $this->formatNullablePerHour($row->likePerHour),
            'comment_per_hour' => $row->commentPerHour,
            'comment_per_hour_label' => $this->formatNullablePerHour($row->commentPerHour),
        ];
    }

    private function periodLabel(
        ?DanceShortsAnalyzerSnapshotPointDTO $previousSnapshot,
        DanceShortsAnalyzerSnapshotPointDTO $snapshot,
    ): string {
        if ($previousSnapshot === null) {
            return '初回snapshot';
        }

        return $previousSnapshot->collectedAt->format('m/d H:i').' -> '.$snapshot->collectedAt->format('m/d H:i');
    }

    private function analyzeUrl(DanceShortsAnalyzerAnalyzePageResultDTO $result, int $activeVideoId): string
    {
        return route('dance-shorts-analyzer.analyze', [
            'video_ids' => array_map(
                fn (DanceShortsAnalyzerSelectedVideoDTO $video): int => $video->videoId,
                $result->selectedVideos,
            ),
            'active_video_id' => $activeVideoId,
        ], false);
    }

    private function formatInteger(int $value): string
    {
        return number_format($value);
    }

    private function formatNullableInteger(?int $value): string
    {
        return $value === null ? '計算不能' : $this->formatInteger($value);
    }

    private function formatNullableSignedInteger(?int $value): string
    {
        if ($value === null) {
            return '計算不能';
        }

        return ($value >= 0 ? '+' : '').number_format($value);
    }

    private function formatNullablePerHour(?float $value): string
    {
        return $value === null ? '計算不能' : $this->formatPerHour($value);
    }

    private function formatPerHour(float $value): string
    {
        return number_format($value, 2).' / h';
    }
}
