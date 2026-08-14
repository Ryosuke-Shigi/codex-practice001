import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { MapRefreshAction } from '@/Components/JapanQuakeWaveMap/MapRefreshPanel';
import type { QuakeDateRange } from '@/Components/JapanQuakeWaveMap/QuakeDateRangeFilter';
import type {
    EarthquakeMapRefreshResponse,
    EarthquakeSyncStatus,
    EarthquakeSyncStatusResponse,
} from '@/Pages/QuakeWavePreview/types';
import {
    mapRefreshStatusLabel,
    syncStatusOrPendingFromRunId,
} from '@/Pages/QuakeWavePreview/utils/quakeSyncStatus';

const MAP_REFRESH_POLL_INTERVAL_MS = 2500;
const MAP_REFRESH_URL = '/quakewave-preview/map/refresh';
const MAP_PAGE_URL = '/quakewave-preview/map';
const FEED_ENTRY_SYNC_STATUS_URL = '/quakewave-preview/feed-entries/sync/status';
const MAP_PIN_SYNC_STATUS_URL = '/quakewave-preview/map-pins/sync/status';

type UseQuakeMapRefreshArgs = {
    dateRange: QuakeDateRange;
};

type UseMapRefreshSyncStatusPollingArgs = {
    syncStatus: EarthquakeSyncStatus | null;
    setSyncStatus: Dispatch<SetStateAction<EarthquakeSyncStatus | null>>;
    statusUrl: string;
    pollingErrorMessage: string;
    setRefreshPollingError: Dispatch<SetStateAction<string | null>>;
};

function useMapRefreshSyncStatusPolling({
    syncStatus,
    setSyncStatus,
    statusUrl,
    pollingErrorMessage,
    setRefreshPollingError,
}: UseMapRefreshSyncStatusPollingArgs) {
    useEffect(() => {
        if (syncStatus === null || !syncStatus.isRunning) {
            return;
        }

        let isActive = true;
        let timeoutId: number | undefined;

        const pollSyncStatus = async () => {
            try {
                const response = await axios.get<EarthquakeSyncStatusResponse>(
                    statusUrl,
                    {
                        params: {
                            syncRunId: syncStatus.syncRunId,
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
                    setRefreshPollingError(null);

                    if (!nextStatus.isRunning) {
                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setRefreshPollingError(pollingErrorMessage);
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(pollSyncStatus, MAP_REFRESH_POLL_INTERVAL_MS);
            }
        };

        timeoutId = window.setTimeout(pollSyncStatus, MAP_REFRESH_POLL_INTERVAL_MS);

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [
        pollingErrorMessage,
        setRefreshPollingError,
        setSyncStatus,
        statusUrl,
        syncStatus?.syncRunId,
        syncStatus?.isRunning,
    ]);
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

            setFeedEntrySyncStatus(syncStatusOrPendingFromRunId(
                response.data.feedEntrySyncStatus,
                response.data.feedEntrySyncRunId,
            ));
            setMapPinSyncStatus(syncStatusOrPendingFromRunId(
                response.data.mapPinSyncStatus,
                response.data.mapPinSyncRunId,
            ));
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

    useMapRefreshSyncStatusPolling({
        syncStatus: feedEntrySyncStatus,
        setSyncStatus: setFeedEntrySyncStatus,
        statusUrl: FEED_ENTRY_SYNC_STATUS_URL,
        pollingErrorMessage: 'XML取込状態の取得に失敗しました',
        setRefreshPollingError,
    });
    useMapRefreshSyncStatusPolling({
        syncStatus: mapPinSyncStatus,
        setSyncStatus: setMapPinSyncStatus,
        statusUrl: MAP_PIN_SYNC_STATUS_URL,
        pollingErrorMessage: 'PIN生成状態の取得に失敗しました',
        setRefreshPollingError,
    });

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
        buttonLabel: '更新',
        disabledLabel: '更新中',
        statusLabel: mapRefreshStatusLabel(
            feedEntrySyncStatus,
            mapPinSyncStatus,
            isStartingRefresh,
            refreshPollingError,
        ),
        description: '',
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
