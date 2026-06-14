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
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        CSV ENTRY
                    </p>
                    <h2 className="text-xl font-bold text-slate-950">
                        CSV一括取り込み
                    </h2>
                    <p className="text-sm leading-7 text-slate-600">
                        実CSV取込は行いません。複数CSVを投入する入口、ファイル状態、件数、メモの見え方だけを確認します。
                    </p>
                </div>

                <div className="mt-5 grid min-h-48 place-items-center rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 p-5 text-center">
                    <div className="grid gap-3">
                        <p className="text-lg font-bold text-sky-950">
                            ドラッグ＆ドロップ
                        </p>
                        <p className="text-sm leading-7 text-sky-900">
                            複数CSV選択の見た目確認です。ファイル保存、CSV解析、DB登録は行いません。
                        </p>
                        <button
                            type="button"
                            className="mx-auto min-h-11 rounded-lg border border-sky-500 bg-white px-4 text-sm font-bold text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                        >
                            複数CSVを選択（MOCK）
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-3">
                {csvFiles.map((file) => (
                    <article
                        key={file.id}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="break-words text-base font-bold text-slate-950">
                                    {file.fileName}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    {file.size} / {file.rowCount}
                                </p>
                            </div>
                            <span
                                className={`rounded-md border px-2.5 py-1 text-xs font-bold ${statusClassNames[file.status]}`}
                            >
                                {file.status}
                            </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            {file.memo}
                        </p>
                    </article>
                ))}
            </div>

            <button
                type="button"
                onClick={onNext}
                className="min-h-12 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
                案件一覧へ進む
            </button>
        </section>
    );
}
