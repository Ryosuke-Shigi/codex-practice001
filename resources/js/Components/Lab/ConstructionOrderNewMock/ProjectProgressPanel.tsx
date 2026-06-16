import type { Project } from './mockData';
import { cardKindLabels, formatYen, isNegativeAmount } from './mockData';

type ProjectProgressPanelProps = {
    project: Project;
};

export default function ProjectProgressPanel({
    project,
}: ProjectProgressPanelProps) {
    const completedCards = project.cards.filter(
        (card) => card.status === 'できている',
    ).length;
    const exceptionCards = project.cards.filter(
        (card) => card.kind === 'exception',
    ).length;

    return (
        <section className="grid gap-2">
            <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-950">詳細区分</h3>
                    <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-900">
                        {project.progressStatus}
                    </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {project.workflowStages.map((stage) => (
                        <div
                            key={stage.id}
                            className="grid justify-items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-2"
                        >
                            <span className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700">
                                {stage.status}
                            </span>
                            <p className="text-center text-[11px] font-bold leading-4 text-slate-700">
                                {stage.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <ProgressCount label="完了" value={`${completedCards}枚`} />
                <ProgressCount label="要確認" value={`${project.confirmCount}件`} />
                <ProgressCount label="例外対応" value={`${exceptionCards}枚`} />
            </div>

            <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600">
                        <tr>
                            <th className="w-[48%] px-2 py-2">カード</th>
                            <th className="w-[22%] px-2 py-2">状態</th>
                            <th className="w-[30%] px-2 py-2">帳票反映</th>
                        </tr>
                    </thead>
                    <tbody>
                        {project.cards.map((card) => (
                            <tr key={card.id} className="border-t border-slate-200">
                                <td className="px-2 py-2 align-top font-bold leading-5 text-slate-950">
                                    {card.title}
                                    <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                                        {cardKindLabels[card.kind]}
                                    </span>
                                </td>
                                <td className="px-2 py-2 align-top font-semibold leading-5">
                                    {card.status}
                                    <span
                                        className={[
                                            'mt-1 block text-[11px] font-bold',
                                            isNegativeAmount(card.amount)
                                                ? 'text-rose-600'
                                                : 'text-slate-500',
                                        ].join(' ')}
                                    >
                                        {formatYen(card.amount)}
                                    </span>
                                </td>
                                <td className="px-2 py-2 align-top leading-5">
                                    {card.billingTarget} / {card.receiptTarget}
                                    <span className="mt-1 block text-[11px] font-bold text-slate-500">
                                        {card.documentReflection}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function ProgressCount({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-0.5 text-base font-bold text-slate-950">{value}</p>
        </div>
    );
}
