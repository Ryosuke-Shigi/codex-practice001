import { useEffect, useState } from 'react';

import type { DocumentType, Project } from './mockData';
import { cardKindLabels, cardKindStyles } from './mockData';

type DocumentPreviewPanelProps = {
    documentType: DocumentType;
    project: Project;
};

const documentLead: Record<DocumentType, string> = {
    estimate: '見積書プレビュー',
    invoice: '請求書プレビュー',
    receipt: '領収書プレビュー',
};

export default function DocumentPreviewPanel({
    documentType,
    project,
}: DocumentPreviewPanelProps) {
    const preview = project.reports[documentType];
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>(
        preview.selectedCardIds,
    );
    const [activePageIndex, setActivePageIndex] = useState(0);

    // Checkbox selection is local UI state; Excel/PDF generation is still outside this MOCK.
    useEffect(() => {
        setSelectedCardIds(preview.selectedCardIds);
        setActivePageIndex(0);
    }, [preview.selectedCardIds]);

    const selectedCards = project.cards.filter((card) =>
        selectedCardIds.includes(card.id),
    );
    const activePage = preview.pages[activePageIndex] ?? preview.pages[0];

    const toggleCard = (cardId: string) => {
        setSelectedCardIds((current) =>
            current.includes(cardId)
                ? current.filter((id) => id !== cardId)
                : [...current, cardId],
        );
    };

    return (
        <section className="grid gap-2">
            <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-950">
                    {documentLead[documentType]}
                </h3>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-600">
                        対象 {selectedCards.length}件
                    </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]">
                    <label className="grid gap-1">
                        <span className="text-xs font-bold text-slate-700">
                            Excelテンプレート
                        </span>
                        <select
                            defaultValue={preview.selectedTemplate}
                            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-bold text-slate-900 outline-none"
                        >
                            {preview.templateOptions.map((template) => (
                                <option key={template}>{template}</option>
                            ))}
                        </select>
                    </label>

                    <div className="grid gap-1">
                        <span className="text-xs font-bold text-slate-700">
                            対象カード選択
                        </span>
                        <div className="grid gap-1">
                            {project.cards.map((card) => {
                                const styles = cardKindStyles[card.kind];
                                const checked = selectedCardIds.includes(card.id);

                                return (
                                    <label
                                        key={card.id}
                                        className={[
                                            'grid min-h-8 grid-cols-[1rem_4.6rem_minmax(0,1fr)_5.2rem] items-center gap-1 rounded-md border px-2 py-1 text-xs',
                                            checked
                                                ? 'border-sky-300 bg-sky-50'
                                                : 'border-slate-200 bg-slate-50',
                                        ].join(' ')}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleCard(card.id)}
                                            className="h-3.5 w-3.5"
                                        />
                                        <span
                                            className={`rounded border px-1 py-0.5 text-center text-[10px] font-bold ${styles.badge}`}
                                        >
                                            {cardKindLabels[card.kind]}
                                        </span>
                                        <span className="break-words font-bold leading-4 text-slate-900">
                                            {card.title}
                                        </span>
                                        <span className="break-words text-right font-bold leading-4 text-slate-700">
                                            {card.amount}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <article className="rounded-md border border-slate-200 bg-slate-100 p-2 shadow-sm">
                <div className="mb-2 grid grid-cols-3 gap-1">
                    {preview.pages.map((page, index) => (
                        <button
                            key={page.title}
                            type="button"
                            onClick={() => setActivePageIndex(index)}
                            className={[
                                'h-8 rounded-md border px-2 text-xs font-bold',
                                index === activePageIndex
                                    ? 'border-sky-600 bg-sky-700 text-white'
                                    : 'border-slate-200 bg-white text-slate-700',
                            ].join(' ')}
                        >
                            {index + 1}面目
                        </button>
                    ))}
                </div>

                <div className="mx-auto min-h-[26rem] max-w-[44rem] bg-white p-4 text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.12)] sm:p-6">
                    <div className="border-b border-slate-200 pb-3">
                        <p className="text-xs font-bold text-slate-500">
                            {activePage.title}
                        </p>
                        <h4 className="mt-1 text-center text-2xl font-bold tracking-[0.08em]">
                            {preview.title}
                        </h4>
                    </div>

                    {activePageIndex === 0 && (
                        <DocumentCoverPage
                            documentType={documentType}
                            preview={preview}
                            project={project}
                            selectedCount={selectedCards.length}
                        />
                    )}
                    {activePageIndex === 1 && (
                        <DocumentDetailPage selectedCards={selectedCards} />
                    )}
                    {activePageIndex === 2 && (
                        <DocumentSummaryPage
                            documentType={documentType}
                            preview={preview}
                            selectedCards={selectedCards}
                        />
                    )}
                </div>
            </article>
        </section>
    );
}

function DocumentCoverPage({
    documentType,
    preview,
    project,
    selectedCount,
}: {
    documentType: DocumentType;
    preview: Project['reports'][DocumentType];
    project: Project;
    selectedCount: number;
}) {
    return (
        <div className="grid gap-4 pt-4">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <div>
                    <p className="text-sm font-bold text-slate-700">
                        {preview.recipient}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        件名: {project.name}
                    </p>
                </div>
                <div className="text-xs leading-5 text-slate-600 sm:text-right">
                    <p>発行日 2026/06/14</p>
                    <p>{preview.issuer}</p>
                    <p>担当 {project.owner}</p>
                </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-bold text-slate-500">
                    {preview.amountLabel}
                </p>
                <p className="mt-1 text-3xl font-bold text-rose-600">
                    {preview.amount}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                    対象カード {selectedCount}件
                </p>
            </div>

            <div className="grid gap-2">
                {preview.extraFields.map((field) => (
                    <div
                        key={field.label}
                        className="grid gap-1 border-b border-slate-200 pb-2 sm:grid-cols-[7rem_minmax(0,1fr)]"
                    >
                        <span className="text-xs font-bold text-slate-500">
                            {field.label}
                        </span>
                        <span className="break-words text-xs font-semibold text-slate-900">
                            {field.value}
                        </span>
                    </div>
                ))}
            </div>

            {documentType === 'receipt' && (
                <div className="ml-auto grid h-20 w-20 place-items-center rounded-full border border-dashed border-slate-300 text-xs font-bold text-slate-500">
                    印影欄
                </div>
            )}
        </div>
    );
}

function DocumentDetailPage({
    selectedCards,
}: {
    selectedCards: Project['cards'];
}) {
    return (
        <div className="pt-4">
            <table className="w-full table-fixed border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-600">
                    <tr>
                        <th className="w-[22%] px-2 py-2 text-left">区分</th>
                        <th className="w-[53%] px-2 py-2 text-left">内容</th>
                        <th className="w-[25%] px-2 py-2 text-right">確定金額</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedCards.map((card) => (
                        <tr key={card.id} className="border-t border-slate-200">
                            <td className="px-2 py-2 align-top font-bold">
                                {card.category}
                            </td>
                            <td className="break-words px-2 py-2 align-top">
                                {card.title}
                            </td>
                            <td className="px-2 py-2 text-right align-top font-bold">
                                {card.amount}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DocumentSummaryPage({
    documentType,
    preview,
    selectedCards,
}: {
    documentType: DocumentType;
    preview: Project['reports'][DocumentType];
    selectedCards: Project['cards'];
}) {
    const categories = Array.from(new Set(selectedCards.map((card) => card.category)));

    return (
        <div className="grid gap-4 pt-4">
            <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h5 className="text-sm font-bold text-slate-950">まとめ</h5>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                    対象カード {selectedCards.length}件 / 区分 {categories.join('、')}
                </p>
                <p className="mt-2 text-xl font-bold text-rose-600">
                    {preview.amount}
                </p>
            </section>

            <section className="grid gap-2">
                {preview.pages[2]?.lines.map((line) => (
                    <div
                        key={line}
                        className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                        {line}
                    </div>
                ))}
            </section>

            {documentType === 'receipt' && (
                <section className="rounded-md border border-slate-200 p-3 text-xs leading-5 text-slate-700">
                    <p className="font-bold">発行者情報</p>
                    <p>{preview.issuer}</p>
                    <p>但し書き: 工事代金として</p>
                </section>
            )}
        </div>
    );
}
