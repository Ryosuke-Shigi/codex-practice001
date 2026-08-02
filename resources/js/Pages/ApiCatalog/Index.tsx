import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import DirectionalNavigationButton from '@/Components/DirectionalNavigationButton';
import ApiCatalogFilterPanel from '@/Components/ApiCatalog/ApiCatalogFilterPanel';
import ApiCatalogList from '@/Components/ApiCatalog/ApiCatalogList';
import ApiCatalogPagination from '@/Components/ApiCatalog/ApiCatalogPagination';
import { createProviderDomainOptions } from '@/Components/ApiCatalog/apiCatalogDomain';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import {
    type ApiCatalogSortKey,
    normalizeApiCatalogSortKey,
} from '@/Components/ApiCatalog/apiCatalogSort';
import useSwipeNavigation from '@/Hooks/useSwipeNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

import {
    buildApiCatalogQueryParams,
    buildOptimisticPagination,
    isApiCatalogPagination,
    toApiCatalogListItem,
} from './apiCatalogIndexUtils';
import { useApiCatalogSync } from './hooks/useApiCatalogSync';
import type {
    ApiCatalogIndexProps,
    ApiCatalogPagination as ApiCatalogPaginationState,
} from './types';

/*
 * 本番 API 一覧の戻るボタンは、ブラウザ履歴や直前画面には依存しません。
 * 画面内ボタンは API Discovery Hub の開発段階選択へ戻します。
 */
const apiDiscoveryHubReturn = getStageProjectReturnLink('api-discovery-hub');

function shouldIgnorePaginationKey(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    // 検索欄や select 操作中の左右キーはページ送りではなく、フォーム操作を優先します。
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
}

function currentListUrl() {
    /*
     * 詳細から戻るときに検索条件とページ番号を復元するため、
     * 現在の一覧 URL を query ごと return_url として詳細リンクへ渡します。
     */
    return `${window.location.pathname}${window.location.search}`;
}

/**
 * APIカタログ本番一覧のページコンポーネントです。
 *
 * Inertia props で受け取った一覧・検索候補・同期状態を表示し、検索、ページ送り、
 * 同期開始の入口を扱います。検索条件のDB適用、同期本体、同期状態の定期取得はLaravel側と専用フックへ委譲します。
 */
export default function Index({
    filters,
    providers,
    domains,
    apiCatalogItems,
    pagination,
    syncStatus: initialSyncStatus,
}: ApiCatalogIndexProps) {
    const [keyword, setKeyword] = useState(filters.keyword ?? '');
    const [providerKey, setProviderKey] = useState(filters.providerKey ?? '');
    const [domain, setDomain] = useState(filters.domain ?? '');
    const [sortKey, setSortKey] = useState<ApiCatalogSortKey>(
        normalizeApiCatalogSortKey(filters.sortKey),
    );
    const [visiblePagination, setVisiblePagination] = useState<ApiCatalogPaginationState>(
        pagination,
    );
    const {
        syncStatus,
        isSyncButtonDisabled,
        syncMessage,
        showSyncResult,
        startPoolSync,
    } = useApiCatalogSync({
        initialSyncStatus,
        getReturnUrl: currentListUrl,
        onPaginationReloaded: setVisiblePagination,
    });

    const canMovePrevious = visiblePagination.currentPage > 1;
    const canMoveNext = visiblePagination.currentPage < visiblePagination.totalPages;
    const hasActiveFilters = keyword.trim() !== '' || providerKey !== '' || domain !== '';
    const returnUrl = currentListUrl();
    const domainFilterOptions = domains.length > 0
        ? domains
        : createProviderDomainOptions(providers);

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
             *
             * preserveState のまま partial reload すると、カード props が先に切り替わって見えても
             * pagination 表示だけ古い props を参照しているように見える瞬間がありました。
             * そのため遷移開始時に表示用 pagination を暫定更新し、成功時にサーバー計算済みの pagination で確定します。
             */
            setVisiblePagination((currentPagination) =>
                buildOptimisticPagination(currentPagination, nextPage),
            );

            router.get(
                '/api-catalog',
                buildApiCatalogQueryParams(
                    nextKeyword,
                    nextProviderKey,
                    nextDomain,
                    nextSortKey,
                    nextPage,
                ),
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['filters', 'apiCatalogItems', 'pagination'],
                    onSuccess: (page) => {
                        const nextPagination = page.props.pagination;

                        if (isApiCatalogPagination(nextPagination)) {
                            setVisiblePagination(nextPagination);
                        }
                    },
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

        visitList(keyword, providerKey, domain, sortKey, visiblePagination.currentPage - 1);
    }, [
        canMovePrevious,
        domain,
        keyword,
        providerKey,
        sortKey,
        visiblePagination.currentPage,
        visitList,
    ]);

    const moveToNextPage = useCallback(() => {
        if (!canMoveNext) {
            return;
        }

        visitList(keyword, providerKey, domain, sortKey, visiblePagination.currentPage + 1);
    }, [
        canMoveNext,
        domain,
        keyword,
        providerKey,
        sortKey,
        visiblePagination.currentPage,
        visitList,
    ]);

    useSwipeNavigation({
        // 左スワイプでは次のページへ進みます。
        onSwipeLeft: moveToNextPage,
        // 右スワイプでは前のページへ戻ります。
        onSwipeRight: moveToPreviousPage,
    });

    useEffect(() => {
        /*
         * Inertia の戻る/進むや部分更新後も、フォーム表示とページ表示を最新 props と同期します。
         * visiblePagination はクリック直後に暫定更新するため、サーバー確定値を受けたタイミングで必ず戻します。
         */
        setKeyword(filters.keyword ?? '');
        setProviderKey(filters.providerKey ?? '');
        setDomain(filters.domain ?? '');
        setSortKey(normalizeApiCatalogSortKey(filters.sortKey));
        setVisiblePagination(pagination);
    }, [filters.keyword, filters.providerKey, filters.domain, filters.sortKey, pagination]);

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
                            本番API一覧はブラウザ履歴や直前画面ではなく、
                            API Discovery Hub の開発段階選択へ明示的に戻します。
                        */}
                        <Link
                            href={apiDiscoveryHubReturn.href}
                            aria-label={apiDiscoveryHubReturn.ariaLabel}
                            title={apiDiscoveryHubReturn.title}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/35 bg-white/18 px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,24,45,0.16)] backdrop-blur-xl transition hover:bg-white/28 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                        >
                            {apiDiscoveryHubReturn.label}
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
                    pagination={visiblePagination}
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
