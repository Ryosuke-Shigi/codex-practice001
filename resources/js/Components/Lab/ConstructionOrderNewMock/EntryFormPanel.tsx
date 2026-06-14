import type { EntryDraft } from './mockData';

type EntryFormPanelProps = {
    draft: EntryDraft;
    previewed: boolean;
    onDraftChange: (field: keyof EntryDraft, value: string) => void;
    onPreview: () => void;
    onNext: () => void;
};

const entryFields: {
    key: keyof EntryDraft;
    label: string;
    multiline?: boolean;
}[] = [
    {
        key: 'projectName',
        label: '案件名',
    },
    {
        key: 'customerName',
        label: '顧客名',
    },
    {
        key: 'siteAddress',
        label: '現場住所',
    },
    {
        key: 'owner',
        label: '担当者',
    },
    {
        key: 'note',
        label: '備考',
        multiline: true,
    },
];

export default function EntryFormPanel({
    draft,
    previewed,
    onDraftChange,
    onPreview,
    onNext,
}: EntryFormPanelProps) {
    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        FORM入口
                    </p>
                    <h2 className="text-xl font-bold text-slate-950">
                        案件登録FORM
                    </h2>
                    <p className="text-sm leading-7 text-slate-600">
                        MOCKではDB保存しません。入力項目と仮登録ボタン、CSV作成へつながる説明だけを確認します。
                    </p>
                </div>

                <div className="mt-5 grid gap-4">
                    {entryFields.map((field) => (
                        <label key={field.key} className="grid gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                                {field.label}
                            </span>
                            {field.multiline ? (
                                <textarea
                                    value={draft[field.key]}
                                    onChange={(event) =>
                                        onDraftChange(field.key, event.target.value)
                                    }
                                    rows={4}
                                    className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                />
                            ) : (
                                <input
                                    value={draft[field.key]}
                                    onChange={(event) =>
                                        onDraftChange(field.key, event.target.value)
                                    }
                                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                />
                            )}
                        </label>
                    ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={onPreview}
                        className="min-h-12 rounded-lg bg-sky-700 px-4 text-sm font-bold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        仮登録
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        CSV一括取り込みへ
                    </button>
                </div>
            </div>

            <aside className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
                <h3 className="font-bold">CSV作成につながる説明</h3>
                <p className="mt-2">
                    FORM入力は、後続でCSVを作成するための入口候補です。ここでは入力済みの案件名、顧客名、現場住所、担当者、備考を画面内で確認するだけにします。
                </p>
                {previewed && (
                    <div className="mt-3 rounded-lg border border-emerald-300 bg-white p-3">
                        <p className="font-semibold text-emerald-900">
                            仮登録プレビュー
                        </p>
                        <p className="mt-1 text-emerald-900">
                            {draft.projectName} / {draft.customerName}
                        </p>
                    </div>
                )}
            </aside>
        </section>
    );
}
