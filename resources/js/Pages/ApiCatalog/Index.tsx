import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';

import ApiCatalogFilterPanel from '@/Components/ApiCatalog/ApiCatalogFilterPanel';
import ApiCatalogList from '@/Components/ApiCatalog/ApiCatalogList';
import ApiCatalogPagination from '@/Components/ApiCatalog/ApiCatalogPagination';
import { createProviderDomainOptions } from '@/Components/ApiCatalog/apiCatalogDomain';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import useSwipeNavigation from '@/Hooks/useSwipeNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

import ApiCatalogResultsSummary from '@/Components/ApiCatalog/ApiCatalogResultsSummary';
import ApiCatalogSyncNotice from '@/Components/ApiCatalog/ApiCatalogSyncNotice';
import { toApiCatalogListItem } from './apiCatalogIndexUtils';
import { useApiCatalogSync } from './hooks/useApiCatalogSync';
import { useApiCatalogSearch } from './hooks/useApiCatalogSearch';
import type { ApiCatalogIndexProps } from './types';

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
    return target.closest('input, textarea, select, button, a, summary, [contenteditable="true"]') !== null;
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
    const { keyword, providerKey, domain, sortKey, visiblePagination, setVisiblePagination,
        isSearching, isUnconfirmed, searchError, canMovePrevious, canMoveNext, hasActiveFilters,
        updateKeyword, updateProviderKey, updateDomain, updateSortKey, clearFilters,
        moveToPreviousPage, moveToNextPage, retrySearch } = useApiCatalogSearch(filters, pagination);
    const { syncStatus, isSyncButtonDisabled, syncMessage, showSyncResult, startPoolSync } = useApiCatalogSync({
        initialSyncStatus, getReturnUrl: currentListUrl, onPaginationReloaded: setVisiblePagination,
    });
    const returnUrl = currentListUrl();
    const domainFilterOptions = domains.length > 0 ? domains : createProviderDomainOptions(providers);

    useSwipeNavigation({
        // 左スワイプでは次のページへ進みます。
        onSwipeLeft: moveToNextPage,
        // 右スワイプでは前のページへ戻ります。
        onSwipeRight: moveToPreviousPage,
    });

    useEffect(() => {
        // 一覧画面全体の操作として、左右矢印キーでもページ移動できるようにします。
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || shouldIgnorePaginationKey(event.target)) {
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
                <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-slate-950/80 p-4 text-white">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
                            API Discovery Hub
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.34)] sm:text-4xl">
                            API Catalog
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-50/86 drop-shadow-[0_8px_20px_rgba(3,25,48,0.22)]">
                            公開APIを用途や提供元で探し、版と仕様書を比較できます。
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-xl">
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

                <ApiCatalogSyncNotice message={syncMessage} status={syncStatus} showResult={showSyncResult} />

                <ApiCatalogResultsSummary keyword={keyword} providerKey={providerKey} domain={domain} sortKey={sortKey}
                    totalItems={visiblePagination.totalItems} isUpdating={isSearching} isUnconfirmed={isUnconfirmed}
                    onKeywordRemove={() => updateKeyword('')} onProviderRemove={() => updateProviderKey('')}
                    onDomainRemove={() => updateDomain('')} />

                {searchError && <div role="alert" className="rounded-2xl bg-slate-950/80 p-4 text-white">
                    <p>{searchError}</p><button type="button" onClick={retrySearch} className="mt-2 min-h-11 rounded-xl border px-4">再試行</button>
                </div>}
                <ApiCatalogList items={isUnconfirmed ? [] : apiCatalogItems.map(item => toApiCatalogListItem(item, returnUrl))}
                    isLoading={isSearching || isUnconfirmed} loadingMessage={searchError ? '条件を変更するか、再試行してください' : '検索結果を更新しています'} />

                {!isSearching && !isUnconfirmed && <ApiCatalogPagination pagination={visiblePagination}
                    onPrevious={moveToPreviousPage} onNext={moveToNextPage} />}

            </div>
        </PublicLayout>
    );
}
