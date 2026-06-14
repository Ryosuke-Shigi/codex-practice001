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
    const selectedCards = project.cards.filter((card) =>
        preview.selectedCardIds.includes(card.id),
    );

    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    EXCEL TEMPLATE / DOCUMENT PREVIEW
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">
                    {documentLead[documentType]}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                    Excelテンプレート保存、対象カード収集、カテゴリ整理、Excel差し込み、Excel出力、必要ならPDF変換という将来構想をUIで見せるだけです。
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
                <aside className="grid gap-4">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <label className="grid gap-2">
                            <span className="text-sm font-bold text-slate-800">
                                Excelテンプレート選択
                            </span>
                            <select
                                defaultValue={preview.selectedTemplate}
                                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none"
                            >
                                {preview.templateOptions.map((template) => (
                                    <option key={template}>{template}</option>
                                ))}
                            </select>
                        </label>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800">
                            対象カード選択
                        </h4>
                        <div className="mt-3 grid gap-2">
                            {project.cards.map((card) => {
                                const styles = cardKindStyles[card.kind];
                                const checked = preview.selectedCardIds.includes(card.id);

                                return (
                                    <label
                                        key={card.id}
                                        className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            readOnly
                                            className="mt-1 h-4 w-4"
                                        />
                                        <span className="min-w-0">
                                            <span
                                                className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${styles.badge}`}
                                            >
                                                {cardKindLabels[card.kind]}
                                            </span>
                                            <span className="mt-2 block break-words text-sm font-bold text-slate-900">
                                                {card.title}
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-500">
                                                {card.billingTarget} / {card.amount}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800">
                            将来出力
                        </h4>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                className="min-h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-700"
                            >
                                Excel出力（将来）
                            </button>
                            <button
                                type="button"
                                className="min-h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-700"
                            >
                                PDF変換（将来）
                            </button>
                        </div>
                    </section>
                </aside>

                <article className="rounded-lg border border-slate-200 bg-slate-100 p-3 shadow-sm sm:p-5">
                    <div className="mx-auto max-w-[48rem] bg-white p-5 text-slate-950 shadow-[0_18px_42px_rgba(15,23,42,0.16)] sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                            <div>
                                <p className="text-sm font-bold text-slate-500">
                                    {preview.recipient}
                                </p>
                                <h4 className="mt-3 text-3xl font-bold tracking-[0.08em]">
                                    {preview.title}
                                </h4>
                            </div>
                            <div className="text-left text-xs leading-6 text-slate-600 sm:text-right">
                                <p>発行日 2026/06/14</p>
                                <p>{preview.issuer}</p>
                                <p>担当 {project.owner}</p>
                            </div>
                        </div>

                        <div className="my-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-bold text-slate-500">
                                {preview.amountLabel}
                            </p>
                            <p className="mt-2 text-3xl font-bold text-rose-600">
                                {preview.amount}
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                {preview.overview}
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {preview.extraFields.map((field) => (
                                <div
                                    key={field.label}
                                    className="grid gap-1 border-b border-slate-200 pb-3 sm:grid-cols-[8rem_minmax(0,1fr)]"
                                >
                                    <span className="text-sm font-bold text-slate-500">
                                        {field.label}
                                    </span>
                                    <span className="break-words text-sm font-semibold text-slate-900">
                                        {field.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600">
                                    <tr>
                                        <th className="px-3 py-2">区分</th>
                                        <th className="px-3 py-2">内容</th>
                                        <th className="px-3 py-2 text-right">確定金額</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedCards.map((card) => (
                                        <tr key={card.id} className="border-t border-slate-200">
                                            <td className="px-3 py-2 font-bold">
                                                {card.category}
                                            </td>
                                            <td className="px-3 py-2">{card.title}</td>
                                            <td className="px-3 py-2 text-right font-bold">
                                                {card.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {documentType === 'receipt' && (
                            <div className="mt-6 grid place-items-center rounded-lg border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-500">
                                印影欄
                            </div>
                        )}

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            {preview.pages.map((page) => (
                                <section
                                    key={page.title}
                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                >
                                    <h5 className="text-sm font-bold text-slate-950">
                                        {page.title}
                                    </h5>
                                    <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
                                        {page.lines.map((line) => (
                                            <li key={line}>{line}</li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}
