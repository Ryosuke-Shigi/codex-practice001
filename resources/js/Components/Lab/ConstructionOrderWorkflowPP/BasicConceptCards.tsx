const conceptCards = [
    {
        title: 'Formは発注入力の入口',
        detail: '画面から入力した発注情報をDTOへ変換し、System側の発注登録処理へ渡します。',
    },
    {
        title: 'ExcelはCSV入力元',
        detail: '既存ExcelからCSVを出せれば、Form入力と同じ発注登録処理に乗せられます。',
    },
    {
        title: 'Systemは登録と状態管理',
        detail: 'Form入力でもExcel/CSV入力でも同じDTOを受け、発注作成、DB保存、履歴管理を担当します。',
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
                発注登録の入口をFormとExcel/CSVの2つに分け、登録処理と状態管理はSystemへ集約して説明します。
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
