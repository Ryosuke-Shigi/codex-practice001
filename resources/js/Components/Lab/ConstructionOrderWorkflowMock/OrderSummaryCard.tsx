import type { OrderDraft } from './mockData';
import { formatCurrency } from './mockData';

type OrderSummaryCardProps = {
    orderDraft: OrderDraft;
    grandTotal: number;
};

export default function OrderSummaryCard({
    orderDraft,
    grandTotal,
}: OrderSummaryCardProps) {
    return (
        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
            <h2 className="text-xl font-semibold text-white">基本情報カード</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
                {[
                    ['現場名', orderDraft.siteName],
                    ['取引先', orderDraft.partner],
                    ['発注日', orderDraft.orderDate],
                    ['担当者', orderDraft.owner],
                    ['発注番号', 'CO-2026-0516-008'],
                    ['金額合計', formatCurrency(grandTotal)],
                ].map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-lg border border-white/10 bg-white/6 p-3"
                    >
                        <dt className="text-xs text-slate-300">{label}</dt>
                        <dd className="mt-1 break-words font-semibold text-white">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </article>
    );
}
