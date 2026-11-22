import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeApiCatalogSortKey, type ApiCatalogSortKey } from '@/Components/ApiCatalog/apiCatalogSort';
import { buildApiCatalogQueryParams, isApiCatalogFilters, isApiCatalogPagination } from '../apiCatalogIndexUtils';
import type { ApiCatalogFilters, ApiCatalogItem, ApiCatalogPagination } from '../types';

/** 入力と確定済み検索結果を分け、Inertia GETの完了前に件数やページを確定しません。 */
export function useApiCatalogSearch(filters: ApiCatalogFilters, pagination: ApiCatalogPagination, items: ApiCatalogItem[]) {
    const [keyword, setKeyword] = useState(filters.keyword ?? '');
    const [providerKey, setProviderKey] = useState(filters.providerKey ?? '');
    const [domain, setDomain] = useState(filters.domain ?? '');
    const [sortKey, setSortKey] = useState(normalizeApiCatalogSortKey(filters.sortKey));
    const [confirmedPagination, setVisiblePagination] = useState(pagination);
    const source = useRef({ items, filters, pagination });
    source.current = { items, filters, pagination };
    const [refresh, setRefresh] = useState<{
        source: typeof source.current; items: ApiCatalogItem[]; pagination: ApiCatalogPagination;
    } | null>(null);
    const isCurrentRefresh = refresh?.source.items === items && refresh?.source.filters === filters
        && refresh?.source.pagination === pagination;
    const visibleItems = isCurrentRefresh ? refresh.items : items;
    const visiblePagination = isCurrentRefresh ? refresh.pagination : confirmedPagination;
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const requestId = useRef(0);
    const isRequestPending = useRef(false);
    const hasFailedRequest = useRef(false);
    const lastRequest = useRef<[string, string, string, ApiCatalogSortKey, number] | null>(null);

    const isUnconfirmed = keyword.trim() !== (filters.keyword ?? '').trim()
        || providerKey !== (filters.providerKey ?? '') || domain !== (filters.domain ?? '')
        || sortKey !== normalizeApiCatalogSortKey(filters.sortKey);

    const visitList = useCallback((nextKeyword: string, nextProviderKey: string,
        nextDomain: string, nextSortKey: ApiCatalogSortKey, page: number) => {
        const id = ++requestId.current;
        let succeeded = false;
        lastRequest.current = [nextKeyword, nextProviderKey, nextDomain, nextSortKey, page];
        isRequestPending.current = true;
        hasFailedRequest.current = false;
        setIsSearching(true);
        setSearchError(null);
        setRefresh(null);
        router.get('/api-catalog', buildApiCatalogQueryParams(nextKeyword, nextProviderKey, nextDomain, nextSortKey, page), {
            preserveState: true, preserveScroll: true, replace: true,
            only: ['filters', 'apiCatalogItems', 'pagination'],
            onSuccess: response => {
                succeeded = true;
                if (id === requestId.current) {
                    hasFailedRequest.current = false;
                    if (isApiCatalogPagination(response.props.pagination)) setVisiblePagination(response.props.pagination);
                    if (isApiCatalogFilters(response.props.filters)) {
                        setKeyword(response.props.filters.keyword ?? '');
                        setProviderKey(response.props.filters.providerKey ?? '');
                        setDomain(response.props.filters.domain ?? '');
                        setSortKey(normalizeApiCatalogSortKey(response.props.filters.sortKey));
                    }
                }
            },
            onError: () => {
                if (id === requestId.current) {
                    hasFailedRequest.current = true;
                    setSearchError('検索結果を更新できませんでした。再試行するか条件を変更してください。');
                }
            },
            onFinish: () => {
                if (id === requestId.current) {
                    isRequestPending.current = false;
                    setIsSearching(false);
                    if (!succeeded) {
                        hasFailedRequest.current = true;
                        setSearchError('検索結果を更新できませんでした。再試行するか条件を変更してください。');
                    }
                }
            },
        });
    }, []);

    const updateKeyword = (value: string) => { setKeyword(value); visitList(value, providerKey, domain, sortKey, 1); };
    const updateProviderKey = (value: string) => { setProviderKey(value); visitList(keyword, value, domain, sortKey, 1); };
    const updateDomain = (value: string) => { setDomain(value); visitList(keyword, providerKey, value, sortKey, 1); };
    const updateSortKey = (value: ApiCatalogSortKey) => { setSortKey(value); visitList(keyword, providerKey, domain, value, 1); };
    const clearFilters = () => { setKeyword(''); setProviderKey(''); setDomain(''); visitList('', '', '', sortKey, 1); };
    const canMovePrevious = !isSearching && !isUnconfirmed && searchError === null && visiblePagination.currentPage > 1;
    const canMoveNext = !isSearching && !isUnconfirmed && searchError === null && visiblePagination.currentPage < visiblePagination.totalPages;
    const moveToPreviousPage = useCallback(() => {
        if (canMovePrevious && !isRequestPending.current && !hasFailedRequest.current) visitList(keyword, providerKey, domain, sortKey, visiblePagination.currentPage - 1);
    }, [canMovePrevious, keyword, providerKey, domain, sortKey, visiblePagination.currentPage, visitList]);
    const moveToNextPage = useCallback(() => {
        if (canMoveNext && !isRequestPending.current && !hasFailedRequest.current) visitList(keyword, providerKey, domain, sortKey, visiblePagination.currentPage + 1);
    }, [canMoveNext, keyword, providerKey, domain, sortKey, visiblePagination.currentPage, visitList]);

    useEffect(() => {
        // 旧propsでも入力中・未解決の失敗要求を戻しません。履歴復元はInertiaの再mountで初期化します。
        if (isRequestPending.current || hasFailedRequest.current) return;
        setKeyword(filters.keyword ?? '');
        setProviderKey(filters.providerKey ?? '');
        setDomain(filters.domain ?? '');
        setSortKey(normalizeApiCatalogSortKey(filters.sortKey));
        setVisiblePagination(pagination);
        setRefresh(null);
        setSearchError(null);
    }, [filters.keyword, filters.providerKey, filters.domain, filters.sortKey, pagination, items]);

    const applySyncRefresh = useCallback((nextItems: ApiCatalogItem[], nextPagination: ApiCatalogPagination) => {
        if (isRequestPending.current || hasFailedRequest.current || source.current.items !== items
            || source.current.filters !== filters || source.current.pagination !== pagination) return false;
        setRefresh({ source: { items, filters, pagination }, items: nextItems, pagination: nextPagination });
        return true;
    }, [items, filters, pagination]);

    return { keyword, providerKey, domain, sortKey, visiblePagination, visibleItems, applySyncRefresh,
        isSearching, isUnconfirmed, searchError, canMovePrevious, canMoveNext,
        hasActiveFilters: keyword.trim() !== '' || providerKey !== '' || domain !== '',
        updateKeyword, updateProviderKey, updateDomain, updateSortKey, clearFilters,
        moveToPreviousPage, moveToNextPage,
        retrySearch: () => { if (lastRequest.current) visitList(...lastRequest.current); } };
}
