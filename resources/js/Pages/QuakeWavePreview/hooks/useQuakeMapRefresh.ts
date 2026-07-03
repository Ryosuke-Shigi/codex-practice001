import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MapRefreshAction } from '@/Components/JapanQuakeWaveMap/MapRefreshPanel';
import type { QuakeDateRange } from '@/Components/JapanQuakeWaveMap/QuakeDateRangeFilter';
import type {
    EarthquakeMapRefreshResponse,
    EarthquakeSyncStatus,
    EarthquakeSyncStatusResponse,
} from '@/Pages/QuakeWavePreview/types';
import { pendingStatusFromSyncRunId } from '@/Pages/QuakeWavePreview/utils/quakeSyncStatus';

const MAP_REFRESH_POLL_INTERVAL_MS = 2500;
const MAP_REFRESH_URL = '/quakewave-preview/map/refresh';
const MAP_PAGE_URL = '/quakewave-preview/map';
const FEED_ENTRY_SYNC_STATUS_URL = '/quakewave-preview/feed-entries/sync/status';
const MAP_PIN_SYNC_STATUS_URL = '/quakewave-preview/map-pins/sync/status';

type UseQuakeMapRefreshArgs = {
    dateRange: QuakeDateRange;
};

/**
 * feed entry同期とmap pin生成の状態から、更新パネルへ出す短い文言を決めます。
 *
 * Panel側に2系統sync runの優先順位を持たせず、Hook側で画面状態としてまとめます。
 */
export function refreshStatusLabel(
    feedEntryStatus: EarthquakeSyncStatus | null,
    mapPinStatus: EarthquakeSyncStatus | null,
    isStarting: boolean,
    pollingError: string | null,
) {
    /*
     * 表示文言は MapRefreshPanel ではなく hook で決めます。
     * Panel は受け取った文字列を表示するだけにして、XML取込とPIN生成のどちらを優先して
     * 状態表示するかという画面状態の判断を表示部品へ混ぜないためです。
     */
    if (isStarting) {
        return '地図データ更新Jobを投入しています';
    }

    if (pollingError !== null) {
        return pollingError;
    }

    if (feedEntryStatus?.status === 'failed' || mapPinStatus?.status === 'failed') {
        return '地図データ更新に失敗しました';
    }

    if (feedEntryStatus?.isRunning) {
        return 'XML取込を実行中です';
    }

    if (mapPinStatus?.isRunning) {
        return '地図ピン生成を実行中です';
    }

    if (feedEntryStatus?.status === 'completed' && mapPinStatus?.status === 'completed') {
        return '地図データ更新が完了しました';
    }

    return 'XML取込とPIN生成を1つのJobで開始できます';
}

/**
 * QuakeWave Map の統合更新UIに必要な状態と操作を提供するHookです。
 *
 * POSTによるJob投入、feed entry / map pin の2系統polling、完了後のpins再取得をまとめます。
 * Page と MapRefreshPanel は返された props を表示・実行するだけにし、通信手順を表示Componentへ漏らしません。
 */
export function useQuakeMapRefresh({ dateRange }: UseQuakeMapRefreshArgs) {
    const [feedEntrySyncStatus, setFeedEntrySyncStatus] = useState<EarthquakeSyncStatus | null>(null);
    const [mapPinSyncStatus, setMapPinSyncStatus] = useState<EarthquakeSyncStatus | null>(null);
    const [isStartingRefresh, setIsStartingRefresh] = useState(false);
    const [refreshPollingError, setRefreshPollingError] = useState<string | null>(null);

    const isRefreshing = isStartingRefresh
        || (feedEntrySyncStatus?.isRunning ?? false)
        || (mapPinSyncStatus?.isRunning ?? false);
    const refreshErrorMessage = refreshPollingError
        ?? feedEntrySyncStatus?.errorMessage
        ?? mapPinSyncStatus?.errorMessage
        ?? null;

    const startMapRefresh = useCallback(async () => {
        /*
         * POST は「XML取込 + PIN生成」の統合更新をQueueへ依頼するだけです。
         * 実際のfeed取得、個別XML解析、DB upsertは Laravel Job が既存Serviceを順番に呼びます。
         * 連打で同じ更新Jobが重複しないよう、既に開始中・polling中なら何もしません。
         */
        if (isRefreshing) {
            return;
        }

        setIsStartingRefresh(true);
        setRefreshPollingError(null);

        try {
            const response = await axios.post<EarthquakeMapRefreshResponse>(
                MAP_REFRESH_URL,
                {},
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setFeedEntrySyncStatus(
                response.data.feedEntrySyncStatus
                ?? (response.data.feedEntrySyncRunId !== undefined
                    ? pendingStatusFromSyncRunId(response.data.feedEntrySyncRunId)
                    : null),
            );
            setMapPinSyncStatus(
                response.data.mapPinSyncStatus
                ?? (response.data.mapPinSyncRunId !== undefined
                    ? pendingStatusFromSyncRunId(response.data.mapPinSyncRunId)
                    : null),
            );
        } catch (error) {
            if (axios.isAxiosError<EarthquakeMapRefreshResponse>(error)) {
                setRefreshPollingError(
                    error.response?.data.message ?? '地図データ更新の開始に失敗しました',
                );

                return;
            }

            setRefreshPollingError('地図データ更新の開始に失敗しました');
        } finally {
            setIsStartingRefresh(false);
        }
    }, [isRefreshing]);

    useEffect(() => {
        if (feedEntrySyncStatus === null || !feedEntrySyncStatus.isRunning) {
            return;
        }

        /*
         * XML取込 sync run の状態だけを追う polling です。
         * setTimeout を再帰的に張る形にして、リクエスト完了前に次の polling が重ならないようにします。
         * isActive は unmount や status 切替後に古いレスポンスが state を更新しないためのガードです。
         */
        let isActive = true;
        let timeoutId: number | undefined;

        const pollFeedEntrySyncStatus = async () => {
            try {
                const response = await axios.get<EarthquakeSyncStatusResponse>(
                    FEED_ENTRY_SYNC_STATUS_URL,
                    {
                        params: {
                            syncRunId: feedEntrySyncStatus.syncRunId,
                        },
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!isActive) {
                    return;
                }

                if (response.data.syncStatus !== null) {
                    setFeedEntrySyncStatus(response.data.syncStatus);
                    setRefreshPollingError(null);

                    if (!response.data.syncStatus.isRunning) {
                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setRefreshPollingError('XML取込状態の取得に失敗しました');
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(pollFeedEntrySyncStatus, MAP_REFRESH_POLL_INTERVAL_MS);
            }
        };

        timeoutId = window.setTimeout(pollFeedEntrySyncStatus, MAP_REFRESH_POLL_INTERVAL_MS);

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [feedEntrySyncStatus?.syncRunId, feedEntrySyncStatus?.isRunning]);

    useEffect(() => {
        if (mapPinSyncStatus === null || !mapPinSyncStatus.isRunning) {
            return;
        }

        /*
         * map pin sync run の polling です。
         * feed entry の polling と分けておくことで、XML取込完了後もPIN生成だけが走っている状態を
         * refreshStatusLabel で正しく表示できます。
         */
        let isActive = true;
        let timeoutId: number | undefined;

        const pollMapPinSyncStatus = async () => {
            try {
                const response = await axios.get<EarthquakeSyncStatusResponse>(
                    MAP_PIN_SYNC_STATUS_URL,
                    {
                        params: {
                            syncRunId: mapPinSyncStatus.syncRunId,
                        },
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!isActive) {
                    return;
                }

                if (response.data.syncStatus !== null) {
                    setMapPinSyncStatus(response.data.syncStatus);
                    setRefreshPollingError(null);

                    if (!response.data.syncStatus.isRunning) {
                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setRefreshPollingError('PIN生成状態の取得に失敗しました');
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(pollMapPinSyncStatus, MAP_REFRESH_POLL_INTERVAL_MS);
            }
        };

        timeoutId = window.setTimeout(pollMapPinSyncStatus, MAP_REFRESH_POLL_INTERVAL_MS);

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [mapPinSyncStatus?.syncRunId, mapPinSyncStatus?.isRunning]);

    useEffect(() => {
        if (
            feedEntrySyncStatus === null
            || mapPinSyncStatus === null
            || feedEntrySyncStatus.isRunning
            || mapPinSyncStatus.isRunning
        ) {
            return;
        }

        /*
         * 2つの sync run がどちらも停止したら、現在の日付範囲を維持したまま pins だけを再取得します。
         * preserveState を使うため、震度フィルターや表示件数など React 側の表示状態は残ります。
         */
        router.get(
            MAP_PAGE_URL,
            {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            },
            {
                only: ['pins', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }, [
        feedEntrySyncStatus?.isRunning,
        feedEntrySyncStatus?.finishedAt,
        mapPinSyncStatus?.isRunning,
        mapPinSyncStatus?.finishedAt,
    ]);

    const refreshAction: MapRefreshAction = useMemo(() => ({
        buttonLabel: '地図データ更新',
        disabledLabel: '更新中',
        statusLabel: refreshStatusLabel(
            feedEntrySyncStatus,
            mapPinSyncStatus,
            isStartingRefresh,
            refreshPollingError,
        ),
        description: '統合Job内でXML取込を完了させ、その後に保存済みentryからPIN生成を続けて実行します。',
        isRefreshing,
        errorMessage: refreshErrorMessage,
        onRefresh: startMapRefresh,
    }), [
        feedEntrySyncStatus,
        isRefreshing,
        isStartingRefresh,
        mapPinSyncStatus,
        refreshErrorMessage,
        refreshPollingError,
        startMapRefresh,
    ]);

    return {
        isRefreshing,
        refreshErrorMessage,
        refreshAction,
        feedEntrySyncStatus,
        mapPinSyncStatus,
    };
}
