import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import ApiCatalogFilterPanel from '@/Components/ApiCatalog/ApiCatalogFilterPanel';
import ApiCatalogList, { type ApiCatalogListItem } from '@/Components/ApiCatalog/ApiCatalogList';
import ApiCatalogPagination from '@/Components/ApiCatalog/ApiCatalogPagination';
import { createProviderDomainOptions } from '@/Components/ApiCatalog/apiCatalogDomain';
import {
    DEFAULT_API_CATALOG_SORT_KEY,
    type ApiCatalogSortKey,
    normalizeApiCatalogSortKey,
} from '@/Components/ApiCatalog/apiCatalogSort';
import PublicLayout from '@/Layouts/PublicLayout';

type ApiCatalogFilters = {
    keyword: string | null;
    providerKey: string | null;
    domain: string | null;
    sortKey: ApiCatalogSortKey;
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
     * providers/domains は候補リストなので、検索・ページ送りでは基本的に更新しない想定です。
     */
    filters: ApiCatalogFilters;
    providers: string[];
    domains: string[];
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

function buildQueryParams(
    keyword: string,
    providerKey: string,
    domain: string,
    sortKey: ApiCatalogSortKey,
    page: number,
) {
    /*
     * URL query は本番一覧の状態そのものです。
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
        apiKey: item.apiKey,
        title: item.title,
        description: item.description,
        providerKey: item.providerKey,
        serviceKey: item.serviceKey,
        preferredVersion: item.preferredVersion,
        openapiVersion: item.openapiVersion,
        detailHref: buildDetailHref(item.apiKey, returnUrl),
    };
}

export default function Index({ filters, providers, domains, apiCatalogItems, pagination }: IndexProps) {
    const [keyword, setKeyword] = useState(filters.keyword ?? '');
    const [providerKey, setProviderKey] = useState(filters.providerKey ?? '');
    const [domain, setDomain] = useState(filters.domain ?? '');
    const [sortKey, setSortKey] = useState<ApiCatalogSortKey>(
        normalizeApiCatalogSortKey(filters.sortKey),
    );
    const [isPoolSyncing, setIsPoolSyncing] = useState(false);
    const [poolSyncMessage, setPoolSyncMessage] = useState<string | null>(null);

    const canMovePrevious = pagination.currentPage > 1;
    const canMoveNext = pagination.currentPage < pagination.totalPages;
    const hasActiveFilters = keyword.trim() !== '' || providerKey !== '' || domain !== '';
    const returnUrl = currentListUrl();
    const domainFilterOptions = domains.length > 0 ? domains : createProviderDomainOptions(providers);

    const visitList = (
        nextKeyword: string,
        nextProviderKey: string,
        nextDomain: string,
        nextSortKey: ApiCatalogSortKey,
        nextPage: number,
    ) => {
        /*
         * 検索・ページ送りは Inertia GET で再訪問します。
         * sort と page も URL に含めることで、詳細画面から return_url で戻った時にも一覧状態を復元できます。
         * only を指定して、候補リストを毎回取り直さない将来構成を先に画面へ反映しています。
         */
        router.get(
            '/api-catalog',
            buildQueryParams(nextKeyword, nextProviderKey, nextDomain, nextSortKey, nextPage),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['filters', 'apiCatalogItems', 'pagination'],
            },
        );
    };

    const updateKeyword = (nextKeyword: string) => {
        /*
         * 検索条件が変わると、現在の page が絞り込み後の総ページ数を超える可能性があります。
         * そのため検索入力の変更時点で必ず1ページ目から取り直します。
         */
        setKeyword(nextKeyword);
        visitList(nextKeyword, providerKey, domain, sortKey, 1);
    };

    const updateProviderKey = (nextProviderKey: string) => {
        /*
         * provider 絞り込みも検索条件の一部です。
         * keyword と同じく、条件変更後の存在しないページへ残らないよう1ページ目へ戻します。
         */
        setProviderKey(nextProviderKey);
        visitList(keyword, nextProviderKey, domain, sortKey, 1);
    };

    const updateDomain = (nextDomain: string) => {
        /*
         * domain は provider_key の末尾から抽出した絞り込み条件です。
         * 専用カラムを増やさずに本番/モックの検索UIを揃え、条件変更時は1ページ目へ戻します。
         */
        setDomain(nextDomain);
        visitList(keyword, providerKey, nextDomain, sortKey, 1);
    };

    const updateSortKey = (nextSortKey: ApiCatalogSortKey) => {
        /*
         * 並び替えは検索後の結果セットに対して適用します。
         * sort 変更前の page が変更後の並びでは別の位置を指すため、本番/モック共通で1ページ目へ戻します。
         */
        setSortKey(nextSortKey);
        visitList(keyword, providerKey, domain, nextSortKey, 1);
    };

    const clearFilters = () => {
        setKeyword('');
        setProviderKey('');
        setDomain('');
        visitList('', '', '', sortKey, 1);
    };

    const moveToPreviousPage = () => {
        if (!canMovePrevious) {
            return;
        }

        visitList(keyword, providerKey, domain, sortKey, pagination.currentPage - 1);
    };

    const moveToNextPage = () => {
        if (!canMoveNext) {
            return;
        }

        visitList(keyword, providerKey, domain, sortKey, pagination.currentPage + 1);
    };

    const startPoolSync = () => {
        /*
         * プール更新は本番一覧から開始します。
         * 同期本体はLaravel側のJob/Queueへ渡し、Reactはクリック操作と登録状態の表示だけを担当します。
         * return_url に現在の一覧URLを渡すことで、検索・並び替え・ページ番号をPOST後も保ちます。
         *
         * POST成功は「同期が終わった」ではなく「Job登録を受け付けた」という意味です。
         * ここでは一覧データを完了済みとして扱わず、worker の実行結果は別の状態表示で扱います。
         */
        setIsPoolSyncing(true);
        setPoolSyncMessage('プール更新をキューに登録しています...');

        router.post(
            '/api-catalog/sync',
            {
                return_url: currentListUrl(),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    /*
                     * React は Job 完了を検知しないため、登録完了だけを表示します。
                     * 一覧反映の確認や完了通知は、同期状態を扱う別導線の責務です。
                     * 完了・失敗・差分件数を画面で扱う場合は、同期履歴やポーリング API を追加してから行います。
                     */
                    setPoolSyncMessage(
                        'プール更新をキューに登録しました。反映には少し時間がかかる場合があります。',
                    );
                },
                onError: () => {
                    setPoolSyncMessage('プール更新の登録に失敗しました。時間をおいて再度お試しください。');
                },
                onFinish: () => {
                    setIsPoolSyncing(false);
                },
            },
        );
    };

    useEffect(() => {
        // Inertia の戻る/進むや部分更新後も、フォーム表示を最新 props と同期します。
        setKeyword(filters.keyword ?? '');
        setProviderKey(filters.providerKey ?? '');
        setDomain(filters.domain ?? '');
        setSortKey(normalizeApiCatalogSortKey(filters.sortKey));
    }, [filters.keyword, filters.providerKey, filters.domain, filters.sortKey]);

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
    }, [canMoveNext, canMovePrevious, keyword, providerKey, domain, sortKey, pagination.currentPage]);

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
                        {/*
                            更新操作の入口は本番API一覧に集約します。
                            API Preview は外部API疎通確認用なので、同じボタンをPreview側には置きません。
                        */}
                        <button
                            type="button"
                            onClick={startPoolSync}
                            disabled={isPoolSyncing}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-sm font-bold text-cyan-50 shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isPoolSyncing ? '登録中' : 'プール更新'}
                        </button>
                        <Link
                            href="/api-preview"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            戻る
                        </Link>
                    </div>
                </header>

                {poolSyncMessage && (
                    /*
                        aria-live で開始状態を読み上げ対象にし、画面上でも操作結果を見えるようにします。
                    */
                    <div
                        role="status"
                        aria-live="polite"
                        className="rounded-2xl border border-cyan-100/35 bg-cyan-50/15 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_12px_26px_rgba(2,24,45,0.14)] backdrop-blur-2xl"
                    >
                        {poolSyncMessage}
                    </div>
                )}

                <ApiCatalogFilterPanel
                    keyword={keyword}
                    providerKey={providerKey}
                    providerOptions={providers.map((provider) => ({
                        value: provider,
                        label: provider,
                    }))}
                    domain={domain}
                    domainOptions={domainFilterOptions.map((domainOption) => ({
                        value: domainOption,
                        label: domainOption,
                    }))}
                    sortKey={sortKey}
                    hasActiveFilters={hasActiveFilters}
                    onKeywordChange={updateKeyword}
                    onProviderKeyChange={updateProviderKey}
                    onDomainChange={updateDomain}
                    onSortKeyChange={updateSortKey}
                    onClear={clearFilters}
                />

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
