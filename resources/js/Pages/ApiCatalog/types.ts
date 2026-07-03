import type { ApiCatalogNoteItem } from '@/Components/ApiCatalog/ApiCatalogNotesPanel';
import type { ApiCatalogSortKey } from '@/Components/ApiCatalog/apiCatalogSort';

export type ApiCatalogFilters = {
    keyword: string | null;
    providerKey: string | null;
    domain: string | null;
    sortKey: ApiCatalogSortKey;
};

export type ApiCatalogItem = {
    id: number;
    apiKey: string;
    title: string;
    description: string;
    providerKey: string;
    serviceKey: string | null;
    preferredVersion: string | null;
    openapiVersion: string | null;
    notes?: ApiCatalogNoteItem[];
    isActive: boolean;
};

export type ApiCatalogPagination = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    from: number | null;
    to: number | null;
};

export type ApiCatalogSyncResult = {
    totalCount: number;
    insertedCount: number;
    updatedCount: number;
    skippedCount: number;
    inactiveCount: number;
    failedCount: number;
};

export type ApiCatalogSyncStatus = {
    id: number;
    status: 'queued' | 'running' | 'completed' | 'failed';
    isRunning: boolean;
    isStale: boolean;
    result: ApiCatalogSyncResult;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export type ApiCatalogSyncStatusResponse = {
    syncStatus: ApiCatalogSyncStatus | null;
};

export type ApiCatalogIndexProps = {
    /*
     * Responder から受け取る props は将来の Inertia 部分更新単位に合わせています。
     * providers/domains は候補リストなので、検索・ページ送りでは基本的に更新しない想定です。
     */
    filters: ApiCatalogFilters;
    providers: string[];
    domains: string[];
    apiCatalogItems: ApiCatalogItem[];
    pagination: ApiCatalogPagination;
    syncStatus: ApiCatalogSyncStatus | null;
};
