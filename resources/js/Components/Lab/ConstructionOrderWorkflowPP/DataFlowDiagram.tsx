const relatedItems = [
    ['現場写真', '写真種別や工程と結びつけて管理します。'],
    ['工程情報', '完了、検収、請求準備などの状態を持ちます。'],
    ['請求書情報', 'テンプレート、出力形式、請求先をまとめます。'],
    ['履歴情報', '確認や変更の記録を残します。'],
];

export default function DataFlowDiagram() {
    return (
        <section className="rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Data Flow
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">情報のつながり</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200/80">
                Excel発注データをCSVで受け取り、発注情報を中心にして周辺情報を紐づける考え方です。
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)_minmax(0,1fr)] lg:items-center">
                <div className="grid gap-3">
                    <article className="rounded-lg border border-emerald-200/30 bg-emerald-200/10 p-4 text-emerald-50">
                        <h3 className="font-semibold">Excel発注データ</h3>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                            まずは慣れたExcelで発注情報を作ります。
                        </p>
                    </article>
                    <p className="text-center text-lg font-bold text-cyan-100">↓</p>
                    <article className="rounded-lg border border-amber-200/30 bg-amber-200/10 p-4 text-amber-50">
                        <h3 className="font-semibold">CSVファイル</h3>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                            システムへ渡すための中間ファイルです。
                        </p>
                    </article>
                </div>

                <article className="rounded-lg border border-cyan-100/45 bg-cyan-100/16 p-5 text-center text-cyan-50 shadow-[0_18px_42px_rgba(8,145,178,0.18)]">
                    <p className="text-sm font-semibold opacity-80">中心</p>
                    <h3 className="mt-2 text-2xl font-semibold">発注情報</h3>
                    <p className="mt-3 text-sm leading-6 opacity-85">
                        現場、取引先、明細、担当者をまとめる土台です。
                    </p>
                </article>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {relatedItems.map(([title, detail]) => (
                        <article
                            key={title}
                            className="rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                        >
                            <h3 className="font-semibold">{title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-200/78">
                                {detail}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
