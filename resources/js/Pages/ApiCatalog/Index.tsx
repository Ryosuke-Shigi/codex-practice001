import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import ApiCatalogList, { type ApiCatalogListItem } from '@/Components/ApiCatalog/ApiCatalogList';
import ApiCatalogPagination from '@/Components/ApiCatalog/ApiCatalogPagination';
import PublicLayout from '@/Layouts/PublicLayout';

type ApiCatalogFilters = {
    keyword: string | null;
    providerKey: string | null;
};

type ApiCatalogItem = {
    id: number;
    apiKey: string;
    title: string;
    description: string;
    providerKey: string;
    serviceKey: string | null;
    preferredVersion: string | null;
    openapiVersion: string | null;
    isActive: boolean;
    googleSearchUrl: string;
};

type ApiCatalogPagination = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    from: number | null;
    to: number | null;
};

type IndexProps = {
    /*
     * Responder から受け取る props は将来の Inertia 部分更新単位に合わせています。
     * providers は候補リストなので、検索・ページ送りでは基本的に更新しない想定です。
     */
    filters: ApiCatalogFilters;
    providers: string[];
    apiCatalogItems: ApiCatalogItem[];
    pagination: ApiCatalogPagination;
};

function shouldIgnorePaginationKey(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    // 検索欄や select 操作中の左右キーはページ送りではなく、フォーム操作を優先します。
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

function buildQueryParams(keyword: string, providerKey: string, page: number) {
    /*
     * URL query は本番一覧の状態そのものです。
     * keyword / provider_key / page を明示し、リロードしても同じ検索状態を再現できます。
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

    return params;
}

function currentListUrl() {
    /*
     * 詳細から戻るときに検索条件とページ番号を復元するため、
     * 現在の一覧 URL を query ごと return_url として詳細リンクへ渡します。
     */
    return `${window.location.pathname}${window.location.search}`;
}

function buildDetailHref(apiKey: string, returnUrl: string) {
    /*
     * 本番詳細の識別子は id ではなく APIs.guru の api_key です。
     * ":" などを含む api_key でも壊れないよう path と return_url の両方を encode します。
     */
    return `/api-catalog/${encodeURIComponent(apiKey)}?return_url=${encodeURIComponent(returnUrl)}`;
}

function toApiCatalogListItem(item: ApiCatalogItem, returnUrl: string): ApiCatalogListItem {
    return {
        listKey: item.id,
        title: item.title,
        description: item.description,
        providerKey: item.providerKey,
        serviceKey: item.serviceKey,
        preferredVersion: item.preferredVersion,
        openapiVersion: item.openapiVersion,
        googleSearchUrl: item.googleSearchUrl,
        detailHref: buildDetailHref(item.apiKey, returnUrl),
    };
}

export default function Index({ filters, providers, apiCatalogItems, pagination }: IndexProps) {
    const [keyword, setKeyword] = useState(filters.keyword ?? '');
    const [providerKey, setProviderKey] = useState(filters.providerKey ?? '');

    const canMovePrevious = pagination.currentPage > 1;
    const canMoveNext = pagination.currentPage < pagination.totalPages;
    const hasActiveFilters = keyword.trim() !== '' || providerKey !== '';
    const returnUrl = currentListUrl();

    const visitList = (nextKeyword: string, nextProviderKey: string, nextPage: number) => {
        /*
         * 検索・ページ送りは Inertia GET で再訪問します。
         * page も URL に含めることで、詳細画面から return_url で戻った時にも一覧状態を復元できます。
         * only を指定して、providers を毎回取り直さない将来構成を先に画面へ反映しています。
         */
        router.get('/api-catalog', buildQueryParams(nextKeyword, nextProviderKey, nextPage), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['filters', 'apiCatalogItems', 'pagination'],
        });
    };

    const updateKeyword = (nextKeyword: string) => {
        /*
         * 検索条件が変わると、現在の page が絞り込み後の総ページ数を超える可能性があります。
         * そのため検索入力の変更時点で必ず1ページ目から取り直します。
         */
        setKeyword(nextKeyword);
        visitList(nextKeyword, providerKey, 1);
    };

    const updateProviderKey = (nextProviderKey: string) => {
        /*
         * provider 絞り込みも検索条件の一部です。
         * keyword と同じく、条件変更後の存在しないページへ残らないよう1ページ目へ戻します。
         */
        setProviderKey(nextProviderKey);
        visitList(keyword, nextProviderKey, 1);
    };

    const clearFilters = () => {
        setKeyword('');
        setProviderKey('');
        visitList('', '', 1);
    };

    const moveToPreviousPage = () => {
        if (!canMovePrevious) {
            return;
        }

        visitList(keyword, providerKey, pagination.currentPage - 1);
    };

    const moveToNextPage = () => {
        if (!canMoveNext) {
            return;
        }

        visitList(keyword, providerKey, pagination.currentPage + 1);
    };

    useEffect(() => {
        // Inertia の戻る/進むや部分更新後も、フォーム表示を最新 props と同期します。
        setKeyword(filters.keyword ?? '');
        setProviderKey(filters.providerKey ?? '');
    }, [filters.keyword, filters.providerKey]);

    useEffect(() => {
        // 一覧画面全体の操作として、左右矢印キーでもページ移動できるようにします。
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
    }, [canMoveNext, canMovePrevious, keyword, providerKey, pagination.currentPage]);

    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title="API Catalog" />

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
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Live
                        </span>
                        <Link
                            href="/api-preview"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            戻る
                        </Link>
                    </div>
                </header>

                <section className="rounded-2xl border border-white/35 bg-slate-950/32 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_40px_rgba(2,24,45,0.20)] backdrop-blur-2xl">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(12rem,0.8fr)_auto] lg:items-end">
                        <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                            <span>Keyword</span>
                            <input
                                type="search"
                                value={keyword}
                                onChange={(event) => updateKeyword(event.target.value)}
                                placeholder="title / description / provider / service"
                                className="h-11 rounded-xl border border-white/30 bg-white/18 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.34)] outline-none backdrop-blur-xl placeholder:text-cyan-50/55 focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-semibold text-cyan-50">
                            <span>Provider</span>
                            <select
                                value={providerKey}
                                onChange={(event) => updateProviderKey(event.target.value)}
                                className="h-11 rounded-xl border border-white/30 bg-white/18 px-3 text-sm text-white outline-none backdrop-blur-xl focus:border-cyan-100/80 focus:ring-4 focus:ring-cyan-100/25"
                            >
                                <option value="">All providers</option>
                                {providers.map((provider) => (
                                    <option key={provider} value={provider}>
                                        {provider}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={!hasActiveFilters}
                            className="h-11 rounded-xl border border-white/35 bg-white/18 px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            Clear
                        </button>
                    </div>
                </section>

                <ApiCatalogList
                    items={apiCatalogItems.map((item) => toApiCatalogListItem(item, returnUrl))}
                />

                <ApiCatalogPagination
                    pagination={pagination}
                    onPrevious={moveToPreviousPage}
                    onNext={moveToNextPage}
                />
            </div>
        </PublicLayout>
    );
}
