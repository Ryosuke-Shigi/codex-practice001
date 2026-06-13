/**
 * 工事発注管理・請求システム MOCK の請求設定 Component です。
 *
 * 画面内の請求種別・テンプレート・出力形式 state を切り替えるだけで、帳票生成は行いません。
 */
import type { InvoiceType } from './mockData';

type InvoiceSettingsPanelProps = {
    invoiceType: string;
    template: string;
    outputFormat: string;
    invoiceTypes: InvoiceType[];
    templates: string[];
    outputFormats: string[];
    selectedInvoiceType: InvoiceType;
    onInvoiceTypeChange: (invoiceType: string) => void;
    onTemplateChange: (template: string) => void;
    onOutputFormatChange: (outputFormat: string) => void;
};

const selectClassName =
    'min-h-11 w-full rounded-lg border border-white/15 bg-slate-950/75 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-cyan-100 focus:ring-2 focus:ring-cyan-100/30';

export default function InvoiceSettingsPanel({
    invoiceType,
    template,
    outputFormat,
    invoiceTypes,
    templates,
    outputFormats,
    selectedInvoiceType,
    onInvoiceTypeChange,
    onTemplateChange,
    onOutputFormatChange,
}: InvoiceSettingsPanelProps) {
    return (
        <article className="rounded-lg border border-white/15 bg-slate-950/70 p-4 backdrop-blur-xl sm:p-5">
            <h2 className="text-xl font-semibold text-white">請求書設定</h2>
            <div className="mt-4 grid gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                    請求書の種類
                    <select
                        className={selectClassName}
                        value={invoiceType}
                        onChange={(event) => onInvoiceTypeChange(event.target.value)}
                    >
                        {invoiceTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                    原型Excelテンプレート
                    <select
                        className={selectClassName}
                        value={template}
                        onChange={(event) => onTemplateChange(event.target.value)}
                    >
                        {templates.map((templateName) => (
                            <option key={templateName} value={templateName}>
                                {templateName}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-100">
                    出力書類形式
                    <select
                        className={selectClassName}
                        value={outputFormat}
                        onChange={(event) => onOutputFormatChange(event.target.value)}
                    >
                        {outputFormats.map((format) => (
                            <option key={format} value={format}>
                                {format}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="rounded-lg border border-cyan-100/25 bg-cyan-100/10 p-3">
                    <h3 className="text-sm font-semibold text-cyan-50">
                        {selectedInvoiceType.label}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-cyan-50/80">
                        {selectedInvoiceType.summary}
                    </p>
                </div>
                <button
                    type="button"
                    className="min-h-11 rounded-lg bg-cyan-100 px-4 text-sm font-bold text-slate-950"
                >
                    出力プレビュー
                </button>
            </div>
        </article>
    );
}
