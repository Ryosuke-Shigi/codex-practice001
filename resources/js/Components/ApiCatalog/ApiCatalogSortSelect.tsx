/**
 * API Catalog filter panel 内の sort select Component です。
 *
 * 選択肢と選択値の表示だけを担当し、実際の sort 条件や pagination 補正は Page / backend へ渡します。
 */
import {
    apiCatalogSortOptions,
    type ApiCatalogSortKey,
    normalizeApiCatalogSortKey,
} from './apiCatalogSort';

type ApiCatalogSortSelectProps = {
    value: ApiCatalogSortKey;
    onChange: (sortKey: ApiCatalogSortKey) => void;
};

export default function ApiCatalogSortSelect({ value, onChange }: ApiCatalogSortSelectProps) {
    return (
        <label className="grid min-w-0 content-start gap-2 text-sm font-semibold text-cyan-50">
            <span>Sort</span>
            <select
                value={value}
                onChange={(event) => onChange(normalizeApiCatalogSortKey(event.target.value))}
                className="h-11 w-full min-w-0 rounded-xl border border-slate-400 bg-white px-3 text-sm text-slate-950 outline-none focus:ring-4 focus:ring-cyan-300"
            >
                {apiCatalogSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
