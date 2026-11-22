import { useId } from 'react';
import type { DanceShortsAnalyzerComparisonTable } from './AnalyzeField';

type ComparisonTableProps = {
    table: DanceShortsAnalyzerComparisonTable;
    title: string;
};

/** 終了時刻を揃え、Responderの各動画の実区間と計算済みラベルを表示します。 */
export default function AnalyzeComparisonTableField({ table, title }: ComparisonTableProps) {
    const id = useId();

    return (
        <section aria-label={title} className="min-w-0 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <h3 className="mb-3 text-sm font-bold text-white">
                {title} <span className="font-normal text-slate-300">· {table.metric_label}</span>
            </h3>
            {table.rows.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-600 p-3 text-sm leading-6 text-slate-300">
                    比較できるsnapshot区間がありません。観測点が1つの場合も、グラフには点を表示します。
                </p>
            ) : (
                <>
                    <div className="hidden overflow-x-auto [@media(min-width:768px)_and_(min-height:600px)]:block"
                        tabIndex={0} aria-label={`${title}の比較表（横にスクロールできます）`}>
                        <table style={{ minWidth: 128 + table.columns.length * 100 }} className="w-full table-fixed border-collapse text-sm text-slate-100">
                            <caption className="sr-only">{title}・{table.metric_label}。終了時刻ごとの動画比較</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className="sticky left-0 z-10 w-32 bg-slate-900 p-2 text-left">終了時刻</th>
                                    {table.columns.map((column) => (
                                        <th id={`${id}-video-${column.video_id}`} scope="col" key={column.video_id} className="p-2 text-left align-top">
                                            <span className="font-black" style={{ color: column.chart_color }}>{column.comparison_number}.</span>{' '}
                                            <span className="break-words font-semibold">{column.title}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table.rows.map((row) => (
                                    <tr key={row.row_id} className="border-t border-slate-700">
                                        <th id={`${id}-period-${row.row_id}`} scope="row" className="sticky left-0 z-10 break-words bg-slate-900 p-2 text-left text-xs font-normal text-slate-300">
                                            {row.current_collected_at_label}
                                        </th>
                                        {table.columns.map((column) => {
                                            const cell = row.cells.find((value) => value.video_id === column.video_id);
                                            return (
                                                <td key={column.video_id} headers={`${id}-period-${row.row_id} ${id}-video-${column.video_id}`} className="p-2 text-right align-top tabular-nums">
                                                    <strong>{cell?.value_label ?? '-'}</strong>
                                                    <p className="mt-2 break-words text-left text-xs font-normal leading-5 text-slate-300">{cell?.period_label ?? '比較区間なし'}</p>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="space-y-4 [@media(min-width:768px)_and_(min-height:600px)]:hidden">
                        {table.rows.map((row) => (
                            <div key={row.row_id} className="rounded-md border border-slate-700 bg-slate-950 p-3">
                                <h4 className="mb-1 break-words text-xs font-semibold leading-5 text-slate-300">終了時刻 {row.current_collected_at_label}</h4>
                                <dl className="divide-y divide-slate-800">
                                    {table.columns.map((column) => {
                                        const cell = row.cells.find((value) => value.video_id === column.video_id);
                                        return (
                                            <div key={column.video_id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(5.5rem,max-content)] gap-x-3 gap-y-2 py-3">
                                                <dt className="min-w-0 break-words text-sm leading-5 text-slate-100">
                                                    <span className="font-black" style={{ color: column.chart_color }}>{column.comparison_number}.</span> {column.title}
                                                </dt>
                                                <dd className="self-start whitespace-nowrap text-right text-sm font-bold tabular-nums text-white">{cell?.value_label ?? '-'}</dd>
                                                <dd className="col-span-2 break-words text-xs leading-5 text-slate-300">区間 {cell?.period_label ?? '比較区間なし'}</dd>
                                            </div>
                                        );
                                    })}
                                </dl>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
