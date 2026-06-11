import type { DanceShortsAnalyzerComparisonTable } from './AnalyzeField';

type AnalyzeDeltaTableFieldProps = {
    table: DanceShortsAnalyzerComparisonTable;
};

export default function AnalyzeDeltaTableField({
    table,
}: AnalyzeDeltaTableFieldProps) {
    return (
        <section className="min-w-0">
            <h3 className="mb-1 text-xs font-bold text-white">
                増加量
            </h3>
            <div className="rounded-lg border border-white/14 bg-slate-950/50">
                <table className="w-full table-fixed border-collapse text-left text-[9px] text-slate-100 sm:text-[10px]">
                    <colgroup>
                        <col className="w-[30%]" />
                        {table.columns.map((column) => (
                            <col key={column.video_id} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-1 py-1 font-bold leading-[1.1]">区間</th>
                            {table.columns.map((column) => (
                                <th
                                    key={column.video_id}
                                    className="px-1 py-1 text-center align-top font-bold leading-[1.1]"
                                >
                                    <span className="line-clamp-2 break-words">
                                        {column.title}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row) => (
                            <tr
                                key={row.row_id}
                                className="border-b border-white/8 last:border-b-0"
                            >
                                <td className="break-words px-1 py-1 align-top font-semibold leading-[1.1] text-slate-200/84">
                                    {row.period_label}
                                </td>
                                {row.cells.map((cell) => (
                                    <td
                                        key={cell.video_id}
                                        className="break-words px-1 py-1 text-center align-top font-semibold leading-[1.1]"
                                    >
                                        {cell.value_label}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
