import type { Project } from './mockData';
import { cardKindLabels } from './mockData';

type ProjectProgressPanelProps = {
    project: Project;
};

const progressStages = [
    '案件登録',
    'CSV受付',
    'カード確認',
    '現場確認',
    '帳票確認',
    '完了',
];

export default function ProjectProgressPanel({
    project,
}: ProjectProgressPanelProps) {
    const completedCards = project.cards.filter((card) => card.status === '完了').length;
    const issueCards = project.cards.filter((card) => card.issue).length;
    const followUpCards = project.cards.filter((card) => card.followUp).length;
    const activeStageIndex = project.invoiceStatus === '請求書未確定' ? 4 : 3;

    return (
        <section className="grid gap-2">
            <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-950">案件進行</h3>
                    <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-900">
                        {project.progressStatus}
                    </span>
                </div>

                {/* UI-only progress graph; compact wrapping avoids horizontal scrolling. */}
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {progressStages.map((stage, index) => {
                        const isDone = index < activeStageIndex;
                        const isActive = index === activeStageIndex;

                        return (
                            <div
                                key={stage}
                                className="grid justify-items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-2"
                            >
                                <span
                                    className={[
                                        'grid h-7 w-7 place-items-center rounded-full border text-[11px] font-bold',
                                        getStageMarkerClass(isDone, isActive),
                                    ].join(' ')}
                                >
                                    {index + 1}
                                </span>
                                <p className="text-center text-[11px] font-bold leading-4 text-slate-700">
                                    {stage}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <ProgressCount label="完了" value={`${completedCards}枚`} />
                <ProgressCount label="問題" value={`${issueCards}枚`} />
                <ProgressCount label="後日" value={`${followUpCards}枚`} />
            </div>

            <div className="rounded-md border border-slate-200 bg-white shadow-sm">
                <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600">
                        <tr>
                            <th className="w-[52%] px-2 py-2">カード</th>
                            <th className="w-[20%] px-2 py-2">状態</th>
                            <th className="w-[28%] px-2 py-2">対象</th>
                        </tr>
                    </thead>
                    <tbody>
                        {project.cards.map((card) => {
                            const actionFlags = [
                                card.followUp ? '後日対応' : '',
                                card.issue ? '問題対応' : '',
                            ]
                                .filter(Boolean)
                                .join(' / ');

                            return (
                                <tr key={card.id} className="border-t border-slate-200">
                                    <td className="px-2 py-2 align-top font-bold leading-5 text-slate-950">
                                        {card.title}
                                        <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                                            {cardKindLabels[card.kind]}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 align-top font-semibold leading-5">
                                        {card.status}
                                    </td>
                                    <td className="px-2 py-2 align-top leading-5">
                                        {card.billingTarget} / {card.receiptTarget}
                                        <span className="mt-1 block text-[11px] font-bold text-violet-700">
                                            {actionFlags || '-'}
                                        </span>
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

function getStageMarkerClass(isDone: boolean, isActive: boolean) {
    if (isDone) {
        return 'border-emerald-500 bg-emerald-600 text-white';
    }

    if (isActive) {
        return 'border-sky-600 bg-sky-700 text-white';
    }

    return 'border-slate-300 bg-slate-100 text-slate-500';
}

function ProgressCount({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-0.5 text-base font-bold text-slate-950">{value}</p>
        </div>
    );
}
