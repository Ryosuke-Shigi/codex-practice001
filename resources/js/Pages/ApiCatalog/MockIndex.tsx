import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

import PublicLayout from '@/Layouts/PublicLayout';
import { mockApiCatalogItems, mockDomains, mockProviders } from './mockApiCatalogData';

const ITEMS_PER_PAGE = 6;
const ALL_PROVIDERS = 'all';
const ALL_DOMAINS = 'all';

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

export default function MockIndex() {
    const [filters, setFilters] = useState<ApiCatalogFilters>(defaultFilters);
    const [page, setPage] = useState(1);

    const filteredItems = useMemo(() => {
        const keyword = filters.keyword.trim().toLowerCase();

        /*
         * 本実装では検索条件を Query Action / Repository へ渡す想定です。
         * モックでは Inertia 部分更新後の props 分割を意識しつつ、React 内で絞り込みます。
         */
        return mockApiCatalogItems.filter((item) => {
            const matchesKeyword =
                keyword.length === 0 ||
                item.title.toLowerCase().includes(keyword) ||
                item.apiKey.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword);
            const matchesProvider =
                filters.providerKey === ALL_PROVIDERS || item.providerKey === filters.providerKey;
            const matchesDomain = filters.domain === ALL_DOMAINS || item.domain === filters.domain;

            return matchesKeyword && matchesProvider && matchesDomain;
        });
    }, [filters]);

    const pagination = useMemo(
        () => buildPagination(filteredItems.length, page),
        [filteredItems.length, page],
    );

    const apiCatalogItems = useMemo(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;

        /*
         * apiCatalogItems は将来 Responder から渡す主更新対象です。
         * ここでは固定データをページ単位に slice して同じ形の UI を確認します。
         */
        return filteredItems.slice(startIndex, startIndex + pagination.perPage);
    }, [filteredItems, pagination.currentPage, pagination.perPage]);

    const hasActiveFilters =
        filters.keyword !== defaultFilters.keyword ||
        filters.providerKey !== defaultFilters.providerKey ||
        filters.domain !== defaultFilters.domain;
    const canMovePrevious = pagination.currentPage > 1;
    const canMoveNext = pagination.currentPage < pagination.totalPages;

    const updateFilters = (nextFilters: ApiCatalogFilters) => {
        setFilters(nextFilters);
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

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/api-preview"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            戻る
                        </Link>
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Mock
                        </span>
                    </div>
                </header>

                <section className="rounded-2xl border border-white/35 bg-slate-950/32 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(10rem,0.8fr)_minmax(10rem,0.8fr)_auto] lg:items-end">
                        <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                            <span>Keyword</span>
                            <input
                                type="search"
                                value={filters.keyword}
                                onChange={(event) =>
                                    updateFilters({
                                        ...filters,
                                        keyword: event.target.value,
                                    })
                                }
                                placeholder="title / apiKey / description"
                                className="h-11 rounded-xl border border-white/30 bg-white/18 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.34)] outline-none backdrop-blur-xl placeholder:text-cyan-50/55 focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                            <span>Provider</span>
                            <select
                                value={filters.providerKey}
                                onChange={(event) =>
                                    updateFilters({
                                        ...filters,
                                        providerKey: event.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border border-white/30 bg-white/18 px-3 text-sm text-white outline-none backdrop-blur-xl focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                            >
                                <option value={ALL_PROVIDERS}>All providers</option>
                                {mockProviders.map((provider) => (
                                    <option key={provider.providerKey} value={provider.providerKey}>
                                        {provider.providerKey}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                            <span>Domain</span>
                            <select
                                value={filters.domain}
                                onChange={(event) =>
                                    updateFilters({
                                        ...filters,
                                        domain: event.target.value,
                                    })
                                }
                                className="h-11 rounded-xl border border-white/30 bg-white/18 px-3 text-sm text-white outline-none backdrop-blur-xl focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                            >
                                <option value={ALL_DOMAINS}>All domains</option>
                                {mockDomains.map((domain) => (
                                    <option key={domain} value={domain}>
                                        {domain}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={() => updateFilters(defaultFilters)}
                            disabled={!hasActiveFilters}
                            className="h-11 rounded-xl border border-white/35 bg-white/18 px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            Clear
                        </button>
                    </div>
                </section>

                <section className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {apiCatalogItems.map((item, index) => (
                        <motion.article
                            key={item.apiKey}
                            className="flex min-h-[186px] flex-col rounded-2xl border border-white/35 bg-slate-950/38 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_38px_rgba(2,24,45,0.22)] backdrop-blur-2xl"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: index * 0.035,
                                duration: 0.36,
                                ease: 'easeOut',
                            }}
                            whileHover={{ y: -3 }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-cyan-100/70">
                                        {item.providerKey} / {item.serviceKey}
                                    </p>
                                    <h2 className="mt-1 truncate text-lg font-semibold leading-tight text-white">
                                        {item.title}
                                    </h2>
                                </div>

                                <span className="shrink-0 rounded-full border border-cyan-100/35 bg-cyan-50/15 px-2.5 py-1 text-[0.68rem] font-semibold text-cyan-50">
                                    {item.preferredVersion}
                                </span>
                            </div>

                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-cyan-50/86">
                                {item.description}
                            </p>

                            {/*
                                詳細と Search は別リンクにしています。
                                Google 検索を押した時に詳細画面へ遷移しないよう、カード全体クリックにはしていません。
                            */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                    href={`/api-catalog/mock/${encodeURIComponent(item.apiKey)}`}
                                    className="inline-flex min-h-9 items-center justify-center rounded-lg bg-cyan-200 px-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                                >
                                    詳細
                                </Link>

                                <a
                                    href={item.googleSearchUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-cyan-100/35 bg-cyan-50/15 px-3 text-sm font-bold text-cyan-50 transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30"
                                >
                                    Search
                                </a>
                            </div>
                        </motion.article>
                    ))}

                    {apiCatalogItems.length === 0 && (
                        <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-2xl border border-white/30 bg-slate-950/32 p-8 text-center text-sm font-semibold text-cyan-50/82 backdrop-blur-2xl">
                            条件に一致するAPIはありません
                        </div>
                    )}
                </section>

                <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/30 bg-slate-950/28 px-4 py-3 text-sm text-cyan-50/82 backdrop-blur-2xl">
                    <p>
                        {pagination.startItem}-{pagination.endItem} / {pagination.totalItems}
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={moveToPreviousPage}
                            disabled={!canMovePrevious}
                            aria-label="前のページ"
                            className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-white/18 text-xl font-bold text-white shadow-[0_10px_22px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            ←
                        </button>

                        <p className="min-w-[6.5rem] text-center text-sm font-semibold text-white">
                            {pagination.currentPage} / {pagination.totalPages}
                        </p>

                        <button
                            type="button"
                            onClick={moveToNextPage}
                            disabled={!canMoveNext}
                            aria-label="次のページ"
                            className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-white/18 text-xl font-bold text-white shadow-[0_10px_22px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            →
                        </button>
                    </div>
                </footer>
            </div>
        </PublicLayout>
    );
}
