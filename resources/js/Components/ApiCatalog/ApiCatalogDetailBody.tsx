import { useId, useState, type ReactNode } from 'react';
import { apiCatalogDescriptionExcerpt } from './apiCatalogDescription';

export type ApiCatalogDetailTechnicalRow = [label: string, value: string | null];
type Props = {
    title: string;
    description: string | null;
    notesPanel: ReactNode;
    technicalRows: ApiCatalogDetailTechnicalRow[];
    isTechnicalCollapsible?: boolean;
    defaultTechnicalOpen?: boolean;
};
const labels: Record<string, string> = {
    apiKey: 'API識別子', providerKey: 'Provider', serviceKey: 'Service', domain: 'Domain',
    preferredVersion: 'API版', openapiVersion: 'OpenAPI版',
    openapiJsonUrl: '仕様書 JSON', openapiYamlUrl: '仕様書 YAML', sourceLatestUpdatedAt: 'ソース更新日',
};
function safeSpecUrl(label: string, value: string | null) {
    if (!['openapiJsonUrl', 'openapiYamlUrl'].includes(label) || !value) return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch { return null; }
}

/** 用途・原文・技術情報を調査メモより先に配置します。仕様本文の取得やメモ保存は行いません。 */
export default function ApiCatalogDetailBody({ title, description, notesPanel, technicalRows,
    isTechnicalCollapsible = false, defaultTechnicalOpen = false }: Props) {
    const [isTechnicalOpen, setIsTechnicalOpen] = useState(defaultTechnicalOpen);
    const technicalId = useId();
    const technicalContent = (
        <dl id={technicalId} className="mt-4 grid gap-3 sm:grid-cols-2">
            {technicalRows.map(([label, value]) => {
                const href = safeSpecUrl(label, value);
                return (
                    <div key={label} className="min-w-0 rounded-xl border border-white/25 bg-black/20 p-3">
                        <dt className="text-xs font-semibold text-cyan-100">{labels[label] ?? label}</dt>
                        <dd className="mt-1 break-all text-sm leading-6 text-white">
                            {href ? <a href={href} target="_blank" rel="noreferrer" className="inline-block min-h-11 py-2 font-semibold text-cyan-100 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">{labels[label]}を開く ↗</a> : value?.trim() || '未登録'}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
    return (
        <div className="grid min-w-0 gap-4">
            <section aria-label="用途と説明" className="min-w-0 rounded-2xl border border-white/40 bg-slate-950/80 p-5 text-white sm:p-6">
                <h2 className="text-xl font-semibold">用途・提供元の説明</h2>
                <p className="mt-3 break-words text-sm leading-7 text-cyan-50">{apiCatalogDescriptionExcerpt(description).slice(0, 420)}{apiCatalogDescriptionExcerpt(description).length > 420 ? '…' : ''}</p>
                <details className="mt-4">
                    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-cyan-100 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">提供元の原文・注意事項を読む</summary>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">{description?.trim() || '説明は登録されていません。'}</p>
                </details>
            </section>
            <section aria-label="技術情報" className="min-w-0 rounded-2xl border border-white/40 bg-slate-950/80 p-5 text-white sm:p-6">
                {isTechnicalCollapsible ? <>
                    <button type="button" onClick={() => setIsTechnicalOpen(current => !current)}
                        aria-expanded={isTechnicalOpen} aria-controls={technicalId}
                        className="min-h-11 rounded-xl border border-white/40 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                        {isTechnicalOpen ? '技術情報を隠す' : '技術情報を表示'}
                    </button>
                    {isTechnicalOpen && technicalContent}
                </> : <><h2 className="text-xl font-semibold">版・仕様書・ソース情報</h2>{technicalContent}</>}
            </section>
            <section aria-label={`${title}の調査メモ`} className="min-w-0 rounded-2xl border border-white/40 bg-slate-950/80 p-5 text-white sm:p-6">{notesPanel}</section>
        </div>
    );
}
