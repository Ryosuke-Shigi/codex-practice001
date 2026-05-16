import type { OrderDraft, OrderLine } from './mockData';
import { formatCurrency } from './mockData';

type InvoicePreviewPanelProps = {
    orderDraft: OrderDraft;
    orderLines: OrderLine[];
    template: string;
    outputFormat: string;
    subtotal: number;
    tax: number;
    grandTotal: number;
};

export default function InvoicePreviewPanel({
    orderDraft,
    orderLines,
    template,
    outputFormat,
    subtotal,
    tax,
    grandTotal,
}: InvoicePreviewPanelProps) {
    return (
        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
            <div className="rounded-lg bg-slate-100 p-4 text-slate-950 shadow-[0_20px_50px_rgba(2,6,23,0.25)] sm:p-6">
                <div className="flex flex-col gap-3 border-b border-slate-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">請求書プレビュー</p>
                        <h2 className="mt-1 text-2xl font-bold">御請求書</h2>
                    </div>
                    <div className="text-sm sm:text-right">
                        <p>形式: {outputFormat}</p>
                        <p>テンプレート: {template}</p>
                        <p>発注番号: CO-2026-0516-008</p>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                        <p className="text-slate-500">請求先</p>
                        <p className="mt-1 font-bold">{orderDraft.partner} 御中</p>
                    </div>
                    <div>
                        <p className="text-slate-500">対象現場</p>
                        <p className="mt-1 font-bold">{orderDraft.siteName}</p>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-[620px] w-full text-left text-sm">
                        <thead>
                            <tr className="border-y border-slate-300 text-slate-500">
                                <th className="py-2 pr-3">明細</th>
                                <th className="py-2 pr-3">数量</th>
                                <th className="py-2 pr-3">単価</th>
                                <th className="py-2 text-right">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderLines.map((line) => (
                                <tr key={line.id} className="border-b border-slate-200">
                                    <td className="py-2 pr-3 font-semibold">{line.item}</td>
                                    <td className="py-2 pr-3">
                                        {line.quantity}
                                        {line.unit}
                                    </td>
                                    <td className="py-2 pr-3">
                                        {formatCurrency(line.unitPrice)}
                                    </td>
                                    <td className="py-2 text-right font-semibold">
                                        {formatCurrency(line.quantity * line.unitPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <dl className="mt-5 ml-auto grid max-w-sm gap-2 text-sm">
                    <div className="flex items-center justify-between">
                        <dt>小計</dt>
                        <dd>{formatCurrency(subtotal)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt>消費税</dt>
                        <dd>{formatCurrency(tax)}</dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-lg font-bold">
                        <dt>合計</dt>
                        <dd>{formatCurrency(grandTotal)}</dd>
                    </div>
                </dl>
            </div>
        </article>
    );
}
