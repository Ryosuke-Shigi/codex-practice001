/**
 * 工事発注 idea-board の請求へ進める条件 section Component です。
 *
 * 固定データと図で請求可否の考え方を表示するだけにし、業務状態遷移判断は持ちません。
 */
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import {
    billingGateFlowChart,
    billingGateGroups,
} from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,680px)] [&_svg]:!max-w-full';

function groupClassName(title: string) {
    if (title.includes('進める')) {
        return 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50';
    }

    return 'border-rose-200/35 bg-rose-200/10 text-rose-50';
}

export default function ConstructionBillingBillingGateSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Invoice Gate
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                請求へ進める条件
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                必要な作業カードがすべて終端状態になった場合だけ、請求書作成へ進める考え方です。
                保留が1つでも残っている場合は、請求可能として扱いません。
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {billingGateGroups.map((group) => (
                        <article
                            key={group.title}
                            className={`min-w-0 rounded-lg border p-4 ${groupClassName(group.title)}`}
                        >
                            <h3 className="text-base font-semibold">{group.title}</h3>
                            <p className="mt-1 text-sm opacity-80">{group.role}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {group.points.map((point) => (
                                    <span
                                        key={point}
                                        className="rounded-md border border-current/30 bg-slate-950/20 px-2.5 py-1 text-sm font-semibold"
                                    >
                                        {point}
                                    </span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <p className="text-sm leading-6 text-slate-200/78">
                        SKIPは終端状態として扱いますが、理由が必要です。未着手、処理中、保留は作業が残っている状態として請求前に止めます。
                    </p>
                    <MermaidDiagram
                        chart={billingGateFlowChart}
                        title="請求へ進める条件"
                        className={diagramClassName}
                    />
                </article>
            </div>
        </section>
    );
}
