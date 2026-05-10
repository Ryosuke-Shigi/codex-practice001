import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import DirectionalNavigationButton from '@/Components/DirectionalNavigationButton';
import ApiCatalogFilterPanel from '@/Components/ApiCatalog/ApiCatalogFilterPanel';
import ApiCatalogList, { type ApiCatalogListItem } from '@/Components/ApiCatalog/ApiCatalogList';
import ApiCatalogPagination from '@/Components/ApiCatalog/ApiCatalogPagination';
import { createProviderDomainOptions } from '@/Components/ApiCatalog/apiCatalogDomain';
import {
    DEFAULT_API_CATALOG_SORT_KEY,
    type ApiCatalogSortKey,
    normalizeApiCatalogSortKey,
} from '@/Components/ApiCatalog/apiCatalogSort';
import useSwipeNavigation from '@/Hooks/useSwipeNavigation';
import PublicLayout from '@/Layouts/PublicLayout';
import type { ApiCatalogNoteItem } from '@/Components/ApiCatalog/ApiCatalogNotesPanel';

/*
 * 本番 API 一覧の戻るボタンは、ブラウザ履歴や直前画面には依存しません。
 * Preview から本番一覧を開いた履歴があっても、画面内ボタンは本番導線の入口へ戻します。
 */
const API_CATALOG_ENTRY_HREF = '/lab';
const API_CATALOG_SYNC_POLL_INTERVAL_MS = 2500;

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
    notes?: ApiCatalogNoteItem[];
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

type ApiCatalogSyncResult = {
    totalCount: number;
    insertedCount: number;
    updatedCount: number;
    skippedCount: number;
    inactiveCount: number;
    failedCount: number;
};

type ApiCatalogSyncStatus = {
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

type ApiCatalogSyncStatusResponse = {
    syncStatus: ApiCatalogSyncStatus | null;
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
    syncStatus: ApiCatalogSyncStatus | null;
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
        notes: item.notes ?? [],
        detailHref: buildDetailHref(item.apiKey, returnUrl),
    };
}

function apiCatalogSyncStatusMessage(
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
     * worker が止まっている、または failed hook まで届かない落ち方をした可能性があるため、
     * ボタンは戻しつつ、画面文言では運用確認が必要な状態として出します。
     */
    if (status.isStale) {
        return '同期状態が一定時間更新されませんでした。Queue worker の状態を確認してください。';
    }

    if (status.status === 'queued') {
        /*
         * queued は同期本体がまだ始まっていない状態です。
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

function shouldShowSyncResult(status: ApiCatalogSyncStatus | null) {
    return status !== null && !status.isRunning;
}

export default function Index({
    filters,
    providers,
    domains,
    apiCatalogItems,
    pagination,
    syncStatus: initialSyncStatus,
}: IndexProps) {
    const [keyword, setKeyword] = useState(filters.keyword ?? '');
    const [providerKey, setProviderKey] = useState(filters.providerKey ?? '');
    const [domain, setDomain] = useState(filters.domain ?? '');
    const [sortKey, setSortKey] = useState<ApiCatalogSortKey>(
        normalizeApiCatalogSortKey(filters.sortKey),
    );
    const [syncStatus, setSyncStatus] = useState<ApiCatalogSyncStatus | null>(initialSyncStatus);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [syncPollingError, setSyncPollingError] = useState<string | null>(null);

    const canMovePrevious = pagination.currentPage > 1;
    const canMoveNext = pagination.currentPage < pagination.totalPages;
    const hasActiveFilters = keyword.trim() !== '' || providerKey !== '' || domain !== '';
    const returnUrl = currentListUrl();
    const domainFilterOptions = domains.length > 0 ? domains : createProviderDomainOptions(providers);
    const isSyncButtonDisabled = isStartingSync || (syncStatus?.isRunning ?? false);
    const syncMessage = apiCatalogSyncStatusMessage(syncStatus, isStartingSync, syncPollingError);
    const showSyncResult = shouldShowSyncResult(syncStatus);

    const visitList = useCallback(
        (
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
        },
        [],
    );

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

    const moveToPreviousPage = useCallback(() => {
        if (!canMovePrevious) {
            return;
        }

        visitList(keyword, providerKey, domain, sortKey, pagination.currentPage - 1);
    }, [
        canMovePrevious,
        domain,
        keyword,
        pagination.currentPage,
        providerKey,
        sortKey,
        visitList,
    ]);

    const moveToNextPage = useCallback(() => {
        if (!canMoveNext) {
            return;
        }

        visitList(keyword, providerKey, domain, sortKey, pagination.currentPage + 1);
    }, [canMoveNext, domain, keyword, pagination.currentPage, providerKey, sortKey, visitList]);

    useSwipeNavigation({
        // Left swipe means the finger moves left, so the list advances to the next page.
        onSwipeLeft: moveToNextPage,
        // Right swipe moves back to the previous page.
        onSwipeRight: moveToPreviousPage,
    });

    const startPoolSync = async () => {
        /*
         * プール更新は本番一覧から開始します。
         * 同期本体はLaravel側のJob/Queueへ渡し、Reactは同期状態IDをポーリングします。
         *
         * POST成功は「同期が終わった」ではなく「Job登録を受け付けた」という意味です。
         * 完了扱いは状態取得APIが completed / failed を返したときだけに限定します。
         */
        if (isSyncButtonDisabled) {
            return;
        }

        setIsStartingSync(true);
        setSyncPollingError(null);

        try {
            const response = await axios.post<ApiCatalogSyncStatusResponse>(
                '/api-catalog/sync',
                {
                    return_url: currentListUrl(),
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setSyncStatus(response.data.syncStatus);
        } catch {
            setSyncPollingError('APIカタログ同期の開始に失敗しました');
        } finally {
            setIsStartingSync(false);
        }
    };

    useEffect(() => {
        setSyncStatus(initialSyncStatus);
    }, [
        initialSyncStatus,
        initialSyncStatus?.id,
        initialSyncStatus?.status,
        initialSyncStatus?.updatedAt,
    ]);

    useEffect(() => {
        if (syncStatus === null || !syncStatus.isRunning) {
            return;
        }

        let isActive = true;
        let timeoutId: number | undefined;

        const pollSyncStatus = async () => {
            try {
                const response = await axios.get<ApiCatalogSyncStatusResponse>(
                    '/api-catalog/sync/status',
                    {
                        params: {
                            sync_id: syncStatus.id,
                        },
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!isActive) {
                    return;
                }

                const nextStatus = response.data.syncStatus;

                if (nextStatus !== null) {
                    setSyncStatus(nextStatus);
                    setSyncPollingError(null);

                    if (!nextStatus.isRunning) {
                        router.reload({
                            only: ['filters', 'apiCatalogItems', 'pagination', 'syncStatus'],
                        });

                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setSyncPollingError('同期状態の取得に失敗しました');
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(pollSyncStatus, API_CATALOG_SYNC_POLL_INTERVAL_MS);
            }
        };

        timeoutId = window.setTimeout(pollSyncStatus, API_CATALOG_SYNC_POLL_INTERVAL_MS);

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [syncStatus?.id, syncStatus?.isRunning]);

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
    }, [canMoveNext, canMovePrevious, moveToNextPage, moveToPreviousPage]);

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
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-50/86 drop-shadow-[0_8px_20px_rgba(3,25,48,0.22)]">
                            APIs.guru の公開APIカタログを同期キャッシュとして取り込み、このアプリ内の指標で公開APIを探す補助とAPI調査の入口にします。
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-950/70 backdrop-blur-xl">
                            Live
                        </span>
                        {/*
                            更新操作の入口は本番API一覧に集約します。
                            外部API疎通確認用の画面とは別の本番導線として扱います。
                        */}
                        <button
                            type="button"
                            onClick={startPoolSync}
                            disabled={isSyncButtonDisabled}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-100/35 bg-cyan-50/15 px-4 text-sm font-bold text-cyan-50 shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-cyan-50/24 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/30 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isSyncButtonDisabled ? '同期中' : '同期開始'}
                        </button>
                        {/*
                            本番API一覧は Lab 配下の独立した本番導線です。
                            ブラウザ履歴や直前画面ではなく、上位の実験入口へ明示的に戻します。
                        */}
                        <Link
                            href={API_CATALOG_ENTRY_HREF}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            Labへ戻る
                        </Link>
                    </div>
                </header>

                {syncMessage && (
                    /*
                        aria-live で同期状態を読み上げ対象にし、Job / Queue の進行を画面上でも見えるようにします。
                    */
                    <div
                        role="status"
                        aria-live="polite"
                        className="rounded-2xl border border-cyan-100/35 bg-cyan-50/15 px-4 py-3 text-sm font-semibold text-cyan-50 shadow-[0_12px_26px_rgba(2,24,45,0.14)] backdrop-blur-2xl"
                    >
                        <div>{syncMessage}</div>
                        {showSyncResult && syncStatus && (
                            <div className="mt-2 text-xs font-bold text-cyan-950/70">
                                新規: {syncStatus.result.insertedCount}件 / 更新:{' '}
                                {syncStatus.result.updatedCount}件 / スキップ:{' '}
                                {syncStatus.result.skippedCount}件 / 失敗:{' '}
                                {syncStatus.result.failedCount}件
                            </div>
                        )}
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

            <DirectionalNavigationButton
                direction="previous"
                ariaLabel="前のAPI一覧ページへ移動"
                onClick={moveToPreviousPage}
                disabled={!canMovePrevious}
            />

            <DirectionalNavigationButton
                direction="next"
                ariaLabel="次のAPI一覧ページへ移動"
                onClick={moveToNextPage}
                disabled={!canMoveNext}
            />
        </PublicLayout>
    );
}
