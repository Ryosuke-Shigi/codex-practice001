import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import ApiCatalogFilterPanel from '@/Components/ApiCatalog/ApiCatalogFilterPanel';
import ApiCatalogList, { type ApiCatalogListItem } from '@/Components/ApiCatalog/ApiCatalogList';
import ApiCatalogPagination, {
    type ApiCatalogPaginationState,
} from '@/Components/ApiCatalog/ApiCatalogPagination';
import {
    createProviderDomainOptions,
    extractProviderDomain,
} from '@/Components/ApiCatalog/apiCatalogDomain';
import {
    DEFAULT_API_CATALOG_SORT_KEY,
    type ApiCatalogSortKey,
    sortApiCatalogItems,
} from '@/Components/ApiCatalog/apiCatalogSort';
import PublicLayout from '@/Layouts/PublicLayout';
import { mockApiCatalogItems, mockProviders } from './mockApiCatalogData';

const ITEMS_PER_PAGE = 6;
const ALL_PROVIDERS = '';
const ALL_DOMAINS = '';

type ApiCatalogFilters = {
    keyword: string;
    providerKey: string;
    domain: string;
};

type ApiCatalogPagination = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    startItem: number;
    endItem: number;
};

const defaultFilters: ApiCatalogFilters = {
    keyword: '',
    providerKey: ALL_PROVIDERS,
    domain: ALL_DOMAINS,
};

function shouldIgnorePaginationKey(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    /*
     * 一覧画面は ArrowLeft / ArrowRight でページ送りします。
     * 検索 input や select 操作中の矢印キーはフォーム側へ渡します。
     */
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

function buildPagination(totalItems: number, currentPage: number): ApiCatalogPagination {
    /*
     * モックでも本番と同じ考え方に寄せます。
     * 先に検索・並び替えを適用した件数を総件数として受け取り、その件数だけでページ数を計算します。
     */
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const clampedPage = Math.min(Math.max(1, currentPage), totalPages);
    const startItem = totalItems === 0 ? 0 : (clampedPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(totalItems, clampedPage * ITEMS_PER_PAGE);

    return {
        currentPage: clampedPage,
        totalPages,
        totalItems,
        perPage: ITEMS_PER_PAGE,
        startItem,
        endItem,
    };
}

function toApiCatalogPaginationState(pagination: ApiCatalogPagination): ApiCatalogPaginationState {
    /*
     * モック内部の startItem / endItem を、本番 props と同じ from / to へ変換します。
     * ここで差を吸収することで、ページネーション表示 Component は本番/モックを意識しません。
     */
    return {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        from: pagination.startItem,
        to: pagination.endItem,
    };
}

function currentMockListUrl() {
    /*
     * モック一覧でも本番と同じ戻り導線を検証するため、
     * 現在の一覧 URL を return_url として詳細画面へ渡します。
     */
    return `${window.location.pathname}${window.location.search}`;
}

function buildMockDetailHref(apiKey: string, returnUrl: string) {
    /*
     * モック詳細も api_key を route parameter として扱います。
     * 本番一覧との差を props へ渡す前に吸収し、ApiCatalogList / Card の挙動は共通に保ちます。
     */
    return `/api-catalog/mock/${encodeURIComponent(apiKey)}?return_url=${encodeURIComponent(returnUrl)}`;
}

function toApiCatalogListItem(
    item: (typeof mockApiCatalogItems)[number],
    returnUrl: string,
): ApiCatalogListItem {
    return {
        listKey: item.apiKey,
        apiKey: item.apiKey,
        title: item.title,
        description: item.description,
        providerKey: item.providerKey,
        serviceKey: item.serviceKey,
        preferredVersion: item.preferredVersion,
        openapiVersion: item.openapiVersion,
        detailHref: buildMockDetailHref(item.apiKey, returnUrl),
    };
}

export default function MockIndex() {
    const [filters, setFilters] = useState<ApiCatalogFilters>(defaultFilters);
    const [sortKey, setSortKey] = useState<ApiCatalogSortKey>(DEFAULT_API_CATALOG_SORT_KEY);
    const [page, setPage] = useState(1);
    const domainOptions = useMemo(
        () => createProviderDomainOptions(mockProviders.map((provider) => provider.providerKey)),
        [],
    );

    const filteredItems = useMemo(() => {
        const keyword = filters.keyword.trim().toLowerCase();

        /*
         * 本実装では検索条件を Query Action / Repository へ渡す想定です。
         * モックでは同じ検索対象に寄せるため、title / description / provider / service をReact内で絞り込み、
         * domain は本番と同じく provider_key の末尾から抽出して判定します。
         */
        return mockApiCatalogItems.filter((item) => {
            const matchesKeyword =
                keyword.length === 0 ||
                item.title.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword) ||
                item.providerKey.toLowerCase().includes(keyword) ||
                item.serviceKey.toLowerCase().includes(keyword);
            const matchesProvider =
                filters.providerKey === ALL_PROVIDERS || item.providerKey === filters.providerKey;
            const matchesDomain =
                filters.domain === ALL_DOMAINS ||
                extractProviderDomain(item.providerKey) === filters.domain;

            return matchesKeyword && matchesProvider && matchesDomain;
        });
    }, [filters]);

    const sortedItems = useMemo(() => {
        /*
         * モック側も本番仕様と同じ順番で処理します。
         * 固定データを検索で絞り込んだ後、共通 sort key で並び替えてからページングします。
         */
        return sortApiCatalogItems(filteredItems, sortKey);
    }, [filteredItems, sortKey]);

    const pagination = useMemo(
        () => buildPagination(sortedItems.length, page),
        [sortedItems.length, page],
    );

    const apiCatalogItems = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;

        /*
         * apiCatalogItems は将来 Responder から渡す主更新対象です。
         * ここでは固定データをページ単位に slice して同じ形の UI を確認します。
         */
        return sortedItems.slice(startIndex, startIndex + pagination.perPage);
    }, [sortedItems, pagination.currentPage, pagination.perPage]);

    const hasActiveFilters =
        filters.keyword !== defaultFilters.keyword ||
        filters.providerKey !== defaultFilters.providerKey ||
        filters.domain !== defaultFilters.domain;
    const canMovePrevious = pagination.currentPage > 1;
    const canMoveNext = pagination.currentPage < pagination.totalPages;
    const returnUrl = currentMockListUrl();

    const updateFilters = (nextFilters: ApiCatalogFilters) => {
        /*
         * 条件変更後の総ページ数は現在ページより小さくなることがあります。
         * 本番一覧と同じ仕様として、モック側も検索・絞り込み変更時は1ページ目へ戻します。
         */
        setFilters(nextFilters);
        setPage(1);
    };

    const updateSortKey = (nextSortKey: ApiCatalogSortKey) => {
        /*
         * 並び替え変更時は、本番一覧と同じく現在ページを1ページ目へ戻します。
         * これにより、並び替え前のページ位置が変更後の結果へ残る違和感を避けます。
         */
        setSortKey(nextSortKey);
        setPage(1);
    };

    const moveToPreviousPage = () => {
        setPage((currentPage) => Math.max(1, currentPage - 1));
    };

    const moveToNextPage = () => {
        setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1));
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (shouldIgnorePaginationKey(event.target)) {
                return;
            }

            if (event.key === 'ArrowLeft' && canMovePrevious) {
                event.preventDefault();
                moveToPreviousPage();
            }

            if (event.key === 'ArrowRight' && canMoveNext) {
                event.preventDefault();
                moveToNextPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [canMoveNext, canMovePrevious, pagination.totalPages]);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title="API Catalog Mock" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 pb-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-950/70">
                            API Discovery Hub
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.34)] sm:text-4xl">
                            API Catalog
                        </h1>
                    </div>

                    {/*
                        画面状態を示す Mock ラベルを先に置き、戻るボタンを一番右に固定します。
                        API Preview のモック入口枠へ戻る導線なので、一覧操作とは分けて扱います。
                    */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Mock
                        </span>
                        <Link
                            href="/api-preview"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            戻る
                        </Link>
                    </div>
                </header>

                <ApiCatalogFilterPanel
                    keyword={filters.keyword}
                    providerKey={filters.providerKey}
                    providerOptions={mockProviders.map((provider) => ({
                        value: provider.providerKey,
                        label: provider.providerKey,
                    }))}
                    domain={filters.domain}
                    domainOptions={domainOptions.map((domainOption) => ({
                        value: domainOption,
                        label: domainOption,
                    }))}
                    sortKey={sortKey}
                    hasActiveFilters={hasActiveFilters}
                    onKeywordChange={(keyword) =>
                        updateFilters({
                            ...filters,
                            keyword,
                        })
                    }
                    onProviderKeyChange={(providerKey) =>
                        updateFilters({
                            ...filters,
                            providerKey,
                        })
                    }
                    onDomainChange={(domain) =>
                        updateFilters({
                            ...filters,
                            domain,
                        })
                    }
                    onSortKeyChange={updateSortKey}
                    onClear={() => updateFilters(defaultFilters)}
                />

                <ApiCatalogList
                    items={apiCatalogItems.map((item) => toApiCatalogListItem(item, returnUrl))}
                />

                <ApiCatalogPagination
                    pagination={toApiCatalogPaginationState(pagination)}
                    onPrevious={moveToPreviousPage}
                    onNext={moveToNextPage}
                />
            </div>
        </PublicLayout>
    );
}
