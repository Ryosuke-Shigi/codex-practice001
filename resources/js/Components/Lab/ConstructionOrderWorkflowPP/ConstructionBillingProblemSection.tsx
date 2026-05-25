import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import { problemCards, problemFlowChart } from './constructionBillingPresentationData';

const diagramClassName =
    'mt-4 [&_svg]:mx-auto [&_svg]:!w-[min(100%,620px)] [&_svg]:!max-w-full';

export default function ConstructionBillingProblemSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Problem
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                何を解決するシステムか
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                工事、発注、請求を同じ場所に置くだけでは、現場で見たい状態と管理すべき状態が混ざります。
                このアイデアボードでは、Form入力とExcel/CSV入力を同じ発注登録へ集約し、状態管理をSystem側へ寄せる境界を見せます。
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {problemCards.map((card) => (
                        <article
                            key={card.title}
                            className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                        >
                            <h3 className="text-base font-semibold">{card.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-200/78">
                                {card.detail}
                            </p>
                        </article>
                    ))}
                </div>

                <article className="min-w-0 rounded-lg border border-cyan-100/30 bg-cyan-100/10 p-4">
                    <p className="text-sm leading-6 text-cyan-50/88">
                        課題は「Excelが悪い」ではなく、Excelに状態判断まで閉じ込めてしまうことです。
                        既存ExcelはCSVを出す入力元として活かし、発注登録と状態管理はSystem側へ集約します。
                    </p>
                    <MermaidDiagram
                        chart={problemFlowChart}
                        title="工事発注管理と請求管理の課題"
                        className={diagramClassName}
                    />
                </article>
            </div>
        </section>
    );
}
