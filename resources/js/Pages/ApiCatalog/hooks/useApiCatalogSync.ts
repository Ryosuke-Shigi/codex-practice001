import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    apiCatalogSyncStatusMessage,
    isApiCatalogRefreshProps,
    shouldShowSyncResult,
} from '../apiCatalogIndexUtils';
import type {
    ApiCatalogPagination,
    ApiCatalogItem,
    ApiCatalogIndexProps,
    ApiCatalogSyncStatus,
    ApiCatalogSyncStatusResponse,
} from '../types';

const API_CATALOG_SYNC_POLL_INTERVAL_MS = 2500;

function isOlderSyncStatus(current: ApiCatalogSyncStatus, next: ApiCatalogSyncStatus) {
    if (next.id !== current.id) return next.id < current.id;
    const phase = { queued: 0, running: 1, completed: 2, failed: 2 };
    if (phase[next.status] < phase[current.status]) return true;
    const currentTime = Date.parse(current.updatedAt ?? '');
    const nextTime = Date.parse(next.updatedAt ?? '');
    if (Number.isFinite(currentTime) && Number.isFinite(nextTime) && nextTime < currentTime) return true;
    // staleは終端ではなく、実更新後のrunning復帰を受け入れます。
    return current.isStale && !next.isStale && phase[next.status] <= phase[current.status]
        && !(Number.isFinite(nextTime) && (!Number.isFinite(currentTime) || nextTime > currentTime));
}

type UseApiCatalogSyncArgs = {
    initialSyncStatus: ApiCatalogSyncStatus | null;
    getReturnUrl: () => string;
    pageComponent: string;
    pageVersion: string | null;
    onCatalogReloaded: (items: ApiCatalogItem[], pagination: ApiCatalogPagination) => boolean;
    isSearchPending?: boolean;
};

/**
 * APIカタログ本番一覧の同期開始、状態の定期取得、完了時の再読込をまとめるフックです。
 *
 * ページは同期ボタンと状態表示を組み立て、通信手順と後始末はこのフックに閉じます。
 */
export function useApiCatalogSync({
    initialSyncStatus,
    getReturnUrl,
    pageComponent,
    pageVersion,
    onCatalogReloaded,
    isSearchPending = false,
}: UseApiCatalogSyncArgs) {
    const [syncStatus, setSyncStatus] = useState<ApiCatalogSyncStatus | null>(initialSyncStatus);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [syncPollingError, setSyncPollingError] = useState<string | null>(null);
    const [reloadRequest, setReloadRequest] = useState(0);
    const reloadGeneration = useRef(0);
    const cancelRefresh = useRef<(() => void) | null>(null);
    const acceptedStatus = useRef(initialSyncStatus);
    const highestStatusId = useRef(initialSyncStatus?.id ?? 0);
    const ignoreThroughId = useRef(0);
    const starting = useRef(false);
    const outgoingVisits = useRef(new Set<object>());
    const [isNavigatingAway, setIsNavigatingAway] = useState(false);
    const listPath = useRef(typeof window === 'undefined' ? '/api-catalog' : new URL(getReturnUrl(), window.location.origin).pathname).current;

    const acceptStatus = useCallback((next: ApiCatalogSyncStatus | null) => {
        if (!next || next.id <= ignoreThroughId.current || next.id < highestStatusId.current) return false;
        if (acceptedStatus.current && isOlderSyncStatus(acceptedStatus.current, next)) return false;
        acceptedStatus.current = next;
        highestStatusId.current = Math.max(highestStatusId.current, next.id);
        setSyncStatus(next);
        return true;
    }, []);

    const isSyncButtonDisabled = isStartingSync || (syncStatus?.isRunning ?? false);
    const syncMessage = apiCatalogSyncStatusMessage(syncStatus, isStartingSync, syncPollingError);
    const showSyncResult = shouldShowSyncResult(syncStatus);

    const startPoolSync = useCallback(async () => {
        /*
         * POST成功は「同期が終わった」ではなく「ジョブ登録を受け付けた」という意味です。
         * 完了扱いは状態取得APIが completed / failed を返したときだけに限定します。
         */
        if (isSyncButtonDisabled || starting.current) {
            return;
        }

        cancelRefresh.current?.();
        starting.current = true;
        setIsStartingSync(true);
        setSyncPollingError(null);

        try {
            const response = await axios.post<ApiCatalogSyncStatusResponse>(
                '/api-catalog/sync',
                {
                    return_url: getReturnUrl(),
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (response.data.syncStatus === null) {
                // 現在のPOSTが返すnullは追跡未対応です。過去の完了を新同期の結果にはしません。
                acceptedStatus.current = null;
                ignoreThroughId.current = highestStatusId.current;
                ++reloadGeneration.current;
                setReloadRequest(0);
                setSyncStatus(null);
            } else {
                acceptStatus(response.data.syncStatus);
            }
        } catch {
            setSyncPollingError('APIカタログ同期の開始に失敗しました');
        } finally {
            starting.current = false;
            setIsStartingSync(false);
        }
    }, [acceptStatus, getReturnUrl, isSyncButtonDisabled]);

    useEffect(() => {
        acceptStatus(initialSyncStatus);
    }, [
        initialSyncStatus,
        initialSyncStatus?.id,
        initialSyncStatus?.status,
        initialSyncStatus?.updatedAt,
        acceptStatus,
    ]);

    useEffect(() => {
        const stopStart = router.on('start', event => {
            const visit = event.detail.visit;
            if (visit.prefetch || visit.async || visit.url.pathname === listPath) return;
            outgoingVisits.current.add(visit);
            setIsNavigatingAway(true);
            cancelRefresh.current?.();
        });
        const stopFinish = router.on('finish', event => {
            if (!outgoingVisits.current.delete(event.detail.visit)) return;
            setIsNavigatingAway(outgoingVisits.current.size > 0);
            if (outgoingVisits.current.size === 0 && window.location.pathname !== listPath) {
                ++reloadGeneration.current;
                setReloadRequest(0);
            }
        });
        const stopNavigate = router.on('navigate', event => {
            if (new URL(event.detail.page.url, window.location.origin).pathname === listPath) return;
            ++reloadGeneration.current;
            setReloadRequest(0);
            cancelRefresh.current?.();
        });
        return () => { stopStart(); stopFinish(); stopNavigate(); outgoingVisits.current.clear(); };
    }, [listPath]);

    useEffect(() => {
        if (syncStatus === null || !syncStatus.isRunning) {
            return;
        }

        /*
         * setTimeout を再帰的に張り、前回の状態取得が終わる前に次の状態取得が重ならないようにします。
         * isActive は画面離脱や状態切替後に古いレスポンスが state を更新しないためのガードです。
         */
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
                    const isAccepted = acceptStatus(nextStatus);
                    setSyncPollingError(null);

                    if (!nextStatus.isRunning) {
                        if (isAccepted) setReloadRequest(++reloadGeneration.current);

                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setSyncPollingError('同期状態の取得に失敗しました');
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(
                    pollSyncStatus,
                    API_CATALOG_SYNC_POLL_INTERVAL_MS,
                );
            }
        };

        timeoutId = window.setTimeout(pollSyncStatus, API_CATALOG_SYNC_POLL_INTERVAL_MS);

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [acceptStatus, syncStatus?.id, syncStatus?.isRunning]);

    useEffect(() => {
        if (reloadRequest === 0 || isSearchPending || isStartingSync || syncStatus?.isRunning || isNavigatingAway || outgoingVisits.current.size > 0) return;
        const refreshUrl = getReturnUrl();
        if (new URL(refreshUrl, window.location.origin).pathname !== listPath) { setReloadRequest(0); return; }
        let isActive = true;
        const controller = new AbortController();
        const cancel = () => controller.abort();
        cancelRefresh.current = cancel;
        const canApply = () => isActive && !controller.signal.aborted
            && reloadGeneration.current === reloadRequest && outgoingVisits.current.size === 0
            && window.location.pathname === listPath && getReturnUrl() === refreshUrl;
        // Inertiaのresponse queueへ渡すと、取消後も受信済み応答が履歴を上書きし得ます。
        // 同じ部分GETを取得だけに使い、URL/履歴に触れず現在の一覧データへ反映します。
        void axios.get<{
            component: string; version: string | null;
            props: Pick<ApiCatalogIndexProps, 'filters' | 'apiCatalogItems' | 'pagination' | 'syncStatus'>;
        }>(refreshUrl, {
            signal: controller.signal,
            headers: {
                Accept: 'text/html, application/xhtml+xml', 'X-Requested-With': 'XMLHttpRequest',
                'X-Inertia': 'true', 'X-Inertia-Partial-Component': pageComponent,
                'X-Inertia-Partial-Data': 'filters,apiCatalogItems,pagination,syncStatus',
                ...(pageVersion ? { 'X-Inertia-Version': pageVersion } : {}),
                'Cache-Control': 'no-cache',
            },
        }).then(response => {
            if (!canApply()) return;
            const page = response.data;
            if (!response.headers?.['x-inertia'] || page?.component !== pageComponent || page.version !== pageVersion
                || !isApiCatalogRefreshProps(page.props)) throw new Error('Invalid catalog refresh');
            if (!onCatalogReloaded(page.props.apiCatalogItems, page.props.pagination)) return;
            acceptStatus(page.props.syncStatus);
            setReloadRequest(current => current === reloadRequest ? 0 : current);
        }).catch(() => {
            if (!canApply()) return;
            setSyncPollingError('カタログ表示の更新に失敗しました。ページを再読み込みしてください。');
            setReloadRequest(current => current === reloadRequest ? 0 : current);
        });
        return () => {
            isActive = false;
            cancel();
            if (cancelRefresh.current === cancel) cancelRefresh.current = null;
        };
    }, [reloadRequest, isSearchPending, isStartingSync, syncStatus?.isRunning, isNavigatingAway, listPath, getReturnUrl, pageComponent, pageVersion, onCatalogReloaded, acceptStatus]);

    return {
        syncStatus,
        isSyncButtonDisabled,
        syncMessage,
        showSyncResult,
        startPoolSync,
    };
}
