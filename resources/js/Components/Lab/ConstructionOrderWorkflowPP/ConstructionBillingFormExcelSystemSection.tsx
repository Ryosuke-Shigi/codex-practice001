import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import {
    formExcelSystemFlowChart,
    formExcelSystemRoles,
} from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,680px)] [&_svg]:!max-w-full';

function roleClassName(title: string) {
    if (title === 'Form') {
        return 'border-sky-200/35 bg-sky-200/10 text-sky-50';
    }

    if (title === 'Excel') {
        return 'border-amber-200/35 bg-amber-200/10 text-amber-50';
    }

    return 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50';
}

export default function ConstructionBillingFormExcelSystemSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Boundary
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                Form / Excel / System の役割を分ける
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                Formは入力と操作、Excelは確認・出力・既存業務との接続、Systemは状態管理と業務ルールを担当します。
                Excelで全部を管理するのではなく、Excelで見たい情報とSystemで管理すべき情報を分けます。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {formExcelSystemRoles.map((column) => (
                    <article
                        key={column.title}
                        className={`min-w-0 rounded-lg border p-4 ${roleClassName(column.title)}`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">
                            {column.title}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">{column.role}</h3>
                        <ul className="mt-3 space-y-2 text-sm leading-6 opacity-90">
                            {column.points.map((point) => (
                                <li key={point} className="flex gap-2">
                                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <p className="text-sm leading-6 text-slate-200/78">
                    Excel依存を急にゼロにするのではなく、現場が確認しやすい帳票として残しながら、判断の本体はSystem側に寄せます。
                </p>
                <MermaidDiagram
                    chart={formExcelSystemFlowChart}
                    title="Form・Excel・Systemの役割分離"
                    className={diagramClassName}
                />
            </div>
        </section>
    );
}
