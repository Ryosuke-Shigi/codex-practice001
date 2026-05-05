import ApiCatalogSortSelect from './ApiCatalogSortSelect';
import type { ApiCatalogSortKey } from './apiCatalogSort';

export type ApiCatalogFilterSelectOption = {
    value: string;
    label: string;
};

export type ApiCatalogFilterExtraSelect = {
    id: string;
    label: string;
    value: string;
    allValue: string;
    allLabel: string;
    options: ApiCatalogFilterSelectOption[];
    onChange: (value: string) => void;
};

type ApiCatalogFilterPanelProps = {
    keyword: string;
    keywordPlaceholder: string;
    providerKey: string;
    providerAllValue: string;
    providerOptions: ApiCatalogFilterSelectOption[];
    sortKey: ApiCatalogSortKey;
    hasActiveFilters: boolean;
    extraSelects?: ApiCatalogFilterExtraSelect[];
    onKeywordChange: (value: string) => void;
    onProviderKeyChange: (value: string) => void;
    onSortKeyChange: (value: ApiCatalogSortKey) => void;
    onClear: () => void;
};

export default function ApiCatalogFilterPanel({
    keyword,
    keywordPlaceholder,
    providerKey,
    providerAllValue,
    providerOptions,
    sortKey,
    hasActiveFilters,
    extraSelects = [],
    onKeywordChange,
    onProviderKeyChange,
    onSortKeyChange,
    onClear,
}: ApiCatalogFilterPanelProps) {
    /*
     * 本番とモックの検索UIは同じComponentで描画します。
     * 違いは provider 候補やモック用 domain select の有無といった入力データだけに閉じ込めます。
     */
    const gridClassName =
        extraSelects.length > 0
            ? 'xl:grid-cols-[minmax(0,1.45fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_minmax(12rem,0.8fr)_auto] xl:items-end'
            : 'lg:grid-cols-[minmax(0,1.5fr)_minmax(12rem,0.75fr)_minmax(12rem,0.75fr)_auto] lg:items-end';

    return (
        <section className="rounded-2xl border border-white/35 bg-slate-950/32 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl">
            <div className={`grid gap-3 ${gridClassName}`}>
                <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                    <span>Keyword</span>
                    <input
                        type="search"
                        value={keyword}
                        onChange={(event) => onKeywordChange(event.target.value)}
                        placeholder={keywordPlaceholder}
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
                        <option value={providerAllValue}>All providers</option>
                        {providerOptions.map((provider) => (
                            <option key={provider.value} value={provider.value}>
                                {provider.label}
                            </option>
                        ))}
                    </select>
                </label>

                {extraSelects.map((select) => (
                    /*
                        モック一覧だけが domain の追加絞り込みを持ちます。
                        ただし select の見た目や余白はここで共通化し、ページ側には入力データだけを渡させます。
                    */
                    <label key={select.id} className="grid gap-2 text-sm font-semibold text-cyan-50">
                        <span>{select.label}</span>
                        <select
                            value={select.value}
                            onChange={(event) => select.onChange(event.target.value)}
                            className="h-11 rounded-xl border border-white/30 bg-white/18 px-3 text-sm text-white outline-none backdrop-blur-xl focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                        >
                            <option value={select.allValue}>{select.allLabel}</option>
                            {select.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                ))}

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
