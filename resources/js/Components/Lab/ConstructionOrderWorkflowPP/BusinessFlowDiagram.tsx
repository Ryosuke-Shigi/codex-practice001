/**
 * 工事発注 idea-board の業務フロー図 Component です。
 *
 * 非エンジニア向け説明の静的図であり、実際の workflow state や DB 状態とは接続しません。
 */
const businessFlowSteps = [
    ['Excelで入力', '発注情報をいつものExcelで作ります。'],
    ['CSVで受け渡し', 'システムに渡せる形で出力します。'],
    ['システムへ取込', '発注内容の確認画面へつなげます。'],
    ['発注内容を確認', '現場名、取引先、明細、担当者を確認します。'],
    ['現場写真を登録', '工程や写真種別ごとにまとめます。'],
    ['工程を更新', '完了、検収、請求準備などを見える化します。'],
    ['テンプレート選択', '取引先や用途に合う請求書の形を選びます。'],
    ['Excel / PDF 出力', '提出用の書類として出力する想定です。'],
    ['履歴を確認', 'いつ誰が更新したかを後から追えるようにします。'],
];

export default function BusinessFlowDiagram() {
    return (
        <section className="rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Business Flow
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">業務フロー</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200/80">
                Excelで作った発注情報を入口にして、写真、工程、請求、履歴までを同じ流れで追えるようにします。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {businessFlowSteps.map(([title, detail], index) => (
                    <article
                        key={title}
                        className="relative rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                    >
                        <div className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-100/55 bg-cyan-100/14 text-sm font-bold text-cyan-50">
                                {index + 1}
                            </span>
                            <div>
                                <h3 className="font-semibold">{title}</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-200/78">
                                    {detail}
                                </p>
                            </div>
                        </div>
                        {index < businessFlowSteps.length - 1 && (
                            <p className="mt-3 text-xs font-semibold text-cyan-100/70 md:text-right">
                                次へ →
                            </p>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}
