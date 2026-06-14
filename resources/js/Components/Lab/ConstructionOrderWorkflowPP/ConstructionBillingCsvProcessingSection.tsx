/**
 * 工事発注 idea-board のCSV受付・登録処理構想 section Component です。
 *
 * Mermaid 図と説明カードで構想を見せるだけにし、実際のScheduler / Queue / S3処理とは接続しません。
 */
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import {
    csvProcessingFlowChart,
    csvProcessingSteps,
} from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,760px)] [&_svg]:!max-w-full';

export default function ConstructionBillingCsvProcessingSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                CSV Processing
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                CSV受付・退避・登録処理領域
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                CSV投入先に置かれたファイルを、System側が検知し、原本退避、非同期処理、解析・検証、DB登録、結果管理へ進める構想として見せます。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {csvProcessingSteps.map((step) => (
                    <article
                        key={step.title}
                        className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                    >
                        <h3 className="text-base font-semibold">{step.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200/78">
                            {step.detail}
                        </p>
                    </article>
                ))}
            </div>

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <MermaidDiagram
                    chart={csvProcessingFlowChart}
                    title="CSV受付・退避・非同期登録の構想"
                    className={diagramClassName}
                />
            </div>
        </section>
    );
}
