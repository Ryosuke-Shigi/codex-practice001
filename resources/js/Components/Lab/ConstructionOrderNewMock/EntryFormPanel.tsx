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
];

const productFields: {
    key: keyof EntryDraft;
    label: string;
    multiline?: boolean;
}[] = [
    // 案件登録時点で商品候補を持たせ、CSV作成と商品カード化の流れを確認する。
    {
        key: 'productName',
        label: '商品名',
    },
    {
        key: 'productLabel',
        label: '表示ラベル',
    },
    {
        key: 'productMeasurement',
        label: '計測値',
    },
    {
        key: 'productUnit',
        label: '単位',
    },
    {
        key: 'productFixedAmount',
        label: '確定金額',
    },
    {
        key: 'productMemo',
        label: '商品メモ',
        multiline: true,
    },
];

const noteFields: {
    key: keyof EntryDraft;
    label: string;
    multiline?: boolean;
}[] = [
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
        <section className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-2">
                    <h2 className="text-xl font-bold text-slate-950">
                        案件登録FORM
                    </h2>
                </div>

                <div className="mt-5 grid gap-4">
                    {entryFields.map((field) => (
                        <EntryInput
                            key={field.key}
                            field={field}
                            draft={draft}
                            onDraftChange={onDraftChange}
                        />
                    ))}

                    <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <h3 className="text-base font-bold text-emerald-950">
                            商品情報
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {productFields.map((field) => (
                                <EntryInput
                                    key={field.key}
                                    field={field}
                                    draft={draft}
                                    onDraftChange={onDraftChange}
                                />
                            ))}
                        </div>
                    </div>

                    {noteFields.map((field) => (
                        <EntryInput
                            key={field.key}
                            field={field}
                            draft={draft}
                            onDraftChange={onDraftChange}
                        />
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

            <aside className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
                <h3 className="font-bold">入力内容</h3>
                {previewed && (
                    <div className="mt-3 rounded-lg border border-emerald-300 bg-white p-3">
                        <p className="mt-1 text-emerald-900">
                            {draft.projectName} / {draft.customerName}
                        </p>
                        <p className="mt-1 text-emerald-900">
                            {draft.productLabel} / {draft.productMeasurement}
                            {draft.productUnit} / {draft.productFixedAmount}
                        </p>
                    </div>
                )}
            </aside>
        </section>
    );
}

function EntryInput({
    field,
    draft,
    onDraftChange,
}: {
    field: {
        key: keyof EntryDraft;
        label: string;
        multiline?: boolean;
    };
    draft: EntryDraft;
    onDraftChange: (field: keyof EntryDraft, value: string) => void;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-800">
                {field.label}
            </span>
            {field.multiline ? (
                <textarea
                    value={draft[field.key]}
                    onChange={(event) =>
                        onDraftChange(field.key, event.target.value)
                    }
                    rows={3}
                    className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
    );
}
