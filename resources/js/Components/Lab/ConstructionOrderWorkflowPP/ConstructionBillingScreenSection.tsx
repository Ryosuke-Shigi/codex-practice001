import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import { screenCards, screenFlowChart } from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,720px)] [&_svg]:!max-w-full';

export default function ConstructionBillingScreenSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Screens
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                用途ごとに画面を分ける
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                一画面に全部を詰め込まず、CSV取込確認、発注詳細、工事詳細、請求状態確認を分けます。
                Excelを出力先として中心に置くのではなく、CSV入力から登録処理へつなぐ入口として見せます。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {screenCards.map((screen) => (
                    <article
                        key={screen.title}
                        className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                    >
                        <h3 className="text-base font-semibold">{screen.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200/78">
                            {screen.detail}
                        </p>
                    </article>
                ))}
            </div>

            <div className="mt-5 min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                <MermaidDiagram
                    chart={screenFlowChart}
                    title="用途ごとに画面を分ける構成"
                    className={diagramClassName}
                />
            </div>
        </section>
    );
}
