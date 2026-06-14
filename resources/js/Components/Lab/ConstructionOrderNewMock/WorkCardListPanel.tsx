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
        <section className="grid max-h-[calc(100vh-16rem)] gap-3 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <h3 className="text-lg font-bold text-slate-950">カード一覧</h3>
                <div className="flex gap-2 overflow-x-auto">
                    {['追加', '編集', '削除'].map((label) => (
                        <button
                            key={label}
                            type="button"
                            className="min-h-9 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600">
                        <tr>
                            <th className="px-3 py-2">種別</th>
                            <th className="px-3 py-2">タイトル</th>
                            <th className="px-3 py-2">状態</th>
                            <th className="px-3 py-2">金額</th>
                            <th className="px-3 py-2">分類</th>
                            <th className="px-3 py-2">メモ</th>
                            <th className="px-3 py-2">写真</th>
                            <th className="px-3 py-2">ファイル</th>
                            <th className="px-3 py-2">請求</th>
                            <th className="px-3 py-2">フラグ</th>
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
                                    <td className="whitespace-nowrap px-3 py-2">
                                        <span
                                            className={`rounded-md border px-2 py-1 text-xs font-bold ${styles.badge}`}
                                        >
                                            {cardKindLabels[card.kind]}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            onClick={() => onOpenCard(card)}
                                            className="text-left font-bold text-sky-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                                        >
                                            {card.title}
                                        </button>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                                        {card.status}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-950">
                                        {card.amount}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2">{card.category}</td>
                                    <td className="whitespace-nowrap px-3 py-2">{card.hasMemo ? 'あり' : 'なし'}</td>
                                    <td className="whitespace-nowrap px-3 py-2">{card.hasPhotos ? 'あり' : 'なし'}</td>
                                    <td className="whitespace-nowrap px-3 py-2">{card.hasFiles ? 'あり' : 'なし'}</td>
                                    <td className="whitespace-nowrap px-3 py-2">{card.billingTarget}</td>
                                    <td className="whitespace-nowrap px-3 py-2">{flags || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
