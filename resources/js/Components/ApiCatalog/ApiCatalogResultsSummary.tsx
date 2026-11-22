import { apiCatalogSortOptions, type ApiCatalogSortKey } from './apiCatalogSort';
import { useRef, type RefObject } from 'react';

type Props = {
    keyword: string;
    providerKey: string;
    domain: string;
    sortKey: ApiCatalogSortKey;
    totalItems: number;
    isUpdating?: boolean;
    isUnconfirmed?: boolean;
    onKeywordRemove: () => void;
    onProviderRemove: () => void;
    onDomainRemove: () => void;
    resultHeadingRef?: RefObject<HTMLHeadingElement | null>;
};

/** 件数はサーバー確定値だけを表示し、入力変更中は確定件数を出しません。 */
export default function ApiCatalogResultsSummary({ keyword, providerKey, domain, sortKey,
    totalItems, isUpdating = false, isUnconfirmed = false, onKeywordRemove, onProviderRemove, onDomainRemove, resultHeadingRef }: Props) {
    const fallbackHeadingRef = useRef<HTMLHeadingElement>(null);
    const headingRef = resultHeadingRef ?? fallbackHeadingRef;
    const conditions = [
        { label: 'キーワード', value: keyword.trim(), remove: onKeywordRemove },
        { label: 'Provider', value: providerKey, remove: onProviderRemove },
        { label: 'Domain', value: domain, remove: onDomainRemove },
    ].filter(condition => condition.value !== '');
    return (
        <section aria-label="検索結果と条件" className="rounded-2xl border border-white/40 bg-slate-950/80 p-4 text-white">
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300" role="status" aria-live="polite">
                {isUpdating ? '検索結果を更新中…' : isUnconfirmed ? '検索条件が未適用です' : `検索結果 ${totalItems.toLocaleString('ja-JP')}件`}
            </h2>
            <p className="mt-1 text-sm text-cyan-100">並び順: {apiCatalogSortOptions.find(option => option.value === sortKey)?.label}</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={isUpdating || isUnconfirmed ? '変更中の条件' : '適用中の条件'}>
                {conditions.length === 0 && <span className="text-sm text-cyan-100">絞り込みなし</span>}
                {conditions.map(condition => (
                    <button key={condition.label} type="button" onClick={() => { condition.remove(); headingRef.current?.focus(); }}
                        aria-label={`${condition.label}「${condition.value}」を解除`}
                        className="min-h-11 max-w-full break-all rounded-xl border border-cyan-100/60 bg-cyan-50/10 px-3 py-2 text-left text-sm hover:bg-cyan-50/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                        {condition.label}: {condition.value} <span aria-hidden="true">×</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
