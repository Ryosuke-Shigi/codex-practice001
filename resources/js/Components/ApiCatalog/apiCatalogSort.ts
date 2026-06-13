/**
 * API Catalog 一覧の sort UI と query 値をつなぐ表示補助です。
 *
 * Repository の並び替え条件を再実装せず、UI が受け付ける候補値と既定値だけを固定します。
 */
export const apiCatalogSortOptions = [
    { value: 'updated_desc', label: '更新日が新しい順' },
    { value: 'updated_asc', label: '更新日が古い順' },
    { value: 'name_asc', label: 'API名 昇順' },
    { value: 'name_desc', label: 'API名 降順' },
] as const;

export type ApiCatalogSortKey = (typeof apiCatalogSortOptions)[number]['value'];

export const DEFAULT_API_CATALOG_SORT_KEY: ApiCatalogSortKey = 'updated_desc';

const apiCatalogSortValues = apiCatalogSortOptions.map((option) => option.value);

export type ApiCatalogSortableItem = {
    title: string;
    apiKey?: string;
    sourceLatestUpdatedAt?: string | null;
};

export function normalizeApiCatalogSortKey(value: unknown): ApiCatalogSortKey {
    /*
     * URL query や select の値は外から入るため、表示側でも必ず既知の sort key に丸めます。
     * 本番側の PHP DTO と同じデフォルトに寄せることで、モック/本番の初期表示順を揃えます。
     */
    if (typeof value === 'string' && apiCatalogSortValues.includes(value as ApiCatalogSortKey)) {
        return value as ApiCatalogSortKey;
    }

    return DEFAULT_API_CATALOG_SORT_KEY;
}

function normalizedName(item: ApiCatalogSortableItem) {
    const name = item.title.trim() || item.apiKey?.trim() || '';

    return name.toLocaleLowerCase('ja');
}

function updatedAtTime(item: ApiCatalogSortableItem) {
    if (!item.sourceLatestUpdatedAt) {
        return null;
    }

    const time = Date.parse(item.sourceLatestUpdatedAt);

    return Number.isNaN(time) ? null : time;
}

function compareByName(
    first: ApiCatalogSortableItem,
    second: ApiCatalogSortableItem,
    direction: 'asc' | 'desc',
) {
    const compared = normalizedName(first).localeCompare(normalizedName(second), 'ja', {
        sensitivity: 'base',
    });

    if (compared !== 0) {
        return direction === 'asc' ? compared : -compared;
    }

    return (first.apiKey ?? '').localeCompare(second.apiKey ?? '');
}

function compareByUpdatedAt(
    first: ApiCatalogSortableItem,
    second: ApiCatalogSortableItem,
    direction: 'asc' | 'desc',
) {
    const firstTime = updatedAtTime(first);
    const secondTime = updatedAtTime(second);

    /*
     * 更新日がないデータは「新しい/古い」のどちらにも寄せず末尾へ置きます。
     * そのうえで同日データは API名順にして、ページをまたいでも並びが揺れないようにします。
     */
    if (firstTime === null && secondTime === null) {
        return compareByName(first, second, 'asc');
    }

    if (firstTime === null) {
        return 1;
    }

    if (secondTime === null) {
        return -1;
    }

    if (firstTime === secondTime) {
        return compareByName(first, second, 'asc');
    }

    return direction === 'asc' ? firstTime - secondTime : secondTime - firstTime;
}

export function compareApiCatalogItems(
    first: ApiCatalogSortableItem,
    second: ApiCatalogSortableItem,
    sortKey: ApiCatalogSortKey,
) {
    switch (sortKey) {
        case 'updated_asc':
            return compareByUpdatedAt(first, second, 'asc');
        case 'name_asc':
            return compareByName(first, second, 'asc');
        case 'name_desc':
            return compareByName(first, second, 'desc');
        case 'updated_desc':
        default:
            return compareByUpdatedAt(first, second, 'desc');
    }
}

export function sortApiCatalogItems<T extends ApiCatalogSortableItem>(
    items: readonly T[],
    sortKey: ApiCatalogSortKey,
) {
    /*
     * React state / import したモック配列を直接 mutate しないよう、必ずコピーしてから sort します。
     * 処理順は「検索で絞り込み → 並び替え → ページネーション」の並びで呼び出します。
     */
    return [...items].sort((first, second) => compareApiCatalogItems(first, second, sortKey));
}
