/**
 * 工事発注 idea-board の状態チャート section Component です。
 *
 * ECharts 表示用の説明データを描画するだけで、実データ集計や帳票状態管理は行いません。
 */
import EChartsViewer from '@/Components/Common/Visualizations/Charts/EChartsViewer';

import { statusCharts } from './constructionBillingPresentationData';

export default function ConstructionBillingStatusChartSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Status Charts
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                状態をグラフで見える化する
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                EChartsの共通表示コンポーネントを使い、工事、請求、月別請求額、業者別発注件数を仮データで可視化します。
                ここでは本番DBには触れず、後でDTOやInertia propsに置き換えやすい形で表示します。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {statusCharts.map((chart) => (
                    <article
                        key={chart.title}
                        className="min-w-0 overflow-hidden rounded-lg border border-white/14 bg-slate-950/42 p-4"
                    >
                        <div className="mb-3">
                            <h3 className="text-base font-semibold text-white">
                                {chart.title}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-slate-200/75">
                                {chart.description}
                            </p>
                        </div>
                        <EChartsViewer
                            option={chart.option}
                            height={320}
                            renderer="svg"
                        />
                    </article>
                ))}
            </div>
        </section>
    );
}
