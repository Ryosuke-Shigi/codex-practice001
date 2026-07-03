import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

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
}: UseApiCatalogSyncArgs) {
    const [syncStatus, setSyncStatus] = useState<ApiCatalogSyncStatus | null>(initialSyncStatus);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [syncPollingError, setSyncPollingError] = useState<string | null>(null);

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
                        router.reload({
                            only: ['filters', 'apiCatalogItems', 'pagination', 'syncStatus'],
                            onSuccess: (page) => {
                                const nextPagination = page.props.pagination;

                                if (isApiCatalogPagination(nextPagination)) {
                                    onPaginationReloaded(nextPagination);
                                }
                            },
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
    }, [onPaginationReloaded, syncStatus?.id, syncStatus?.isRunning]);

    return {
        syncStatus,
        isSyncButtonDisabled,
        syncMessage,
        showSyncResult,
        startPoolSync,
    };
}
