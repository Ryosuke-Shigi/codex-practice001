import type { Project, WorkCard } from './mockData';
import { cardKindLabels, cardKindStyles } from './mockData';

type WorkCardListPanelProps = {
    project: Project;
    onOpenCard: (card: WorkCard) => void;
};

export default function WorkCardListPanel({
    project,
    onOpenCard,
}: WorkCardListPanelProps) {
    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            CARD QUERY / COMMAND UI
                        </p>
                        <h3 className="mt-2 text-lg font-bold text-slate-950">
                            カード一覧
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                            案件に紐づくカードを表示します。カード追加、編集、削除はUIだけで、Command Actionは実装しません。
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
                        {['カード追加', '編集', '削除'].map((label) => (
                            <button
                                key={label}
                                type="button"
                                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                {project.cards.map((card) => {
                    const styles = cardKindStyles[card.kind];

                    return (
                        <article
                            key={card.id}
                            className={`grid gap-3 rounded-lg border p-4 shadow-sm ${styles.panel}`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <span
                                        className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${styles.badge}`}
                                    >
                                        {cardKindLabels[card.kind]}
                                    </span>
                                    <h4 className="mt-3 break-words text-base font-bold text-slate-950">
                                        {card.title}
                                    </h4>
                                </div>
                                <span className="rounded-md border border-white/80 bg-white/70 px-2.5 py-1 text-xs font-bold text-slate-800">
                                    {card.status}
                                </span>
                            </div>

                            <p className="text-sm leading-6 text-slate-700">
                                {card.summary}
                            </p>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <CardMeta label="金額" value={card.amount} />
                                <CardMeta label="分類" value={card.category} />
                                <CardMeta label="メモ" value={card.hasMemo ? 'あり' : 'なし'} />
                                <CardMeta label="写真" value={card.hasPhotos ? 'あり' : 'なし'} />
                                <CardMeta label="ファイル" value={card.hasFiles ? 'あり' : 'なし'} />
                                <CardMeta label="請求" value={card.billingTarget} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {card.followUp && (
                                    <span className="rounded-md border border-cyan-300 bg-white/70 px-2.5 py-1 text-xs font-bold text-cyan-950">
                                        後日対応フラグ
                                    </span>
                                )}
                                {card.issue && (
                                    <span className="rounded-md border border-violet-300 bg-white/70 px-2.5 py-1 text-xs font-bold text-violet-950">
                                        問題対応フラグ
                                    </span>
                                )}
                                <span className="rounded-md border border-slate-300 bg-white/70 px-2.5 py-1 text-xs font-bold text-slate-800">
                                    {card.receiptTarget}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => onOpenCard(card)}
                                className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                            >
                                カード詳細へ
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function CardMeta({ label, value }: { label: string; value: string }) {
    return (
        <span className="grid gap-1 rounded-lg border border-white/80 bg-white/70 px-3 py-2">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span className="text-sm font-bold text-slate-900">{value}</span>
        </span>
    );
}
