import { useState } from 'react';

import type {
    CsvStatus,
    EntryDraft,
    EntryDraftField,
    EntryProductDraft,
    EntryProductDraftField,
} from './mockData';
import { csvFiles } from './mockData';

type EntryProductAddDraft = Omit<EntryProductDraft, 'id'>;

type EntryFormPanelProps = {
    draft: EntryDraft;
    previewed: boolean;
    onDraftChange: (field: EntryDraftField, value: string) => void;
    onProductChange: (
        productId: string,
        field: EntryProductDraftField,
        value: string,
    ) => void;
    onProductAdd: (product: EntryProductAddDraft) => void;
    onProductDuplicate: (product: EntryProductDraft) => void;
    onProductRemove: (productId: string) => void;
    onPreview: () => void;
    onNext: () => void;
};

const entryFields: {
    key: EntryDraftField;
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
    key: EntryProductDraftField;
    label: string;
    multiline?: boolean;
}[] = [
    // 案件登録時点で商品候補を持たせ、CSV取込と商品カード化の流れを確認する。
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
        label: '確定金額（数値）',
    },
    {
        key: 'productMemo',
        label: '商品メモ',
        multiline: true,
    },
];

const noteFields: {
    key: EntryDraftField;
    label: string;
    multiline?: boolean;
}[] = [
    {
        key: 'note',
        label: '備考',
        multiline: true,
    },
];

const statusClassNames: Record<CsvStatus, string> = {
    投入待ち: 'border-slate-300 bg-slate-50 text-slate-700',
    受付済み: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    エラー: 'border-rose-300 bg-rose-50 text-rose-900',
};

export default function EntryFormPanel({
    draft,
    previewed,
    onDraftChange,
    onProductChange,
    onProductAdd,
    onProductDuplicate,
    onProductRemove,
    onPreview,
    onNext,
}: EntryFormPanelProps) {
    const [productAddDraft, setProductAddDraft] =
        useState<EntryProductAddDraft | null>(null);
    const [activeEntryTab, setActiveEntryTab] = useState<'form' | 'csv'>('form');

    const openProductAddModal = () => {
        setProductAddDraft(createEmptyProductAddDraft());
    };

    const updateProductAddDraft = (
        field: EntryProductDraftField,
        value: string,
    ) => {
        setProductAddDraft((current) =>
            current
                ? {
                      ...current,
                      [field]: value,
                  }
                : current,
        );
    };

    const registerProductAddDraft = () => {
        if (!productAddDraft) {
            return;
        }

        onProductAdd(productAddDraft);
        setProductAddDraft(null);
    };

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid shrink-0 gap-2 border-b border-slate-200 px-3 py-2 sm:flex sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-slate-950">
                    案件登録FORM
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                        type="button"
                        aria-pressed={activeEntryTab === 'form'}
                        onClick={() => setActiveEntryTab('form')}
                        className={[
                            'h-8 rounded-md px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100',
                            activeEntryTab === 'form'
                                ? 'bg-sky-700 text-white'
                                : 'border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-50',
                        ].join(' ')}
                    >
                        FORM
                    </button>
                    <button
                        type="button"
                        aria-pressed={activeEntryTab === 'csv'}
                        onClick={() => setActiveEntryTab('csv')}
                        className={[
                            'h-8 rounded-md px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100',
                            activeEntryTab === 'csv'
                                ? 'bg-sky-700 text-white'
                                : 'border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-50',
                        ].join(' ')}
                    >
                        CSV取込
                    </button>
                </div>
            </div>

            {/* This is the only vertical scroll area in the entry screen. */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {activeEntryTab === 'form' && (
                    <FormFields
                        draft={draft}
                        previewed={previewed}
                        onDraftChange={onDraftChange}
                        onProductChange={onProductChange}
                        onProductDuplicate={onProductDuplicate}
                        onProductRemove={onProductRemove}
                        onProductAddOpen={openProductAddModal}
                    />
                )}

                {activeEntryTab === 'csv' && <CsvFields />}
            </div>

            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-3 py-2">
                <button
                    type="button"
                    onClick={activeEntryTab === 'form' ? onPreview : onNext}
                    className="min-h-10 rounded-md bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                >
                    {activeEntryTab === 'form' ? '登録' : '案件一覧'}
                </button>
            </div>

            {productAddDraft && (
                <ProductAddModal
                    draft={productAddDraft}
                    onChange={updateProductAddDraft}
                    onClose={() => setProductAddDraft(null)}
                    onRegister={registerProductAddDraft}
                />
            )}
        </section>
    );
}

function formatPreviewAmount(value: string) {
    const amount = Number(value.replace(/[^\d-]/g, ''));

    if (!Number.isFinite(amount)) {
        return value;
    }

    return `${amount.toLocaleString('ja-JP')}円`;
}

function FormFields({
    draft,
    previewed,
    onDraftChange,
    onProductChange,
    onProductDuplicate,
    onProductRemove,
    onProductAddOpen,
}: {
    draft: EntryDraft;
    previewed: boolean;
    onDraftChange: (field: EntryDraftField, value: string) => void;
    onProductChange: (
        productId: string,
        field: EntryProductDraftField,
        value: string,
    ) => void;
    onProductDuplicate: (product: EntryProductDraft) => void;
    onProductRemove: (productId: string) => void;
    onProductAddOpen: () => void;
}) {
    return (
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
                <div className="grid gap-2 sm:flex sm:items-center sm:justify-between">
                    <h3 className="text-sm font-bold text-emerald-950">
                        商品情報
                    </h3>
                    <button
                        type="button"
                        onClick={onProductAddOpen}
                        className="h-8 w-full rounded-md bg-emerald-700 px-3 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:w-auto"
                    >
                        追加
                    </button>
                </div>

                <div className="grid gap-2">
                    {draft.products.length === 0 && (
                        <div className="rounded-lg border border-dashed border-emerald-300 bg-white p-4 text-center text-sm font-bold text-emerald-900">
                            商品明細なし
                        </div>
                    )}

                    {draft.products.map((product, index) => (
                        <article
                            key={product.id}
                            className="grid gap-3 rounded-lg border border-emerald-200 bg-white p-3 shadow-sm"
                        >
                            <div className="grid gap-2 sm:flex sm:items-center sm:justify-between">
                                <h4 className="text-sm font-bold text-emerald-950">
                                    商品 {index + 1}
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => onProductDuplicate(product)}
                                        className="h-8 rounded-md border border-emerald-300 bg-white px-2.5 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                                    >
                                        複製
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onProductRemove(product.id)}
                                        className="h-8 rounded-md border border-rose-200 bg-white px-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                                    >
                                        削除
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {productFields.map((field) => (
                                    <ProductInput
                                        key={field.key}
                                        field={field}
                                        product={product}
                                        onProductChange={onProductChange}
                                    />
                                ))}
                            </div>
                        </article>
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
                    <h3 className="font-bold">登録プレビュー</h3>
                    {previewed && (
                        <div className="mt-2 rounded-md border border-emerald-300 bg-white p-2">
                            <p className="text-emerald-900">
                                {draft.projectName} / {draft.customerName}
                            </p>
                            <p className="text-emerald-900">
                                商品明細 {draft.products.length}件
                            </p>
                            <div className="mt-2 grid gap-1">
                                {draft.products.map((product) => (
                                    <p
                                        key={product.id}
                                        className="break-words text-emerald-900"
                                    >
                                        {product.productLabel} /{' '}
                                        {product.productMeasurement}
                                        {product.productUnit} /{' '}
                                        {formatPreviewAmount(
                                            product.productFixedAmount,
                                        )}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                    {!previewed && (
                        <p className="mt-2 text-emerald-800">未登録</p>
                    )}
                </aside>
            </div>
        </div>
    );
}

function CsvFields() {
    const acceptedFiles = csvFiles.filter((file) => file.status === '受付済み');
    const waitingFiles = csvFiles.filter((file) => file.status === '投入待ち');
    const errorFiles = csvFiles.filter((file) => file.status === 'エラー');

    return (
        <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
                <CsvSummary label="受付済み" value={`${acceptedFiles.length}件`} />
                <CsvSummary label="投入待ち" value={`${waitingFiles.length}件`} />
                <CsvSummary label="エラー" value={`${errorFiles.length}件`} />
            </div>

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
    );
}

function CsvSummary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-slate-200 bg-white p-2">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-0.5 text-base font-bold text-slate-950">{value}</p>
        </div>
    );
}

function createEmptyProductAddDraft(): EntryProductAddDraft {
    return {
        productName: '',
        productLabel: '',
        productMeasurement: '1',
        productUnit: '式',
        productFixedAmount: '0円',
        productMemo: '',
    };
}

function EntryInput({
    field,
    draft,
    onDraftChange,
}: {
    field: {
        key: EntryDraftField;
        label: string;
        multiline?: boolean;
    };
    draft: EntryDraft;
    onDraftChange: (field: EntryDraftField, value: string) => void;
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

function ProductInput({
    field,
    product,
    onProductChange,
}: {
    field: {
        key: EntryProductDraftField;
        label: string;
        multiline?: boolean;
    };
    product: EntryProductDraft;
    onProductChange: (
        productId: string,
        field: EntryProductDraftField,
        value: string,
    ) => void;
}) {
    return (
        <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">
                {field.label}
            </span>
            {field.multiline ? (
                <textarea
                    value={product[field.key]}
                    onChange={(event) =>
                        onProductChange(
                            product.id,
                            field.key,
                            event.target.value,
                        )
                    }
                    rows={3}
                    className="min-h-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            ) : (
                <input
                    value={product[field.key]}
                    onChange={(event) =>
                        onProductChange(
                            product.id,
                            field.key,
                            event.target.value,
                        )
                    }
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            )}
        </label>
    );
}

function ProductAddModal({
    draft,
    onChange,
    onClose,
    onRegister,
}: {
    draft: EntryProductAddDraft;
    onChange: (field: EntryProductDraftField, value: string) => void;
    onClose: () => void;
    onRegister: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-3">
            <div className="max-h-[88dvh] w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <h4 className="text-base font-bold text-slate-950">
                        商品情報を追加
                    </h4>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        閉じる
                    </button>
                </div>
                <div className="max-h-[58dvh] overflow-y-auto px-4 py-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {productFields.map((field) => (
                            <ProductAddInput
                                key={field.key}
                                field={field}
                                draft={draft}
                                onChange={onChange}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={onRegister}
                        className="min-h-9 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
                    >
                        登録
                    </button>
                </div>
            </div>
        </div>
    );
}

function ProductAddInput({
    field,
    draft,
    onChange,
}: {
    field: {
        key: EntryProductDraftField;
        label: string;
        multiline?: boolean;
    };
    draft: EntryProductAddDraft;
    onChange: (field: EntryProductDraftField, value: string) => void;
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
                        onChange(field.key, event.target.value)
                    }
                    rows={3}
                    className="min-h-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            ) : (
                <input
                    value={draft[field.key]}
                    onChange={(event) =>
                        onChange(field.key, event.target.value)
                    }
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
            )}
        </label>
    );
}
