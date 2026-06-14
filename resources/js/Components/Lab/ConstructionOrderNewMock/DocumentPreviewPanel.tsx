import { useEffect, useMemo, useState } from 'react';

import type { DocumentType, Project, WorkCard } from './mockData';

type DocumentPreviewPanelProps = {
    documentType: DocumentType;
    project: Project;
};

type DocumentLine = {
    id: string;
    content: string;
    displayLabel: string;
    measuredValue: string;
    unit: string;
    fixedAmount: string;
};

type PreviewPage =
    | {
          kind: 'cover';
          label: string;
      }
    | {
          kind: 'details';
          label: string;
          lineGroupIndex: number;
      }
    | {
          kind: 'note';
          label: string;
      };

const documentLead: Record<DocumentType, string> = {
    estimate: '見積書プレビュー',
    invoice: '請求書プレビュー',
    receipt: '領収書プレビュー',
};

const outputButtons = ['印刷', 'PDF', 'EXCEL'];

export default function DocumentPreviewPanel({
    documentType,
    project,
}: DocumentPreviewPanelProps) {
    const preview = project.reports[documentType];
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
        preview.selectedCardIds,
    );
    const [activePageIndex, setActivePageIndex] = useState(0);

    useEffect(() => {
        setSelectedItemIds(preview.selectedCardIds);
        setActivePageIndex(0);
    }, [preview.selectedCardIds]);

    const selectedItems = project.cards.filter((item) =>
        selectedItemIds.includes(item.id),
    );
    const documentLines = useMemo(
        () => buildDocumentLines(selectedItems),
        [selectedItems],
    );
    const lineGroups = chunkLines(documentLines, 6);
    const pages = buildPreviewPages(lineGroups.length);
    const activePage = pages[activePageIndex] ?? pages[0];
    const subtotal = documentLines.reduce(
        (total, line) => total + parseYen(line.fixedAmount),
        0,
    );
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;

    useEffect(() => {
        if (activePageIndex >= pages.length) {
            setActivePageIndex(Math.max(pages.length - 1, 0));
        }
    }, [activePageIndex, pages.length]);

    const toggleItem = (itemId: string) => {
        setSelectedItemIds((current) =>
            current.includes(itemId)
                ? current.filter((id) => id !== itemId)
                : [...current, itemId],
        );
    };

    return (
        <section className="grid gap-2">
            <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-950">
                        {documentLead[documentType]}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {outputButtons.map((label) => (
                            <button
                                key={label}
                                type="button"
                                className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700">
                            出力明細の選択
                        </span>
                        <AmountText amount={total} className="text-sm" />
                    </div>
                    <div className="grid gap-1">
                        {project.cards.map((item) => {
                            const checked = selectedItemIds.includes(item.id);

                            return (
                                <label
                                    key={item.id}
                                    className={[
                                        'grid min-h-9 grid-cols-[1.2rem_minmax(0,1fr)_5.8rem] items-center gap-2 rounded-md border px-2 py-1 text-xs',
                                        checked
                                            ? 'border-sky-300 bg-white'
                                            : 'border-slate-200 bg-white/70',
                                    ].join(' ')}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleItem(item.id)}
                                        className="h-4 w-4"
                                    />
                                    <span className="break-words font-bold leading-4 text-slate-900">
                                        {item.title}
                                    </span>
                                    <span
                                        className={[
                                            'text-right font-bold leading-4',
                                            isNegativeAmount(item.amount)
                                                ? 'text-rose-600'
                                                : 'text-slate-700',
                                        ].join(' ')}
                                    >
                                        {item.amount}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            <article className="rounded-md border border-slate-200 bg-slate-100 p-2 shadow-sm">
                <div className="mb-2 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                    <button
                        type="button"
                        onClick={() =>
                            setActivePageIndex((current) => Math.max(current - 1, 0))
                        }
                        disabled={activePageIndex === 0}
                        className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        前へ
                    </button>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700">
                            {activePageIndex + 1} / {pages.length}
                        </span>
                        {pages.map((page, index) => (
                            <button
                                key={`${page.kind}-${page.label}`}
                                type="button"
                                onClick={() => setActivePageIndex(index)}
                                className={[
                                    'h-8 rounded-md border px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100',
                                    index === activePageIndex
                                        ? 'border-sky-600 bg-sky-700 text-white'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                                ].join(' ')}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            setActivePageIndex((current) =>
                                Math.min(current + 1, pages.length - 1),
                            )
                        }
                        disabled={activePageIndex === pages.length - 1}
                        className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                    >
                        次へ
                    </button>
                </div>

                <div className="mx-auto min-h-[28rem] max-w-[44rem] bg-white p-4 text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.12)] sm:p-6">
                    <div className="border-b border-slate-200 pb-3">
                        <p className="text-xs font-bold text-slate-500">
                            {activePage.label}
                        </p>
                        <h4 className="mt-1 text-center text-2xl font-bold tracking-[0.08em]">
                            {preview.title}
                        </h4>
                    </div>

                    {activePage.kind === 'cover' && (
                        <DocumentCoverPage
                            preview={preview}
                            project={project}
                            subtotal={subtotal}
                            tax={tax}
                            total={total}
                        />
                    )}

                    {activePage.kind === 'details' && (
                        <DocumentDetailPage
                            lines={lineGroups[activePage.lineGroupIndex] ?? []}
                            subtotal={subtotal}
                            tax={tax}
                            total={total}
                        />
                    )}

                    {activePage.kind === 'note' && (
                        <DocumentNotePage
                            documentType={documentType}
                            preview={preview}
                        />
                    )}
                </div>
            </article>
        </section>
    );
}

function DocumentCoverPage({
    preview,
    project,
    subtotal,
    tax,
    total,
}: {
    preview: Project['reports'][DocumentType];
    project: Project;
    subtotal: number;
    tax: number;
    total: number;
}) {
    return (
        <div className="grid gap-4 pt-4">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <div>
                    <p className="text-sm font-bold text-slate-700">
                        {preview.recipient}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        件名: {preview.subject}
                    </p>
                </div>
                <div className="text-xs leading-5 text-slate-600 sm:text-right">
                    <p>発行日 {preview.issuedAt}</p>
                    <p>書類番号 {preview.documentNumber}</p>
                    <p>{preview.issuer}</p>
                    <p>担当 {project.owner}</p>
                </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-bold text-slate-500">
                    {preview.amountLabel}
                </p>
                <AmountText amount={total} className="mt-1 justify-center text-3xl" />
            </div>

            <AmountSummary subtotal={subtotal} tax={tax} total={total} />
        </div>
    );
}

function DocumentDetailPage({
    lines,
    subtotal,
    tax,
    total,
}: {
    lines: DocumentLine[];
    subtotal: number;
    tax: number;
    total: number;
}) {
    return (
        <div className="grid gap-4 pt-4">
            <table className="w-full table-fixed border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-600">
                    <tr>
                        <th className="w-[42%] px-2 py-2 text-left">品名・内容</th>
                        <th className="w-[22%] px-2 py-2 text-left">表示</th>
                        <th className="w-[16%] px-2 py-2 text-right">数量</th>
                        <th className="w-[20%] px-2 py-2 text-right">金額</th>
                    </tr>
                </thead>
                <tbody>
                    {lines.map((line) => (
                        <tr key={line.id} className="border-t border-slate-200">
                            <td className="break-words px-2 py-2 align-top">
                                {line.content}
                            </td>
                            <td className="break-words px-2 py-2 align-top">
                                {line.displayLabel}
                            </td>
                            <td className="px-2 py-2 text-right align-top">
                                {line.measuredValue} {line.unit}
                            </td>
                            <td className="px-2 py-2 text-right align-top">
                                <AmountText amount={parseYen(line.fixedAmount)} />
                            </td>
                        </tr>
                    ))}
                    {lines.length === 0 && (
                        <tr className="border-t border-slate-200">
                            <td
                                colSpan={4}
                                className="px-2 py-8 text-center text-xs font-bold text-slate-500"
                            >
                                選択中の明細はありません。
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <AmountSummary subtotal={subtotal} tax={tax} total={total} />
        </div>
    );
}

function DocumentNotePage({
    documentType,
    preview,
}: {
    documentType: DocumentType;
    preview: Project['reports'][DocumentType];
}) {
    return (
        <div className="grid gap-4 pt-4">
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h5 className="text-sm font-bold text-slate-950">外部向け備考</h5>
                <p className="mt-2 text-xs leading-6 text-slate-700">
                    {preview.externalNote}
                </p>
            </section>

            {documentType === 'invoice' && preview.paymentAccount && (
                <section className="rounded-md border border-slate-200 p-3 text-xs leading-6 text-slate-700">
                    <p className="font-bold text-slate-950">振込先</p>
                    <p>{preview.paymentAccount}</p>
                </section>
            )}

            {documentType === 'receipt' && preview.proviso && (
                <section className="rounded-md border border-slate-200 p-3 text-xs leading-6 text-slate-700">
                    <p className="font-bold text-slate-950">但し書き</p>
                    <p>{preview.proviso}</p>
                </section>
            )}

            <section className="rounded-md border border-slate-200 p-3 text-xs leading-6 text-slate-700">
                <p className="font-bold text-slate-950">発行者情報</p>
                <p>{preview.issuer}</p>
            </section>
        </div>
    );
}

function AmountSummary({
    subtotal,
    tax,
    total,
}: {
    subtotal: number;
    tax: number;
    total: number;
}) {
    return (
        <div className="ml-auto grid w-full max-w-xs gap-1 text-xs">
            <AmountRow label="小計" amount={subtotal} />
            <AmountRow label="税額" amount={tax} />
            <AmountRow label="合計金額" amount={total} strong />
        </div>
    );
}

function AmountRow({
    label,
    amount,
    strong = false,
}: {
    label: string;
    amount: number;
    strong?: boolean;
}) {
    return (
        <div
            className={[
                'grid grid-cols-[1fr_auto] border-b border-slate-200 py-1',
                strong ? 'text-sm font-bold' : 'font-semibold',
            ].join(' ')}
        >
            <span className="text-slate-600">{label}</span>
            <AmountText amount={amount} />
        </div>
    );
}

function AmountText({
    amount,
    className = '',
}: {
    amount: number;
    className?: string;
}) {
    return (
        <span
            className={[
                'inline-flex font-bold tabular-nums',
                amount < 0 ? 'text-rose-600' : 'text-slate-950',
                className,
            ].join(' ')}
        >
            {formatYen(amount)}
        </span>
    );
}

function buildDocumentLines(items: WorkCard[]): DocumentLine[] {
    return items.flatMap((item) =>
        item.detailRows.map((row) => ({
            id: `${item.id}-${row.id}`,
            content: row.content,
            displayLabel: row.displayLabel,
            measuredValue: row.measuredValue,
            unit: row.unit,
            fixedAmount: row.fixedAmount,
        })),
    );
}

function buildPreviewPages(lineGroupCount: number): PreviewPage[] {
    const detailCount = Math.max(lineGroupCount, 1);

    return [
        {
            kind: 'cover',
            label: '表紙',
        },
        ...Array.from({ length: detailCount }, (_, index) => ({
            kind: 'details' as const,
            label: `明細 ${index + 1}`,
            lineGroupIndex: index,
        })),
        {
            kind: 'note',
            label: '備考',
        },
    ];
}

function chunkLines(lines: DocumentLine[], size: number) {
    if (lines.length === 0) {
        return [[]];
    }

    const groups: DocumentLine[][] = [];

    for (let index = 0; index < lines.length; index += size) {
        groups.push(lines.slice(index, index + size));
    }

    return groups;
}

function parseYen(value: string) {
    const numericValue = Number(value.replace(/[^\d-]/g, ''));

    return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatYen(amount: number) {
    const absoluteAmount = Math.abs(amount).toLocaleString('ja-JP');

    return amount < 0 ? `-${absoluteAmount}円` : `${absoluteAmount}円`;
}

function isNegativeAmount(value: string) {
    return value.trim().startsWith('-');
}
