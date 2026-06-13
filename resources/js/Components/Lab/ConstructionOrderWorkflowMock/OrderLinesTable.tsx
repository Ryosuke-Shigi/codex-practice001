/**
 * 工事発注管理・請求システム MOCK の明細テーブル Component です。
 *
 * 仮明細と金額表示だけを扱い、見積/請求の確定処理やDB保存は行いません。
 */
import type { OrderLine } from './mockData';
import { formatCurrency } from './mockData';

type OrderLinesTableProps = {
    orderLines: OrderLine[];
};

export default function OrderLinesTable({ orderLines }: OrderLinesTableProps) {
    return (
        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">発注明細テーブル</h2>
                    <p className="mt-1 text-sm text-slate-200/78">
                        スマホでは明細カード、広い画面では横スクロール可能な表で確認します。
                    </p>
                </div>
                <p className="rounded-md border border-white/15 bg-white/8 px-2.5 py-1 text-xs text-slate-200">
                    仮明細 {orderLines.length} 件
                </p>
            </div>

            <div className="mt-4 grid gap-3 sm:hidden">
                {orderLines.map((line) => (
                    <article
                        key={line.id}
                        className="rounded-lg border border-white/12 bg-white/6 p-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-white">{line.item}</h3>
                                <p className="mt-1 text-sm text-slate-300">{line.spec}</p>
                            </div>
                            <p className="shrink-0 text-right text-sm font-bold text-cyan-50">
                                {formatCurrency(line.quantity * line.unitPrice)}
                            </p>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                            <div>
                                <dt>数量</dt>
                                <dd className="mt-0.5 text-white">{line.quantity}</dd>
                            </div>
                            <div>
                                <dt>単位</dt>
                                <dd className="mt-0.5 text-white">{line.unit}</dd>
                            </div>
                            <div>
                                <dt>単価</dt>
                                <dd className="mt-0.5 text-white">
                                    {formatCurrency(line.unitPrice)}
                                </dd>
                            </div>
                            <div>
                                <dt>税率</dt>
                                <dd className="mt-0.5 text-white">{line.taxRate}</dd>
                            </div>
                        </dl>
                        <p className="mt-3 rounded-md bg-slate-950/45 px-2.5 py-2 text-xs text-slate-200">
                            {line.note}
                        </p>
                    </article>
                ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto sm:block">
                <table className="min-w-[940px] w-full border-separate border-spacing-0 text-left text-sm">
                    <thead className="text-xs text-slate-300">
                        <tr>
                            {[
                                '品名 / 工事項目',
                                '仕様',
                                '数量',
                                '単位',
                                '単価',
                                '税率',
                                '金額',
                                '備考',
                            ].map((heading) => (
                                <th
                                    key={heading}
                                    className="border-b border-white/15 bg-white/8 px-3 py-3 font-semibold"
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orderLines.map((line) => (
                            <tr key={line.id} className="text-slate-100">
                                <td className="border-b border-white/10 px-3 py-3 font-semibold">
                                    {line.item}
                                </td>
                                <td className="border-b border-white/10 px-3 py-3 text-slate-300">
                                    {line.spec}
                                </td>
                                <td className="border-b border-white/10 px-3 py-3">
                                    {line.quantity}
                                </td>
                                <td className="border-b border-white/10 px-3 py-3">
                                    {line.unit}
                                </td>
                                <td className="border-b border-white/10 px-3 py-3">
                                    {formatCurrency(line.unitPrice)}
                                </td>
                                <td className="border-b border-white/10 px-3 py-3">
                                    {line.taxRate}
                                </td>
                                <td className="border-b border-white/10 px-3 py-3 font-bold text-cyan-50">
                                    {formatCurrency(line.quantity * line.unitPrice)}
                                </td>
                                <td className="border-b border-white/10 px-3 py-3 text-slate-300">
                                    {line.note}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </article>
    );
}
