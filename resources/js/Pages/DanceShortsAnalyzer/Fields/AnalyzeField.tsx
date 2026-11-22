/**
 * DanceShortsAnalyzer Analyze 画面の分析表示 Field Component です。
 *
 * metric / period の UI 状態を受けて表示を切り替え、snapshot 計算や EChartsOption 生成は backend props を使います。
 */
import type { EChartsOption } from 'echarts';

import { useState } from 'react';

import AnalyzeChartField from './AnalyzeChartField';
import AnalyzeDeltaTableField from './AnalyzeDeltaTableField';
import AnalyzePerHourTableField from './AnalyzePerHourTableField';
import AnalyzeSelectedVideoField from './AnalyzeSelectedVideoField';

export type DanceShortsAnalyzerSnapshot = {
    snapshot_id: number;
    video_id: number;
    region_id: number;
    region_code: string;
    region_name: string;
    collected_at: string;
    collected_at_label: string;
    view_count: number;
    view_count_label: string;
    like_count: number | null;
    like_count_label: string;
    comment_count: number | null;
    comment_count_label: string;
};

export type DanceShortsAnalyzerSelectedVideo = {
    video_id: number;
    youtube_video_id: string;
    title: string;
    channel_title: string | null;
    thumbnail_url: string | null;
    published_at: string | null;
    youtube_url: string;
    tracking_status: string;
    is_active: boolean;
    active_url: string;
    chart_color: string;
    comparison_number: number;
    latest_snapshot: DanceShortsAnalyzerSnapshot | null;
};

export type DanceShortsAnalyzerMetricCard = {
    key: string;
    label: string;
    value: number | null;
    display_value: string;
    sub_label: string;
};

export type DanceShortsAnalyzerChart = {
    title: string;
    option: EChartsOption;
};

export type DanceShortsAnalyzerComparisonChart = DanceShortsAnalyzerChart & {
    observations: {
        collected_at_label: string;
        videos: (DanceShortsAnalyzerComparisonColumn & { value_label: string })[];
    }[];
};

export type DanceShortsAnalyzerDeltaRow = {
    row_id: number;
    period_label: string;
    previous_collected_at_label: string | null;
    current_collected_at_label: string;
    view_delta: number | null;
    view_delta_label: string;
    like_delta: number | null;
    like_delta_label: string;
    comment_delta: number | null;
    comment_delta_label: string;
};

export type DanceShortsAnalyzerPerHourRow = {
    row_id: number;
    period_label: string;
    hours: number | null;
    hours_label: string;
    view_per_hour: number | null;
    view_per_hour_label: string;
    like_per_hour: number | null;
    like_per_hour_label: string;
    comment_per_hour: number | null;
    comment_per_hour_label: string;
};

export type DanceShortsAnalyzerComparisonColumn = {
    video_id: number;
    title: string;
    comparison_number: number;
    chart_color: string;
};

export type DanceShortsAnalyzerComparisonCell = {
    video_id: number;
    period_label: string | null;
    value_label: string;
};

export type DanceShortsAnalyzerComparisonRow = {
    row_id: number;
    period_label: string;
    current_collected_at_label: string;
    cells: DanceShortsAnalyzerComparisonCell[];
};

export type DanceShortsAnalyzerComparisonTable = {
    columns: DanceShortsAnalyzerComparisonColumn[];
    rows: DanceShortsAnalyzerComparisonRow[];
    metric_label: string;
};

export type DanceShortsAnalyzerComparisonPeriod = {
    label: string;
    charts: Record<string, DanceShortsAnalyzerComparisonChart>;
    tables: {
        delta: Record<string, DanceShortsAnalyzerComparisonTable>;
        per_hour: Record<string, DanceShortsAnalyzerComparisonTable>;
    };
};

export type DanceShortsAnalyzerComparison = {
    periods: Record<AnalyzePeriodKey, DanceShortsAnalyzerComparisonPeriod>;
};

export type DanceShortsAnalyzerRegionAnalysis = {
    region_id: number;
    region_code: string;
    region_name: string;
    is_active: boolean;
    snapshot_count: number;
    latest_snapshot: DanceShortsAnalyzerSnapshot | null;
    metric_cards: DanceShortsAnalyzerMetricCard[];
    charts: Record<string, DanceShortsAnalyzerChart>;
    snapshots: DanceShortsAnalyzerSnapshot[];
    delta_rows: DanceShortsAnalyzerDeltaRow[];
    per_hour_rows: DanceShortsAnalyzerPerHourRow[];
};

export type DanceShortsAnalyzerAnalyzeFieldProps = {
    search_url: string;
    empty_message: string | null;
    no_snapshot_message: string | null;
    active_video_id: number | null;
    active_region_id: number | null;
    selected_videos: DanceShortsAnalyzerSelectedVideo[];
    active_video: DanceShortsAnalyzerSelectedVideo | null;
    regions: DanceShortsAnalyzerRegionAnalysis[];
    comparison: DanceShortsAnalyzerComparison;
};

type AnalyzeFieldProps = {
    analyzeField: DanceShortsAnalyzerAnalyzeFieldProps;
};

type AnalyzeMetricKey = 'view_count' | 'like_count' | 'comment_count';
type AnalyzePeriodKey = 'day' | 'week' | 'month' | 'all';

const metricTabs: {
    key: AnalyzeMetricKey;
    label: string;
}[] = [
    {
        key: 'view_count',
        label: '視聴数',
    },
    {
        key: 'like_count',
        label: '高評価数',
    },
    {
        key: 'comment_count',
        label: 'コメント数',
    },
];

const periodTabs: {
    key: AnalyzePeriodKey;
    label: string;
}[] = [
    {
        key: 'day',
        label: '日',
    },
    {
        key: 'week',
        label: '週',
    },
    {
        key: 'month',
        label: '月',
    },
    {
        key: 'all',
        label: 'ALL',
    },
];

export default function AnalyzeField({ analyzeField }: AnalyzeFieldProps) {
    const [activeMetric, setActiveMetric] =
        useState<AnalyzeMetricKey>('view_count');

    // period タブは MOCK の UI 契約として持ち、snapshot の計算結果は Laravel props をそのまま表示します。
    const [activePeriod, setActivePeriod] = useState<AnalyzePeriodKey>('day');

    if (analyzeField.selected_videos.length === 0) {
        return (
            <section className="min-h-0 min-w-0 flex-1 overflow-x-hidden rounded-lg border border-white/16 bg-slate-950/58 p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.28)] backdrop-blur-xl">
                <p className="text-sm font-semibold leading-6 text-slate-100/82">
                    {analyzeField.empty_message ??
                        '分析する動画を選択してください。'}
                </p>
            </section>
        );
    }

    const activeComparison =
        analyzeField.comparison.periods[activePeriod] ??
        analyzeField.comparison.periods.all;
    const activeDeltaTable =
        activeComparison?.tables.delta[activeMetric] ?? null;
    const activePerHourTable =
        activeComparison?.tables.per_hour[activeMetric] ?? null;

    return (
        <section className="min-w-0 space-y-4 rounded-xl border border-white/15 bg-slate-950 p-3 sm:p-5">
            <AnalyzeSelectedVideoField selectedVideos={analyzeField.selected_videos} />
            <div className="space-y-3 rounded-lg bg-slate-900 p-3">
                <div aria-label="指標" className="flex flex-wrap gap-2">
                    {metricTabs.map((metric) => (
                        <button key={metric.key} type="button" aria-pressed={activeMetric === metric.key}
                            onClick={() => setActiveMetric(metric.key)}
                            className={`min-h-11 rounded-lg border px-3 text-sm font-bold focus-visible:ring-2 focus-visible:ring-blue-100 ${activeMetric === metric.key ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-600 bg-slate-900 text-slate-200'}`}>
                            {metric.label}
                        </button>
                    ))}
                </div>
                <PeriodTabsField activePeriod={activePeriod} onChangePeriod={setActivePeriod} />
            </div>
            {analyzeField.no_snapshot_message !== null ? (
                <p role="status" className="rounded-lg border border-dashed border-slate-600 p-4 text-sm text-slate-200">{analyzeField.no_snapshot_message}</p>
            ) : (
                <>
                    <AnalyzeChartField key={`${activeMetric}-${activePeriod}`} charts={activeComparison?.charts ?? {}} activeMetric={activeMetric} />
                    <div>
                        <h2 className="mb-3 text-base font-bold text-white">区間ごとの変化</h2>
                        <p className="mb-3 text-xs text-slate-300">「-」は欠測・計算不能、増加量0は変化なしです。終了時刻を揃え、各値の実区間を示します。1時間あたりは小数2桁の丸め値で、0.00 / hにも小さな変化を含む場合があります。</p>
                        <div className="grid min-w-0 gap-4 [@media(min-width:768px)_and_(min-height:600px)]:grid-cols-2">
                            {activeDeltaTable !== null && <AnalyzeDeltaTableField table={activeDeltaTable} />}
                            {activePerHourTable !== null && <AnalyzePerHourTableField table={activePerHourTable} />}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

function PeriodTabsField({
    activePeriod,
    onChangePeriod,
}: {
    activePeriod: AnalyzePeriodKey;
    onChangePeriod: (period: AnalyzePeriodKey) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {periodTabs.map((period) => {
                const isActive = activePeriod === period.key;

                return (
                    <button
                        key={period.key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChangePeriod(period.key)}
                        className={[
                            'min-h-11 rounded-lg border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100',
                            isActive
                                ? 'border-blue-100 bg-blue-500 text-white'
                                : 'border-white/16 bg-white/8 text-blue-50 hover:bg-white/14',
                        ].join(' ')}
                    >
                        {period.label}
                    </button>
                );
            })}
        </div>
    );
}
