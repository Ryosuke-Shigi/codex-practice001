import { useMemo, useState } from 'react';
import EChartsViewer from '@/Components/Common/Visualizations/Charts/EChartsViewer';
import type { DanceShortsAnalyzerComparisonChart } from './AnalyzeField';

type AnalyzeChartFieldProps = {
    charts: Record<string, DanceShortsAnalyzerComparisonChart>;
    activeMetric: string;
};

/** Responderの観測値を表示し、チャート操作は表示中の観測位置だけを変更します。 */
export default function AnalyzeChartField({ charts, activeMetric }: AnalyzeChartFieldProps) {
    const chart = charts[activeMetric];
    const [selectedIndex, setSelectedIndex] = useState(0);
    const onEvents = useMemo(() => ({
        updateAxisPointer: (event: unknown) => {
            const pointer = event as { axesInfo?: { axisDim?: string; value?: number }[] };
            const index = pointer?.axesInfo?.find((axis) => axis.axisDim === 'x')?.value;
            if (typeof index === 'number' && Number.isInteger(index) && index >= 0) setSelectedIndex(index);
        },
    }), []);
    if (!chart) return null;
    const observation = chart.observations[selectedIndex] ?? chart.observations[0];
    return (
        <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <h2 className="text-base font-bold text-white">観測時点の値</h2>
            <p className="mt-1 text-xs leading-5 text-slate-300">グラフの点をタップ、または観測時刻を選択して値を確認できます。</p>
            <EChartsViewer option={chart.option} height="clamp(240px, 42dvh, 380px)" renderer="svg" onEvents={onEvents} />
            {observation && (
                <div className="mt-3 min-w-0 rounded-lg bg-slate-950 p-3">
                    <label className="block text-sm font-bold text-white">
                        観測時刻
                        <select aria-label="観測時刻" value={Math.min(selectedIndex, chart.observations.length - 1)} onChange={(event) => setSelectedIndex(Number(event.target.value))}
                            className="mt-2 block min-h-11 w-full rounded-md border border-slate-600 bg-slate-900 px-2 text-sm text-white">
                            {chart.observations.map((point, index) => <option key={index} value={index}>{point.collected_at_label}</option>)}
                        </select>
                    </label>
                    <dl className="mt-3 divide-y divide-slate-800">
                        {observation.videos.map((video) => (
                            <div key={video.video_id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(6rem,max-content)] gap-3 py-3">
                                <dt className="min-w-0 break-words text-sm leading-5 text-slate-100"><span className="mr-1 font-black" style={{color: video.chart_color}}>{video.comparison_number}.</span>{video.title}</dt>
                                <dd className="self-start whitespace-nowrap text-right text-sm font-bold tabular-nums text-white">{video.value_label}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-2 text-xs text-slate-400">「-」はこの時刻の観測値がありません。</p>
                </div>
            )}
        </section>
    );
}
