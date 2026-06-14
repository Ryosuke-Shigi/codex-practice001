/**
 * 工事発注 idea-board の請求・領収・完了フロー section Component です。
 *
 * Mermaid 図で構想を表示するだけにし、帳票生成や入金処理には接続しません。
 */
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import { billingLifecycleFlowChart } from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,760px)] [&_svg]:!max-w-full';

export default function ConstructionBillingBillingLifecycleSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Billing Flow
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                請求・領収・案件完了までの流れ
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                請求書は作業完了後、領収書は入金確認後に進む流れとして分けます。
                請求書作成と領収書発行を同じタイミングの作業として扱わないことを、図で確認できるようにします。
            </p>

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <MermaidDiagram
                    chart={billingLifecycleFlowChart}
                    title="案件登録から領収書発行・案件完了まで"
                    className={diagramClassName}
                />
            </div>
        </section>
    );
}
