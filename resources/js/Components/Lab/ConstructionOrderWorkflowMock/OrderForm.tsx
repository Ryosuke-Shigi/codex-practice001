import type { FormEvent } from 'react';
import type { OrderDraft } from './mockData';

type OrderFormProps = {
    orderDraft: OrderDraft;
    registrationPreviewed: boolean;
    onPreview: () => void;
    onUpdate: (field: keyof OrderDraft, value: string) => void;
};

const inputClassName =
    'min-h-11 w-full rounded-lg border border-white/15 bg-slate-950/55 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-100 focus:ring-2 focus:ring-cyan-100/30';

export default function OrderForm({
    orderDraft,
    registrationPreviewed,
    onPreview,
    onUpdate,
}: OrderFormProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onPreview();
    };

    return (
        <section className="rounded-lg border border-white/15 bg-slate-950/70 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.2)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">発注登録Form</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-200/78">
                        入力内容は画面内の仮表示だけに反映します。実保存、DB接続、CSV取込は行いません。
                    </p>
                </div>
                <span className="rounded-md border border-amber-200/35 bg-amber-200/12 px-2.5 py-1 text-xs font-semibold text-amber-50">
                    保存処理なし
                </span>
            </div>

            <form
                className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
                onSubmit={handleSubmit}
            >
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                    現場名
                    <input
                        className={inputClassName}
                        value={orderDraft.siteName}
                        onChange={(event) => onUpdate('siteName', event.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                    取引先
                    <input
                        className={inputClassName}
                        value={orderDraft.partner}
                        onChange={(event) => onUpdate('partner', event.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                    発注日
                    <input
                        className={inputClassName}
                        type="date"
                        value={orderDraft.orderDate}
                        onChange={(event) => onUpdate('orderDate', event.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                    担当者
                    <input
                        className={inputClassName}
                        value={orderDraft.owner}
                        onChange={(event) => onUpdate('owner', event.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100 md:col-span-2 xl:col-span-3">
                    備考
                    <textarea
                        className={`${inputClassName} min-h-24 resize-none`}
                        value={orderDraft.note}
                        onChange={(event) => onUpdate('note', event.target.value)}
                    />
                </label>
                <div className="flex flex-col justify-end gap-2">
                    <button
                        type="submit"
                        className="min-h-11 rounded-lg bg-cyan-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                    >
                        登録プレビュー
                    </button>
                    <p className="min-h-5 text-xs text-slate-300">
                        {registrationPreviewed
                            ? '画面内で登録済み風に表示中'
                            : 'クリックしても保存されません'}
                    </p>
                </div>
            </form>
        </section>
    );
}
