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
        <section className="grid max-h-[calc(100vh-16rem)] gap-3 overflow-y-auto">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-950">案件進行</h3>
                    <span className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-900">
                        {project.progressStatus}
                    </span>
                </div>

                {/* UI-only progress graph; mobile uses a vertical stepper to avoid clipping. */}
                <div className="mt-4 grid gap-0 sm:hidden">
                    {progressStages.map((stage, index) => {
                        const isDone = index < activeStageIndex;
                        const isActive = index === activeStageIndex;

                        return (
                            <div
                                key={stage}
                                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
                            >
                                <div className="flex flex-col items-center">
                                    <span
                                        className={[
                                            'grid h-8 w-8 place-items-center rounded-full border text-xs font-bold',
                                            getStageMarkerClass(isDone, isActive),
                                        ].join(' ')}
                                    >
                                        {index + 1}
                                    </span>
                                    {index < progressStages.length - 1 && (
                                        <span
                                            className={[
                                                'h-6 w-0.5',
                                                index < activeStageIndex
                                                    ? 'bg-emerald-500'
                                                    : 'bg-slate-200',
                                            ].join(' ')}
                                        />
                                    )}
                                </div>
                                <p className="min-w-0 pt-1 text-sm font-bold leading-6 text-slate-700">
                                    {stage}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 hidden sm:grid sm:grid-cols-6 sm:items-start sm:gap-2">
                    {progressStages.map((stage, index) => {
                        const isDone = index < activeStageIndex;
                        const isActive = index === activeStageIndex;

                        return (
                            <div key={stage} className="grid min-w-0 gap-2">
                                <div className="flex min-w-0 items-center">
                                    <span
                                        className={[
                                            'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold',
                                            getStageMarkerClass(isDone, isActive),
                                        ].join(' ')}
                                    >
                                        {index + 1}
                                    </span>
                                    {index < progressStages.length - 1 && (
                                        <span
                                            className={[
                                                'ml-2 h-1 min-w-0 flex-1 rounded-full',
                                                index < activeStageIndex
                                                    ? 'bg-emerald-500'
                                                    : 'bg-slate-200',
                                            ].join(' ')}
                                        />
                                    )}
                                </div>
                                <p className="whitespace-nowrap text-xs font-bold text-slate-700">
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

            <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="bg-slate-100 text-xs font-bold text-slate-600">
                        <tr>
                            <th className="px-3 py-2">カード</th>
                            <th className="px-3 py-2">種別</th>
                            <th className="px-3 py-2">状態</th>
                            <th className="px-3 py-2">請求</th>
                            <th className="px-3 py-2">領収</th>
                            <th className="px-3 py-2">対応</th>
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
                                    <td className="px-3 py-2 font-bold text-slate-950">
                                        {card.title}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        {cardKindLabels[card.kind]}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 font-semibold">
                                        {card.status}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        {card.billingTarget}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        {card.receiptTarget}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        {actionFlags || '-'}
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
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
        </div>
    );
}
