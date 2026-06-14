import type { Project } from './mockData';
import { cardKindLabels, cardKindStyles } from './mockData';

type ProjectProgressPanelProps = {
    project: Project;
};

const progressLabels = [
    '未完了',
    '完了',
    '後日対応',
    '問題対応',
    '請求対象',
    '領収対象',
];

export default function ProjectProgressPanel({
    project,
}: ProjectProgressPanelProps) {
    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    PROJECT PROGRESS
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">
                    案件進行
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                    案件全体ステータスとカードごとの状態を確認します。状態遷移の本実装はしません。
                </p>

                <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-sky-900">
                        案件全体ステータス
                    </p>
                    <p className="mt-1 text-lg font-bold text-sky-950">
                        {project.progressStatus}
                    </p>
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {progressLabels.map((label) => (
                    <span
                        key={label}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm"
                    >
                        {label}
                    </span>
                ))}
            </div>

            <div className="grid gap-3">
                {project.cards.map((card) => {
                    const styles = cardKindStyles[card.kind];

                    return (
                        <article
                            key={card.id}
                            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <span
                                        className={`rounded-md border px-2.5 py-1 text-xs font-bold ${styles.badge}`}
                                    >
                                        {cardKindLabels[card.kind]}
                                    </span>
                                    <h4 className="mt-3 break-words text-base font-bold text-slate-950">
                                        {card.title}
                                    </h4>
                                </div>
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                                    {card.status}
                                </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <ProgressFlag label={card.billingTarget} enabled />
                                <ProgressFlag label={card.receiptTarget} enabled />
                                <ProgressFlag label="後日対応" enabled={card.followUp} />
                                <ProgressFlag label="問題対応" enabled={card.issue} />
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function ProgressFlag({
    label,
    enabled,
}: {
    label: string;
    enabled: boolean;
}) {
    return (
        <span
            className={[
                'rounded-md border px-2.5 py-1 text-xs font-bold',
                enabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-500',
            ].join(' ')}
        >
            {label}
        </span>
    );
}
