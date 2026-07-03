import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import type {
    EarthquakeSyncStartResponse,
    EarthquakeSyncStatus,
    EarthquakeSyncStatusResponse,
} from '@/Pages/QuakeWavePreview/types';
import {
    feedEntrySyncStatusMessage,
    mapPinSyncStatusMessage,
    pendingStatusFromSyncRunId,
} from '@/Pages/QuakeWavePreview/utils/quakeSyncStatus';

export const EARTHQUAKE_FEED_SYNC_POLL_INTERVAL_MS = 2500;
export const EARTHQUAKE_MAP_PIN_SYNC_POLL_INTERVAL_MS = 2500;

const FEED_ENTRY_SYNC_URL = '/quakewave-preview/feed-entries/sync';
const FEED_ENTRY_SYNC_STATUS_URL = '/quakewave-preview/feed-entries/sync/status';
const MAP_PIN_SYNC_URL = '/quakewave-preview/map-pins/sync';
const MAP_PIN_SYNC_STATUS_URL = '/quakewave-preview/map-pins/sync/status';

const FEED_ENTRY_RELOAD_PROPS = ['savedFeedEntries', 'feedEntrySyncStatus', 'feedEntrySyncRuns'];
const MAP_PIN_RELOAD_PROPS = ['savedMapPins', 'mapPinSyncStatus', 'mapPinSyncRuns'];

type SyncStatusMessageResolver = (
    status: EarthquakeSyncStatus | null,
    isStarting: boolean,
    pollingError: string | null,
) => string;

type UseEarthquakeSyncPanelArgs = {
    initialStatus: EarthquakeSyncStatus | null;
    syncRuns: EarthquakeSyncStatus[];
    startUrl: string;
    statusUrl: string;
    reloadOnly: string[];
    pollIntervalMs: number;
    startErrorMessage: string;
    pollingErrorMessage: string;
    statusMessage: SyncStatusMessageResolver;
};

type EarthquakeSyncPanelState = {
    latestVisibleStatus: EarthquakeSyncStatus | null;
    isButtonDisabled: boolean;
    message: string;
    startSync: () => Promise<void>;
};

type UseQuakeWavePreviewSyncArgs = {
    initialFeedEntrySyncStatus: EarthquakeSyncStatus | null;
    feedEntrySyncRuns: EarthquakeSyncStatus[];
    initialMapPinSyncStatus: EarthquakeSyncStatus | null;
    mapPinSyncRuns: EarthquakeSyncStatus[];
};

function useEarthquakeSyncPanel({
    initialStatus,
    syncRuns,
    startUrl,
    statusUrl,
    reloadOnly,
    pollIntervalMs,
    startErrorMessage,
    pollingErrorMessage,
    statusMessage,
}: UseEarthquakeSyncPanelArgs): EarthquakeSyncPanelState {
    const [syncStatus, setSyncStatus] = useState<EarthquakeSyncStatus | null>(initialStatus);
    const [isStarting, setIsStarting] = useState(false);
    const [pollingError, setPollingError] = useState<string | null>(null);

    const latestVisibleStatus = syncStatus ?? syncRuns[0] ?? null;
    const isButtonDisabled = isStarting || (syncStatus?.isRunning ?? false);
    const message = statusMessage(latestVisibleStatus, isStarting, pollingError);

    const startSync = useCallback(async () => {
        if (isButtonDisabled) {
            return;
        }

        setIsStarting(true);
        setPollingError(null);

        try {
            const response = await axios.post<EarthquakeSyncStartResponse>(
                startUrl,
                {},
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setSyncStatus(
                response.data.syncStatus
                ?? (response.data.syncRunId !== undefined
                    ? pendingStatusFromSyncRunId(response.data.syncRunId)
                    : null),
            );
        } catch (error) {
            if (axios.isAxiosError<EarthquakeSyncStartResponse>(error)) {
                setPollingError(error.response?.data.message ?? startErrorMessage);

                return;
            }

            setPollingError(startErrorMessage);
        } finally {
            setIsStarting(false);
        }
    }, [isButtonDisabled, startErrorMessage, startUrl]);

    useEffect(() => {
        setSyncStatus(initialStatus);
    }, [
        initialStatus,
        initialStatus?.syncRunId,
        initialStatus?.status,
        initialStatus?.finishedAt,
    ]);

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
                    setPollingError(null);

                    if (!nextStatus.isRunning) {
                        router.reload({
                            only: reloadOnly,
                        });

                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setPollingError(pollingErrorMessage);
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(pollSyncStatus, pollIntervalMs);
            }
        };

        timeoutId = window.setTimeout(pollSyncStatus, pollIntervalMs);

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [
        pollIntervalMs,
        pollingErrorMessage,
        reloadOnly,
        statusUrl,
        syncStatus?.syncRunId,
        syncStatus?.isRunning,
    ]);

    return {
        latestVisibleStatus,
        isButtonDisabled,
        message,
        startSync,
    };
}

/**
 * QuakeWave Preview index の同期開始、polling、partial reload をまとめる Hook です。
 *
 * Page は Inertia props と表示組み立てだけを扱い、feed entry / map pin それぞれの
 * POST、status polling、完了時 reload、cleanup はこの Hook に閉じます。
 */
export function useQuakeWavePreviewSync({
    initialFeedEntrySyncStatus,
    feedEntrySyncRuns,
    initialMapPinSyncStatus,
    mapPinSyncRuns,
}: UseQuakeWavePreviewSyncArgs) {
    const feedEntrySync = useEarthquakeSyncPanel({
        initialStatus: initialFeedEntrySyncStatus,
        syncRuns: feedEntrySyncRuns,
        startUrl: FEED_ENTRY_SYNC_URL,
        statusUrl: FEED_ENTRY_SYNC_STATUS_URL,
        reloadOnly: FEED_ENTRY_RELOAD_PROPS,
        pollIntervalMs: EARTHQUAKE_FEED_SYNC_POLL_INTERVAL_MS,
        startErrorMessage: '地震feed取込の開始に失敗しました',
        pollingErrorMessage: '地震feed取込状態の取得に失敗しました',
        statusMessage: feedEntrySyncStatusMessage,
    });
    const mapPinSync = useEarthquakeSyncPanel({
        initialStatus: initialMapPinSyncStatus,
        syncRuns: mapPinSyncRuns,
        startUrl: MAP_PIN_SYNC_URL,
        statusUrl: MAP_PIN_SYNC_STATUS_URL,
        reloadOnly: MAP_PIN_RELOAD_PROPS,
        pollIntervalMs: EARTHQUAKE_MAP_PIN_SYNC_POLL_INTERVAL_MS,
        startErrorMessage: '地図ピン生成の開始に失敗しました',
        pollingErrorMessage: '地図ピン生成状態の取得に失敗しました',
        statusMessage: mapPinSyncStatusMessage,
    });

    return {
        feedEntrySync,
        mapPinSync,
    };
}
