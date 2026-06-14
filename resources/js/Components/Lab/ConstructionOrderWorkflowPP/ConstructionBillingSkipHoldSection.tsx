/**
 * 工事発注 idea-board のSKIP / 保留理由モーダル section Component です。
 *
 * モーダルの画面イメージを固定データで表示し、API通信やDB保存は行いません。
 */
import { skipHoldPlans } from './constructionBillingPresentationData';

function modalClassName(title: string) {
    if (title.includes('SKIP')) {
        return 'border-violet-200/35 bg-violet-200/10 text-violet-50';
    }

    return 'border-rose-200/35 bg-rose-200/10 text-rose-50';
}

export default function ConstructionBillingSkipHoldSection() {
    return (
        <section className="min-w-0 rounded-lg border border-white/18 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                Reason Modal
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
                SKIP / 保留理由モーダル
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-200/80">
                SKIPと保留は、どちらも理由入力を必須にする画面イメージです。
                SKIPは理由付きの終端状態、保留は後で対応するための非終端状態として分けて見せます。
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {skipHoldPlans.map((plan) => (
                    <article
                        key={plan.title}
                        className={`min-w-0 rounded-lg border p-4 ${modalClassName(plan.title)}`}
                    >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-lg font-semibold">{plan.title}</h3>
                            <span className="inline-flex w-fit rounded-md border border-current/30 bg-slate-950/25 px-2.5 py-1 text-xs font-semibold">
                                {plan.badge}
                            </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 opacity-88">{plan.detail}</p>

                        <div className="mt-4 rounded-lg border border-white/16 bg-slate-950/35 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                                入力欄イメージ
                            </p>
                            <div className="mt-3 grid gap-2">
                                {plan.fields.map((field) => (
                                    <div
                                        key={field}
                                        className="rounded-md border border-white/12 bg-white/8 px-3 py-2 text-sm"
                                    >
                                        {field}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 text-sm font-semibold">
                                    キャンセル
                                </span>
                                <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-current/40 bg-white/16 px-3 text-sm font-semibold">
                                    理由を残す
                                </span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
