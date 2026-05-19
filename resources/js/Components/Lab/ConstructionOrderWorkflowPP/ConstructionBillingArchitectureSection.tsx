import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import {
    architectureFlowChart,
    architectureResponsibilities,
} from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,760px)] [&_svg]:!max-w-full';

export default function ConstructionBillingArchitectureSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Architecture
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                ADR / レイヤード構成で責務分離して作る
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                このPPは本実装ではありませんが、作る前提はADRとレイヤード構成です。
                Controller、Request、Action、Service、Repository、DTO、Responder、Componentの責務を混ぜない設計として説明します。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {architectureResponsibilities.map((card) => (
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

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <MermaidDiagram
                    chart={architectureFlowChart}
                    title="ADRとレイヤード構成の責務分離"
                    className={diagramClassName}
                />
            </div>
        </section>
    );
}
