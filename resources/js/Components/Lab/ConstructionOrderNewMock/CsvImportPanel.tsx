import type { CsvStatus } from './mockData';
import { csvFiles } from './mockData';

type CsvImportPanelProps = {
    onNext: () => void;
};

const statusClassNames: Record<CsvStatus, string> = {
    投入待ち: 'border-slate-300 bg-slate-50 text-slate-700',
    受付済み: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    エラー: 'border-rose-300 bg-rose-50 text-rose-900',
};

export default function CsvImportPanel({ onNext }: CsvImportPanelProps) {
    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                <h2 className="text-base font-bold text-slate-950">
                    CSV一括取り込み
                </h2>
                <button
                    type="button"
                    onClick={onNext}
                    className="h-8 rounded-md bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                >
                    案件一覧へ
                </button>
            </div>

            {/* This is the only vertical scroll area in the CSV screen. */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="grid gap-3">
                    <div className="grid min-h-28 place-items-center rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 p-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <p className="text-sm font-bold text-sky-950">
                                ドラッグ＆ドロップ
                            </p>
                        <button
                            type="button"
                                className="h-8 rounded-md border border-sky-500 bg-white px-3 text-xs font-bold text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                        >
                            複数CSVを選択
                        </button>
                    </div>
                </div>

                <div className="grid gap-2">
                {csvFiles.map((file) => (
                    <article
                        key={file.id}
                            className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                    <h3 className="break-words text-sm font-bold text-slate-950">
                                    {file.fileName}
                                </h3>
                                    <p className="mt-1 text-xs text-slate-600">
                                    {file.size} / {file.rowCount}
                                </p>
                            </div>
                            <span
                                className={`rounded-md border px-2.5 py-1 text-xs font-bold ${statusClassNames[file.status]}`}
                            >
                                {file.status}
                            </span>
                        </div>
                            <p className="mt-2 text-xs leading-5 text-slate-600">
                            {file.memo}
                        </p>
                    </article>
                ))}
                </div>
            </div>
            </div>
        </section>
    );
}
