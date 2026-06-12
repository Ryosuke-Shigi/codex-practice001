import { useId, useState } from 'react';

import ApiCatalogSortSelect from './ApiCatalogSortSelect';
import type { ApiCatalogSortKey } from './apiCatalogSort';

export type ApiCatalogFilterSelectOption = {
    value: string;
    label: string;
};

const PROVIDER_ALL_VALUE = '';
const DOMAIN_ALL_VALUE = '';
const KEYWORD_PLACEHOLDER = 'title / description / provider / service';

function shouldOpenFilterPanelByDefault() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return true;
    }

    return window.matchMedia('(min-width: 768px)').matches;
}

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

/**
 * APIカタログ一覧の検索・絞り込みUIをまとめる Feature Component です。
 *
 * keyword / provider / domain / sort の入力状態を表示し、変更イベントを親Pageへ通知します。
 * 候補の取得やDB検索条件の解決は行わず、モックと本番で共通に使う操作UIに責務を絞ります。
 */
export default function ApiCatalogFilterPanel({
    keyword,
    providerKey,
    providerOptions,
    domain,
    domainOptions,
    sortKey,
    hasActiveFilters,
    onKeywordChange,
    onProviderKeyChange,
    onDomainChange,
    onSortKeyChange,
    onClear,
}: ApiCatalogFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(shouldOpenFilterPanelByDefault);
    const panelId = useId();

    /*
     * 本番とモックの検索UIは同じComponentで描画します。
     * domain は専用DBカラムではなく、provider_key から抽出済みの候補を props で受け取ります。
     * 画面ごとの差は provider/domain 候補配列という入力データだけです。
     */
    return (
        <section className="rounded-2xl border border-white/35 bg-slate-950/32 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-white">検索・絞り込み</h2>
                    {hasActiveFilters && (
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/18 px-2.5 py-1 text-[0.68rem] font-bold text-cyan-50">
                            絞り込み中
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setIsExpanded((current) => !current)}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                >
                    {isExpanded ? '閉じる' : '開く'}
                </button>
            </div>

            {!isExpanded && (
                <p className="mt-2 text-xs font-semibold text-cyan-50/72">
                    {hasActiveFilters ? '条件を保持しています' : '条件なし'}
                </p>
            )}

            <div
                id={panelId}
                className={`${isExpanded ? 'mt-4 grid' : 'hidden'} gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(11rem,0.68fr)_minmax(10rem,0.58fr)_minmax(12rem,0.74fr)_auto] lg:items-end`}
            >
                <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                    <span>Keyword</span>
                    <input
                        type="search"
                        value={keyword}
                        onChange={(event) => onKeywordChange(event.target.value)}
                        placeholder={KEYWORD_PLACEHOLDER}
                        className="h-11 rounded-xl border border-white/30 bg-white/18 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.34)] outline-none backdrop-blur-xl placeholder:text-cyan-50/55 focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                    />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                    <span>Provider</span>
                    <select
                        value={providerKey}
                        onChange={(event) => onProviderKeyChange(event.target.value)}
                        className="h-11 rounded-xl border border-white/30 bg-white/18 px-3 text-sm text-white outline-none backdrop-blur-xl focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                    >
                        <option value={PROVIDER_ALL_VALUE}>All providers</option>
                        {providerOptions.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                                {provider.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                    <span>Domain</span>
                    <select
                        value={domain}
                        onChange={(event) => onDomainChange(event.target.value)}
                        className="h-11 rounded-xl border border-white/30 bg-white/18 px-3 text-sm text-white outline-none backdrop-blur-xl focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                    >
                        <option value={DOMAIN_ALL_VALUE}>All domains</option>
                        {domainOptions.map((domainOption) => (
                            <option key={domainOption.value} value={domainOption.value}>
                                {domainOption.label}
                            </option>
                        ))}
                    </select>
                </label>

                <ApiCatalogSortSelect value={sortKey} onChange={onSortKeyChange} />

                <button
                    type="button"
                    onClick={onClear}
                    disabled={!hasActiveFilters}
                    className="h-11 rounded-xl border border-white/35 bg-white/18 px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    Clear
                </button>
            </div>
        </section>
    );
}
