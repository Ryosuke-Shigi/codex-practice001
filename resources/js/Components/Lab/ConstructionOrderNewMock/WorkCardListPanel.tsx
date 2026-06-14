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
        <section className="grid gap-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                <h3 className="text-base font-bold text-slate-950">カード一覧</h3>
                <div className="flex shrink-0 gap-1.5">
                    {['追加', '編集', '削除'].map((label) => (
                        <button
                            key={label}
                            type="button"
                            className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600">
                        <tr>
                            <th className="w-[58%] px-2 py-2">カード</th>
                            <th className="w-[18%] px-2 py-2">状態</th>
                            <th className="w-[24%] px-2 py-2 text-right">金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        {project.cards.map((card) => {
                            const styles = cardKindStyles[card.kind];
                            const flags = [
                                card.followUp ? '後日' : '',
                                card.issue ? '問題' : '',
                            ]
                                .filter(Boolean)
                                .join(' / ');

                            return (
                                <tr
                                    key={card.id}
                                    className="border-t border-slate-200 hover:bg-slate-50"
                                >
                                    <td className="px-2 py-2 align-top">
                                        <span
                                            className={`inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${styles.badge}`}
                                        >
                                            {cardKindLabels[card.kind]}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onOpenCard(card)}
                                            className="mt-1 block w-full text-left font-bold leading-5 text-sky-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                                        >
                                            {card.title}
                                        </button>
                                        <p className="mt-1 leading-4 text-slate-500">
                                            {card.category} / {card.billingTarget} /{' '}
                                            {card.hasMemo ? 'メモあり' : 'メモなし'} /{' '}
                                            {card.hasPhotos ? '写真あり' : '写真なし'} /{' '}
                                            {card.hasFiles ? 'ファイルあり' : 'ファイルなし'}
                                        </p>
                                    </td>
                                    <td className="px-2 py-2 align-top font-semibold leading-5 text-slate-700">
                                        {card.status}
                                        <span className="mt-1 block text-[11px] font-bold text-violet-700">
                                            {flags || '-'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-right align-top font-bold leading-5 text-slate-950">
                                        {card.amount}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
