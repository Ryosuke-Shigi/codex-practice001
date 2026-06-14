import { useState } from 'react';

import type { CardKind, Project, WorkCard } from './mockData';
import { cardKindLabels, cardKindStyles } from './mockData';

type WorkCardListPanelProps = {
    project: Project;
    onOpenCard: (card: WorkCard) => void;
    onAddCard: (kind: CardKind) => void;
};

const cardKindOptions = Object.entries(cardKindLabels) as [CardKind, string][];

export default function WorkCardListPanel({
    project,
    onOpenCard,
    onAddCard,
}: WorkCardListPanelProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddCard = (kind: CardKind) => {
        onAddCard(kind);
        setIsAddModalOpen(false);
    };

    return (
        <section className="grid gap-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">カード一覧</h3>
                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                >
                    追加
                </button>
            </div>

            <div className="grid gap-2">
                {project.cards.map((card) => {
                    const styles = cardKindStyles[card.kind];

                    return (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => onOpenCard(card)}
                            className="grid cursor-pointer gap-2 rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:grid-cols-[minmax(0,1fr)_8rem_6rem]"
                        >
                            <div className="min-w-0">
                                <span
                                    className={`inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${styles.badge}`}
                                >
                                    {cardKindLabels[card.kind]}
                                </span>
                                <h4 className="mt-1 break-words text-sm font-bold leading-5 text-slate-950">
                                    {card.title}
                                </h4>
                                <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                                    {card.summary}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:block">
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
                                    {card.status}
                                </span>
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 sm:mt-1 sm:block">
                                    {card.hasPhotos ? '写真あり' : '写真なし'} /{' '}
                                    {card.hasFiles ? 'ファイルあり' : 'ファイルなし'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block sm:text-right">
                                <span
                                    className={[
                                        'font-bold',
                                        isNegativeAmount(card.amount)
                                            ? 'text-rose-600'
                                            : 'text-slate-950',
                                    ].join(' ')}
                                >
                                    {card.amount}
                                </span>
                                <span className="ml-3 text-xs font-bold text-sky-700 sm:ml-0 sm:mt-2 sm:block">
                                    詳細 &gt;
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-3">
                    <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-950">
                                    カード種類選択
                                </h4>
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                    選んだ種類で入力用カードを追加し、カード一覧へ戻ります。
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                閉じる
                            </button>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {cardKindOptions.map(([kind, label]) => {
                                const styles = cardKindStyles[kind];

                                return (
                                    <button
                                        key={kind}
                                        type="button"
                                        onClick={() => handleAddCard(kind)}
                                        className={`min-h-16 rounded-lg border p-3 text-left font-bold transition hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 ${styles.panel}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function isNegativeAmount(amount: string) {
    return amount.trim().startsWith('-');
}
