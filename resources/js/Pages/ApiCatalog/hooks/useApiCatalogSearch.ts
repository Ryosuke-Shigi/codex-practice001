import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeApiCatalogSortKey, type ApiCatalogSortKey } from '@/Components/ApiCatalog/apiCatalogSort';
import { buildApiCatalogQueryParams, isApiCatalogFilters, isApiCatalogPagination } from '../apiCatalogIndexUtils';
import type { ApiCatalogFilters, ApiCatalogPagination } from '../types';

/** 入力と確定済み検索結果を分け、Inertia GETの完了前に件数やページを確定しません。 */
export function useApiCatalogSearch(filters: ApiCatalogFilters, pagination: ApiCatalogPagination) {
    const [keyword, setKeyword] = useState(filters.keyword ?? '');
    const [providerKey, setProviderKey] = useState(filters.providerKey ?? '');
    const [domain, setDomain] = useState(filters.domain ?? '');
    const [sortKey, setSortKey] = useState(normalizeApiCatalogSortKey(filters.sortKey));
    const [visiblePagination, setVisiblePagination] = useState(pagination);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const requestId = useRef(0);
    const isRequestPending = useRef(false);
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
        setIsSearching(true);
        setSearchError(null);
        router.get('/api-catalog', buildApiCatalogQueryParams(nextKeyword, nextProviderKey, nextDomain, nextSortKey, page), {
            preserveState: true, preserveScroll: true, replace: true,
            only: ['filters', 'apiCatalogItems', 'pagination'],
            onSuccess: response => {
                succeeded = true;
                if (id === requestId.current) {
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
                if (id === requestId.current) setSearchError('検索結果を更新できませんでした。再試行するか条件を変更してください。');
            },
            onFinish: () => {
                if (id === requestId.current) {
                    isRequestPending.current = false;
                    setIsSearching(false);
                    if (!succeeded) setSearchError('検索結果を更新できませんでした。再試行するか条件を変更してください。');
                }
            },
        });
    }, []);

    const updateKeyword = (value: string) => { setKeyword(value); visitList(value, providerKey, domain, sortKey, 1); };
    const updateProviderKey = (value: string) => { setProviderKey(value); visitList(keyword, value, domain, sortKey, 1); };
    const updateDomain = (value: string) => { setDomain(value); visitList(keyword, providerKey, value, sortKey, 1); };
    const updateSortKey = (value: ApiCatalogSortKey) => { setSortKey(value); visitList(keyword, providerKey, domain, value, 1); };
    const clearFilters = () => { setKeyword(''); setProviderKey(''); setDomain(''); visitList('', '', '', sortKey, 1); };
    const canMovePrevious = !isSearching && !isUnconfirmed && visiblePagination.currentPage > 1;
    const canMoveNext = !isSearching && !isUnconfirmed && visiblePagination.currentPage < visiblePagination.totalPages;
    const moveToPreviousPage = useCallback(() => {
        if (canMovePrevious && !isRequestPending.current) visitList(keyword, providerKey, domain, sortKey, visiblePagination.currentPage - 1);
    }, [canMovePrevious, keyword, providerKey, domain, sortKey, visiblePagination.currentPage, visitList]);
    const moveToNextPage = useCallback(() => {
        if (canMoveNext && !isRequestPending.current) visitList(keyword, providerKey, domain, sortKey, visiblePagination.currentPage + 1);
    }, [canMoveNext, keyword, providerKey, domain, sortKey, visiblePagination.currentPage, visitList]);

    useEffect(() => {
        // 既に応答queueへ入っていた同期再取得のpropsでも、入力中の新しい条件を戻しません。
        if (isRequestPending.current) return;
        setKeyword(filters.keyword ?? '');
        setProviderKey(filters.providerKey ?? '');
        setDomain(filters.domain ?? '');
        setSortKey(normalizeApiCatalogSortKey(filters.sortKey));
        setVisiblePagination(pagination);
        setSearchError(null);
    }, [filters.keyword, filters.providerKey, filters.domain, filters.sortKey, pagination]);

    return { keyword, providerKey, domain, sortKey, visiblePagination, setVisiblePagination,
        isSearching, isUnconfirmed, searchError, canMovePrevious, canMoveNext,
        hasActiveFilters: keyword.trim() !== '' || providerKey !== '' || domain !== '',
        updateKeyword, updateProviderKey, updateDomain, updateSortKey, clearFilters,
        moveToPreviousPage, moveToNextPage,
        retrySearch: () => { if (lastRequest.current) visitList(...lastRequest.current); } };
}
