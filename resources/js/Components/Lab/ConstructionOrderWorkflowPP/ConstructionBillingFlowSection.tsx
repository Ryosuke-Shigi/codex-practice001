/**
 * 工事発注 idea-board の処理フロー説明 section Component です。
 *
 * Mermaid 図で構想を見せるだけにし、実際の Action / Service 実装とは接続しません。
 */
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
                発注登録から工事・請求管理までの流れ
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                Form入力でもExcelから出したCSVでも、発注登録DTOへ変換した後は同じ登録処理を通ります。
                発注登録後にDB保存し、工事状態、発注状態、請求状態をSystem側で管理します。
            </p>

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <MermaidDiagram
                    chart={constructionBillingFlowChart}
                    title="発注登録から工事・請求管理までの業務フロー"
                    className={diagramClassName}
                />
            </div>
        </section>
    );
}
