import type { EChartsOption } from 'echarts';

import EChartsViewer from '@/Components/Common/Visualizations/Charts/EChartsViewer';
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

const csvToOrderSaveFlowChart = `flowchart TD
    title["題：CSV連携から注文保存までの流れ"]
    start(["Start"])
    createCsv["新見積システム側でCSV生成"]
    appendSubjectNumber["CSV末尾に件名番号を追加"]
    importCsv["工事発注管理・請求システム側でCSV取込"]
    readSubjectNumber["固定添字 line[31] から件名番号を取得"]
    setOrderModel["OrderModel に setValue"]
    saveOrders["create / insert で orders に保存"]
    endNode(["End"])
    title --> start
    start --> createCsv --> appendSubjectNumber --> importCsv --> readSubjectNumber --> setOrderModel --> saveOrders --> endNode`;

const subjectNumberImpactFlowChart = `flowchart TD
    title["題：件名番号追加時の影響範囲"]
    start(["Start"])
    appendSourceColumn["CSV生成元の末尾カラム追加"]
    readImportColumn["CSV取込側の line[31] 取得処理追加"]
    updateOrderModel["OrderModel の addParam 対応"]
    addOrdersColumn["orders テーブルの subject_number カラム追加"]
    optionalDisplay["画面表示または検索で使う場合は別途表示側対応"]
    endNode(["End"])
    title --> start
    start --> appendSourceColumn --> readImportColumn --> updateOrderModel --> addOrdersColumn --> optionalDisplay --> endNode`;

const visibilityComparisonLabels = [
    'CSV列追加の安全性',
    '既存処理への影響の少なさ',
    '保存処理の追跡しやすさ',
    '改修範囲の説明しやすさ',
    'ポートフォリオ上の伝わりやすさ',
];

const visibilityComparisonChartOption: EChartsOption = {
    backgroundColor: 'transparent',
    title: {
        text: '改修前後の見通し比較',
        subtext: '説明用スコア（実測値ではありません）',
        left: 'center',
        top: 0,
        textStyle: {
            color: '#f8fafc',
            fontSize: 16,
            fontWeight: 700,
        },
        subtextStyle: {
            color: 'rgba(203, 213, 225, 0.78)',
            fontSize: 12,
        },
    },
    legend: {
        top: 54,
        left: 'center',
        textStyle: {
            color: '#cbd5e1',
        },
    },
    grid: {
        top: 102,
        right: 18,
        bottom: 22,
        left: 28,
        containLabel: true,
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow',
        },
    },
    xAxis: {
        type: 'value',
        name: '説明用スコア',
        max: 5,
        splitNumber: 5,
        nameTextStyle: {
            color: '#cbd5e1',
        },
        axisLabel: {
            color: '#cbd5e1',
        },
        axisLine: {
            lineStyle: {
                color: 'rgba(148, 163, 184, 0.35)',
            },
        },
        splitLine: {
            lineStyle: {
                color: 'rgba(148, 163, 184, 0.18)',
            },
        },
    },
    yAxis: {
        type: 'category',
        data: visibilityComparisonLabels,
        axisLabel: {
            color: '#e2e8f0',
        },
        axisLine: {
            lineStyle: {
                color: 'rgba(148, 163, 184, 0.35)',
            },
        },
        axisTick: {
            show: false,
        },
    },
    series: [
        {
            name: '改修前（文章中心）',
            type: 'bar',
            data: [2, 2, 2, 2, 2],
            barMaxWidth: 18,
            itemStyle: {
                color: '#94a3b8',
                borderRadius: [0, 4, 4, 0],
            },
        },
        {
            name: '改修後（図解追加）',
            type: 'bar',
            data: [4, 5, 4, 5, 5],
            barMaxWidth: 18,
            itemStyle: {
                color: '#22d3ee',
                borderRadius: [0, 4, 4, 0],
            },
        },
    ],
};

const existingSystemFeatures = [
    'CSV末尾へ件名番号を追加するため、既存列の並びを大きく動かさずに拡張できます。',
    '取込側は固定添字 line[31] を読む追加に絞るため、既存のCSV取込手順を追いやすい構成です。',
    'OrderModel への値セットと orders 保存までを分けて見ることで、どこを触ったのか説明しやすくなります。',
];

const compactMermaidClassName =
    'mt-4 [&_svg]:mx-auto [&_svg]:!w-[min(100%,220px)] sm:[&_svg]:!w-[min(100%,300px)]';

export default function CsvIntegrationVisualizationSection() {
    return (
        <section className="rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                CSV Integration
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                CSV連携と改修範囲の見える化
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                工事発注管理・請求システム本体の処理には触れず、PP上でCSV連携の流れ、件名番号追加時の影響範囲、説明用スコアを整理して表示します。
            </p>

            <div className="mt-5 rounded-lg border border-emerald-200/30 bg-emerald-200/10 p-4 text-emerald-50">
                <h3 className="text-base font-semibold">既存システムの特徴</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {existingSystemFeatures.map((feature) => (
                        <p
                            key={feature}
                            className="rounded-lg border border-white/12 bg-slate-950/30 p-3 text-sm leading-6 text-emerald-50/88"
                        >
                            {feature}
                        </p>
                    ))}
                </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <article className="rounded-lg border border-white/14 bg-white/8 p-4">
                    <p className="text-sm leading-6 text-slate-200/78">
                        CSV生成から注文保存までを1本の流れに絞り、件名番号がどの段階で追加・取得・保存されるかを示します。
                    </p>
                    <MermaidDiagram
                        chart={csvToOrderSaveFlowChart}
                        title="CSV連携から注文保存までの流れ"
                        className={compactMermaidClassName}
                    />
                </article>

                <article className="rounded-lg border border-white/14 bg-white/8 p-4">
                    <p className="text-sm leading-6 text-slate-200/78">
                        件名番号を追加する時に見るべき範囲を、CSV生成元、取込、モデル、保存先、表示側に分けて整理します。
                    </p>
                    <MermaidDiagram
                        chart={subjectNumberImpactFlowChart}
                        title="件名番号追加時の影響範囲"
                        className={compactMermaidClassName}
                    />
                </article>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-white/14 bg-slate-950/42 p-2 sm:p-4">
                <EChartsViewer
                    option={visibilityComparisonChartOption}
                    height={410}
                    renderer="svg"
                />
            </div>
        </section>
    );
}
