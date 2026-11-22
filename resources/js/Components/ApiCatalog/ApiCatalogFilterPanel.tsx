import { useId, useState } from 'react';
import ApiCatalogSortSelect from './ApiCatalogSortSelect';
import type { ApiCatalogSortKey } from './apiCatalogSort';

export type ApiCatalogFilterSelectOption = { value: string; label: string };
type ApiCatalogFilterPanelProps = {
    keyword: string;
    providerKey: string;
    providerOptions: ApiCatalogFilterSelectOption[];
    domain: string;
    domainOptions: ApiCatalogFilterSelectOption[];
    sortKey: ApiCatalogSortKey;
    hasActiveFilters: boolean;
    onKeywordChange: (value: string) => void;
    onProviderKeyChange: (value: string) => void;
    onDomainChange: (value: string) => void;
    onSortKeyChange: (value: ApiCatalogSortKey) => void;
    onClear: () => void;
};
const fieldClass = 'h-11 w-full min-w-0 rounded-xl border border-slate-400 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-cyan-300';

/** 検索条件の入力と候補の表示を担当し、一覧への適用は親へ通知します。 */
export default function ApiCatalogFilterPanel({
    keyword, providerKey, providerOptions, domain, domainOptions, sortKey,
    hasActiveFilters, onKeywordChange, onProviderKeyChange, onDomainChange,
    onSortKeyChange, onClear,
}: ApiCatalogFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(() =>
        typeof window === 'undefined' || typeof window.matchMedia !== 'function'
            || window.matchMedia('(min-width: 768px)').matches);
    const [providerQuery, setProviderQuery] = useState('');
    const panelId = useId();
    // 候補検索はローカル表示だけ。現在の選択肢は絞り込み後も維持します。
    const matchingProviders = providerOptions.filter(option =>
        option.label.toLowerCase().includes(providerQuery.trim().toLowerCase()));
    const visibleProviders = providerOptions.filter(option =>
        option.value === providerKey || matchingProviders.includes(option));

    return (
        <section aria-label="検索・絞り込み" className="rounded-2xl border border-white/40 bg-slate-950/75 p-4 text-white shadow-xl sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold">APIを探す</h2>
                <button type="button" onClick={() => setIsExpanded(current => !current)}
                    aria-expanded={isExpanded} aria-controls={panelId}
                    className="min-h-11 rounded-xl border border-cyan-100/50 px-4 text-sm font-bold hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                    {isExpanded ? '追加条件を閉じる' : '追加条件を開く'}
                </button>
            </div>
            <label className="mt-3 grid min-w-0 gap-2 text-sm font-semibold">
                <span>キーワード</span>
                <input type="search" value={keyword} onChange={event => onKeywordChange(event.target.value)}
                    placeholder="API名・用途・提供元・メモから検索" className={fieldClass} />
            </label>
            <div id={panelId} hidden={!isExpanded}>
                <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="grid min-w-0 content-start gap-2 sm:col-span-2 lg:col-span-1">
                        <label className="grid min-w-0 gap-2 text-sm font-semibold">
                            <span>Provider候補を絞る</span>
                            <input type="search" aria-label="Provider候補を絞る" value={providerQuery}
                                onChange={event => setProviderQuery(event.target.value)}
                                placeholder="例: adyen" className={fieldClass} />
                        </label>
                        <label className="grid min-w-0 gap-2 text-sm font-semibold">
                            <span>Provider</span>
                            <select aria-label="Provider" value={providerKey} onChange={event => onProviderKeyChange(event.target.value)} className={fieldClass}>
                                <option value="">すべてのProvider</option>
                                {visibleProviders.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </label>
                        <p className="text-xs text-cyan-100" aria-live="polite">候補 {matchingProviders.length}件。選択すると一覧に適用します。</p>
                    </div>
                    <label className="grid min-w-0 content-start gap-2 text-sm font-semibold">
                        <span>Domain</span>
                        <select value={domain} onChange={event => onDomainChange(event.target.value)} className={fieldClass}>
                            <option value="">すべてのDomain</option>
                            {domainOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </label>
                    <ApiCatalogSortSelect value={sortKey} onChange={onSortKeyChange} />
                </div>
            </div>
            <button type="button" onClick={onClear} disabled={!hasActiveFilters}
                className="mt-4 min-h-11 rounded-xl border border-cyan-100/50 px-4 text-sm font-semibold hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 disabled:opacity-50">
                条件をすべて解除
            </button>
        </section>
    );
}
