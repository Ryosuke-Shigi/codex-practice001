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
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
                <h2 className="text-base font-bold text-slate-950">
                    案件登録FORM
                </h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onPreview}
                        className="h-8 rounded-md bg-sky-700 px-3 text-xs font-bold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        仮登録
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        CSVへ
                    </button>
                </div>
            </div>

            {/* This is the only vertical scroll area in the FORM screen. */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                    {entryFields.map((field) => (
                        <EntryInput
                            key={field.key}
                            field={field}
                            draft={draft}
                            onDraftChange={onDraftChange}
                        />
                    ))}
                    </div>

                    <div className="grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <h3 className="text-sm font-bold text-emerald-950">
                            商品情報
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-3">
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

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_18rem]">
                        {noteFields.map((field) => (
                            <EntryInput
                                key={field.key}
                                field={field}
                                draft={draft}
                                onDraftChange={onDraftChange}
                            />
                        ))}

                        <aside className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-6 text-emerald-950">
                            <h3 className="font-bold">入力内容</h3>
                            {previewed && (
                                <div className="mt-2 rounded-md border border-emerald-300 bg-white p-2">
                                    <p className="text-emerald-900">
                                        {draft.projectName} / {draft.customerName}
                                    </p>
                                    <p className="text-emerald-900">
                                        {draft.productLabel} / {draft.productMeasurement}
                                        {draft.productUnit} / {draft.productFixedAmount}
                                    </p>
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </div>
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
        <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">
                {field.label}
            </span>
            {field.multiline ? (
                <textarea
                    value={draft[field.key]}
                    onChange={(event) =>
                        onDraftChange(field.key, event.target.value)
                    }
                    rows={3}
                    className="min-h-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            ) : (
                <input
                    value={draft[field.key]}
                    onChange={(event) =>
                        onDraftChange(field.key, event.target.value)
                    }
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            )}
        </label>
    );
}
