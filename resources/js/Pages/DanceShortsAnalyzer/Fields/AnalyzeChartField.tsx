/**
 * DanceShortsAnalyzer Analyze 画面のチャート Field Component です。
 *
 * Responder が生成した ECharts option を表示し、Component 側で series や業務値を再計算しません。
 */
import EChartsViewer from '@/Components/Common/Visualizations/Charts/EChartsViewer';

import type { DanceShortsAnalyzerChart } from './AnalyzeField';

type AnalyzeChartFieldProps = {
    charts: Record<string, DanceShortsAnalyzerChart>;
    activeMetric: string;
};

export default function AnalyzeChartField({
    charts,
    activeMetric,
}: AnalyzeChartFieldProps) {
    const chart = charts[activeMetric];

    if (!chart) {
        return null;
    }

    return (
        <section className="shrink-0 overflow-x-auto rounded-lg border border-white/14 bg-slate-950/50 p-1.5">
            <div className="min-w-[320px]">
                <EChartsViewer
                    option={chart.option}
                    height="clamp(240px, 42dvh, 380px)"
                    renderer="svg"
                />
            </div>
        </section>
    );
}
