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
        <label className="grid gap-2 text-sm font-semibold text-cyan-50">
            <span>Sort</span>
            <select
                value={value}
                onChange={(event) => onChange(normalizeApiCatalogSortKey(event.target.value))}
                className="h-11 rounded-xl border border-white/30 bg-white/18 px-3 text-sm text-white outline-none backdrop-blur-xl focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
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
