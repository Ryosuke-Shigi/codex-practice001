const detailCards = [
    ['発注情報', '現場名、取引先、明細、担当者を確認します。'],
    ['画像管理', '現場写真をまとめて見られるようにします。'],
    ['工程管理', 'どこまで進んだかを一目で確認します。'],
    ['請求管理', '請求書の種類やテンプレートを選びます。'],
    ['履歴確認', '更新の流れを後から確認します。'],
];

export default function ScreenFlowDiagram() {
    return (
        <section className="rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Screen Flow
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">画面遷移のイメージ</h2>

            <div className="mt-5 grid gap-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                    <article className="rounded-lg border border-emerald-200/30 bg-emerald-200/10 p-4 text-emerald-50">
                        <p className="text-sm font-semibold opacity-75">入口</p>
                        <h3 className="mt-1 text-xl font-semibold">工事一覧</h3>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                            案件を探して、確認したい発注へ進みます。
                        </p>
                    </article>
                    <p className="text-center text-xl font-bold text-cyan-100">→</p>
                    <article className="rounded-lg border border-cyan-200/35 bg-cyan-200/12 p-4 text-cyan-50">
                        <p className="text-sm font-semibold opacity-75">中心</p>
                        <h3 className="mt-1 text-xl font-semibold">発注詳細</h3>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                            発注に関係する情報をまとめて確認します。
                        </p>
                    </article>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    {detailCards.map(([title, detail]) => (
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
