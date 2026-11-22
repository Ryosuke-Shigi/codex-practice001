import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    apiCatalogSyncStatusMessage,
    isApiCatalogPagination,
    shouldShowSyncResult,
} from '../apiCatalogIndexUtils';
import type {
    ApiCatalogPagination,
    ApiCatalogSyncStatus,
    ApiCatalogSyncStatusResponse,
} from '../types';

const API_CATALOG_SYNC_POLL_INTERVAL_MS = 2500;

type UseApiCatalogSyncArgs = {
    initialSyncStatus: ApiCatalogSyncStatus | null;
    getReturnUrl: () => string;
    onPaginationReloaded: (pagination: ApiCatalogPagination) => void;
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
    onPaginationReloaded,
    isSearchPending = false,
}: UseApiCatalogSyncArgs) {
    const [syncStatus, setSyncStatus] = useState<ApiCatalogSyncStatus | null>(initialSyncStatus);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [syncPollingError, setSyncPollingError] = useState<string | null>(null);
    const [reloadRequest, setReloadRequest] = useState(0);
    const reloadGeneration = useRef(0);
    const cancelRefresh = useRef<(() => void) | null>(null);

    const isSyncButtonDisabled = isStartingSync || (syncStatus?.isRunning ?? false);
    const syncMessage = apiCatalogSyncStatusMessage(syncStatus, isStartingSync, syncPollingError);
    const showSyncResult = shouldShowSyncResult(syncStatus);

    const startPoolSync = useCallback(async () => {
        /*
         * POST成功は「同期が終わった」ではなく「ジョブ登録を受け付けた」という意味です。
         * 完了扱いは状態取得APIが completed / failed を返したときだけに限定します。
         */
        if (isSyncButtonDisabled) {
            return;
        }

        cancelRefresh.current?.();
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

            setSyncStatus(response.data.syncStatus);
        } catch {
            setSyncPollingError('APIカタログ同期の開始に失敗しました');
        } finally {
            setIsStartingSync(false);
        }
    }, [getReturnUrl, isSyncButtonDisabled]);

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
                    setSyncStatus(nextStatus);
                    setSyncPollingError(null);

                    if (!nextStatus.isRunning) {
                        setReloadRequest(++reloadGeneration.current);

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
    }, [syncStatus?.id, syncStatus?.isRunning]);

    useEffect(() => {
        if (reloadRequest === 0 || isSearchPending || isStartingSync || syncStatus?.isRunning) return;
        let isActive = true;
        let finished = false;
        let cancelled = false;
        let cancel: (() => void) | null = null;
        // reload() は async:true を強制するため、検索GETと同じ取消可能なstreamを明示します。
        // 検索未確定中は延期し、確定後の現在URLだけで部分再取得します。
        router.visit(getReturnUrl(), {
            method: 'get', async: false, replace: true, preserveState: true, preserveScroll: true,
            headers: { 'Cache-Control': 'no-cache' },
            only: ['filters', 'apiCatalogItems', 'pagination', 'syncStatus'],
            onCancelToken: token => { cancel = () => token.cancel(); cancelRefresh.current = cancel; },
            onCancel: () => { cancelled = true; },
            onSuccess: page => {
                if (!isActive || cancelled || reloadGeneration.current !== reloadRequest) return;
                finished = true;
                if (isApiCatalogPagination(page.props.pagination)) onPaginationReloaded(page.props.pagination);
                setReloadRequest(current => current === reloadRequest ? 0 : current);
            },
            onFinish: () => {
                if (isActive && !finished && !cancelled && reloadGeneration.current === reloadRequest) {
                    setSyncPollingError('カタログ表示の更新に失敗しました。ページを再読み込みしてください。');
                    setReloadRequest(current => current === reloadRequest ? 0 : current);
                }
            },
        });
        return () => {
            isActive = false;
            if (!finished) cancel?.();
            if (cancelRefresh.current === cancel) cancelRefresh.current = null;
        };
    }, [reloadRequest, isSearchPending, isStartingSync, syncStatus?.isRunning, getReturnUrl, onPaginationReloaded]);

    return {
        syncStatus,
        isSyncButtonDisabled,
        syncMessage,
        showSyncResult,
        startPoolSync,
    };
}
