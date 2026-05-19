const conceptCards = [
    {
        title: 'Formは入力と操作',
        detail: '工事登録、発注入力、請求入力、フィルタ、状態検索、詳細確認を画面側で扱います。',
    },
    {
        title: 'Excelは確認と出力',
        detail: '工事一覧、業者別発注一覧、月別請求一覧など、現場が確認しやすい帳票として残します。',
    },
    {
        title: 'Systemは状態管理',
        detail: '工事、発注、請求のステータス、DB保存、検索条件、履歴、業務ルールを担当します。',
    },
    {
        title: 'ADRで責務を分ける',
        detail: 'Controller、Action、Service、Repository、DTO、Responder、Componentの責務を混ぜずに作る前提です。',
    },
];

export default function BasicConceptCards() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Concept
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                基本コンセプト
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200/80">
                工事、発注、請求の流れを、入力、帳票確認、状態管理、責務分離の4つに分けて説明します。
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {conceptCards.map((card) => (
                    <article
                        key={card.title}
                        className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4 text-white"
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
