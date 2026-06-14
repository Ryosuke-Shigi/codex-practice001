/**
 * 工事発注 idea-board の案件中心データ構造 section Component です。
 *
 * 説明用カードと図を表示するだけで、正式なDB設計やMigrationの正本としては扱いません。
 */
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import {
    caseStructureCards,
    caseStructureFlowChart,
} from './constructionBillingPresentationData';

const diagramClassName =
    'mt-4 [&_svg]:mx-auto [&_svg]:!w-[min(100%,620px)] [&_svg]:!max-w-full';

export default function ConstructionBillingCaseStructureSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Case Structure
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                案件中心のデータ構造
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                CSVから登録された後は、案件を中心にして発注、作業カード、請求、領収、履歴を紐づける考え方です。
                ここでは正式なテーブル設計ではなく、構想段階の関係イメージとして見せます。
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {caseStructureCards.map((card) => (
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
                        案件を中心に置くことで、発注の数、作業カードの進み具合、請求・領収、理由付き履歴を同じ文脈で追えるようにします。
                    </p>
                    <MermaidDiagram
                        chart={caseStructureFlowChart}
                        title="案件中心のデータ構造イメージ"
                        className={diagramClassName}
                    />
                </article>
            </div>
        </section>
    );
}
