/**
 * 工事発注 idea-board の作業カード方式 section Component です。
 *
 * 固定データで作業カード例と状態の意味を表示するだけにし、状態変更処理は持ちません。
 */
import { workCardExamples, workCardStatuses } from './constructionBillingPresentationData';

function statusClassName(label: string) {
    if (label === '完了') {
        return 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50';
    }

    if (label === '処理中') {
        return 'border-amber-200/35 bg-amber-200/10 text-amber-50';
    }

    if (label === '保留') {
        return 'border-rose-200/35 bg-rose-200/10 text-rose-50';
    }

    if (label === 'SKIP') {
        return 'border-violet-200/35 bg-violet-200/10 text-violet-50';
    }

    return 'border-slate-200/25 bg-white/8 text-slate-50';
}

export default function ConstructionBillingWorkCardSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Work Cards
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                作業カード方式
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                工事種別を固定せず、案件ごとに必要な作業カードを追加・削除・並び替えできる構想です。
                必要な作業だけを案件に持たせ、状態と理由を追いやすくします。
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <h3 className="text-base font-semibold text-white">作業カード例</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {workCardExamples.map((card, index) => (
                            <span
                                key={card}
                                className="inline-flex min-h-9 items-center rounded-md border border-cyan-100/25 bg-cyan-100/10 px-3 text-sm font-semibold text-cyan-50"
                            >
                                {index + 1}. {card}
                            </span>
                        ))}
                    </div>
                </article>

                <article className="min-w-0 rounded-lg border border-white/14 bg-white/8 p-4">
                    <h3 className="text-base font-semibold text-white">作業カード状態</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        {workCardStatuses.map((status) => (
                            <div
                                key={status.label}
                                className={`min-w-0 rounded-lg border p-3 ${statusClassName(status.label)}`}
                            >
                                <p className="font-semibold">{status.label}</p>
                                <p className="mt-1 text-sm leading-6 opacity-85">
                                    {status.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </article>
            </div>
        </section>
    );
}
