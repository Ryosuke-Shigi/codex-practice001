import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import { constructionBillingFlowChart } from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,760px)] [&_svg]:!max-w-full';

export default function ConstructionBillingFlowSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Workflow
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                工事登録から請求管理までの流れ
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                工事を登録し、業者を選び、発注を作成して、完了確認後に請求状態を管理します。
                Excel出力は最後に確認資料として使う位置づけです。
            </p>

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <MermaidDiagram
                    chart={constructionBillingFlowChart}
                    title="工事登録から請求管理までの業務フロー"
                    className={diagramClassName}
                />
            </div>
        </section>
    );
}
