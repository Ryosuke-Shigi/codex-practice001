const conceptCards = [
    {
        title: 'Excelを入口にする',
        detail: '今ある発注Excelの運用を活かし、CSVでシステムへつなげる考え方です。',
    },
    {
        title: '発注情報を中心にする',
        detail: '現場名、取引先、明細、担当者を一つの発注情報として確認します。',
    },
    {
        title: '写真・工程・請求をつなぐ',
        detail: '現場写真、工程ステータス、請求書作成を同じ発注の流れで追えるようにします。',
    },
    {
        title: '後から確認できる',
        detail: '更新履歴を残し、いつ何を確認したかを振り返れる状態を目指します。',
    },
];

export default function BasicConceptCards() {
    return (
        <section className="rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Concept
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                基本コンセプト
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200/80">
                発注情報を起点に、現場写真、工程、請求、履歴をひと続きで確認できる画面構想です。
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {conceptCards.map((card) => (
                    <article
                        key={card.title}
                        className="rounded-lg border border-white/14 bg-white/8 p-4 text-white"
                    >
                        <h3 className="font-semibold">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200/78">
                            {card.detail}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
