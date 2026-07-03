import type { ApiCatalogListItem } from '@/Components/ApiCatalog/ApiCatalogList';
import {
    DEFAULT_API_CATALOG_SORT_KEY,
    type ApiCatalogSortKey,
} from '@/Components/ApiCatalog/apiCatalogSort';

import type { ApiCatalogItem, ApiCatalogPagination, ApiCatalogSyncStatus } from './types';

export function isApiCatalogPagination(value: unknown): value is ApiCatalogPagination {
    /*
     * Inertia の onSuccess では page.props が unknown に近い境界になります。
     * 画面状態へ反映する前に最低限の形を確認し、pagination 以外の部分更新が来ても壊れないようにします。
     */
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const candidate = value as Partial<ApiCatalogPagination>;

    return (
        typeof candidate.currentPage === 'number' &&
        typeof candidate.totalPages === 'number' &&
        typeof candidate.totalItems === 'number' &&
        typeof candidate.perPage === 'number' &&
        (typeof candidate.from === 'number' || candidate.from === null) &&
        (typeof candidate.to === 'number' || candidate.to === null)
    );
}

export function buildOptimisticPagination(
    pagination: ApiCatalogPagination,
    nextPage: number,
): ApiCatalogPagination {
    /*
     * ページ移動ボタンや左右キーを押した瞬間にもページ表示を進めるための暫定値です。
     * 最終的な値は Inertia レスポンスの pagination で必ず上書きします。
     */
    const totalItems = Math.max(0, Math.floor(pagination.totalItems));
    const totalPages = Math.max(1, Math.floor(pagination.totalPages));
    const currentPage = Math.min(Math.max(1, Math.floor(nextPage)), totalPages);

    if (totalItems === 0) {
        return {
            ...pagination,
            currentPage: 1,
            totalPages,
            from: null,
            to: null,
        };
    }

    const perPage = Math.max(1, Math.floor(pagination.perPage));
    const from = (currentPage - 1) * perPage + 1;

    return {
        ...pagination,
        currentPage,
        totalPages,
        perPage,
        from,
        to: Math.min(totalItems, from + perPage - 1),
    };
}

export function buildApiCatalogQueryParams(
    keyword: string,
    providerKey: string,
    domain: string,
    sortKey: ApiCatalogSortKey,
    page: number,
) {
    /*
     * URLクエリは本番一覧の状態そのものです。
     * keyword / provider_key / domain / sort / page を明示し、
     * リロードしても同じ一覧状態を再現できます。
     */
    const params: Record<string, string | number> = {
        page,
    };

    if (keyword.trim() !== '') {
        params.keyword = keyword.trim();
    }

    if (providerKey !== '') {
        params.provider_key = providerKey;
    }

    if (domain !== '') {
        params.domain = domain;
    }

    if (sortKey !== DEFAULT_API_CATALOG_SORT_KEY) {
        params.sort = sortKey;
    }

    return params;
}

export function buildApiCatalogDetailHref(apiKey: string, returnUrl: string) {
    /*
     * 本番詳細の識別子は id ではなく APIs.guru の api_key です。
     * ":" などを含む api_key でも壊れないよう、パスと return_url の両方をエンコードします。
     */
    return `/api-catalog/${encodeURIComponent(apiKey)}?return_url=${encodeURIComponent(returnUrl)}`;
}

export function toApiCatalogListItem(
    item: ApiCatalogItem,
    returnUrl: string,
): ApiCatalogListItem {
    return {
        listKey: item.id,
        apiKey: item.apiKey,
        title: item.title,
        description: item.description,
        providerKey: item.providerKey,
        serviceKey: item.serviceKey,
        preferredVersion: item.preferredVersion,
        openapiVersion: item.openapiVersion,
        notes: item.notes ?? [],
        detailHref: buildApiCatalogDetailHref(item.apiKey, returnUrl),
    };
}

export function apiCatalogSyncStatusMessage(
    status: ApiCatalogSyncStatus | null,
    isStarting: boolean,
    pollingError: string | null,
) {
    if (isStarting) {
        return 'APIカタログ同期を開始しています';
    }

    if (pollingError !== null) {
        return pollingError;
    }

    if (status === null) {
        return null;
    }

    /*
     * stale は「完了」ではありません。
     * worker が止まっている、または失敗時処理まで届かない落ち方をした可能性があるため、
     * ボタンは戻しつつ、画面文言では運用確認が必要な状態として出します。
     */
    if (status.isStale) {
        return '同期状態が一定時間更新されませんでした。Queue worker の状態を確認してください。';
    }

    if (status.status === 'queued') {
        /*
         * `queued` は同期本体がまだ始まっていない状態です。
         * 「同期中」とだけ表示すると処理が進んでいるように見えるため、worker 待ちであることを明示します。
         */
        return 'APIカタログ同期を開始しました。Queue worker の処理開始を待っています。';
    }

    if (status.status === 'running') {
        return '同期中です';
    }

    if (status.status === 'completed') {
        return '同期が完了しました';
    }

    return '同期に失敗しました';
}

export function shouldShowSyncResult(status: ApiCatalogSyncStatus | null) {
    return status !== null && !status.isRunning;
}
