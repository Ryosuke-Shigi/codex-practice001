/**
 * 工事発注 idea-board の画面構成説明 section Component です。
 *
 * 画面案の説明だけを担当し、実 route / Controller / 保存処理の追加は行いません。
 */
import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import { screenFlowChart, screenMocks } from './constructionBillingPresentationData';

const diagramClassName =
    'mt-5 [&_svg]:mx-auto [&_svg]:!w-[min(100%,720px)] [&_svg]:!max-w-full';

export default function ConstructionBillingScreenSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Screens
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                画面イメージ
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                スマートフォン縦で読める案件一覧、作業カード一覧、請求一覧を優先し、タブレット・PCではグラフと一覧の俯瞰性を高める構想です。
                ここで表示するのは説明用UIであり、本体画面のルートは追加しません。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-4">
                {screenMocks.map((screen) => (
                    <article
                        key={screen.title}
                        className="min-w-0 rounded-lg border border-white/14 bg-slate-950/42 p-4 text-white"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                            {screen.device}
                        </p>
                        <h3 className="mt-2 text-base font-semibold">{screen.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200/78">
                            {screen.detail}
                        </p>
                        <div className="mt-4 rounded-lg border border-white/12 bg-white/8 p-3">
                            <div className="mb-3 h-2 w-16 rounded-full bg-cyan-100/35" />
                            <div className="grid gap-2">
                                {screen.rows.map((row) => (
                                    <div
                                        key={row}
                                        className="rounded-md border border-white/12 bg-slate-950/35 px-3 py-2 text-sm text-slate-100"
                                    >
                                        {row}
                                    </div>
                                ))}
                            </div>
                        </div>
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
