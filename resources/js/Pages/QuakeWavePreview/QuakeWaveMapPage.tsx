import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import JapanQuakeWaveMap, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import PublicLayout from '@/Layouts/PublicLayout';

type QuakeWaveMapPageProps = {
    pins: EarthquakeMapPin[];
};

const MAP_REFRESH_POLL_INTERVAL_MS = 2500;

type EarthquakeSyncStatusValue = 'pending' | 'running' | 'completed' | 'failed';

type EarthquakeSyncStatus = {
    syncRunId: number;
    status: EarthquakeSyncStatusValue;
    isRunning: boolean;
    totalCount: number;
    insertedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
};

type EarthquakeSyncStatusResponse = {
    syncStatus: EarthquakeSyncStatus | null;
};

type EarthquakeMapRefreshResponse = {
    feedEntrySyncRunId?: number;
    mapPinSyncRunId?: number;
    feedEntrySyncStatus: EarthquakeSyncStatus | null;
    mapPinSyncStatus: EarthquakeSyncStatus | null;
    message?: string;
};

function pendingStatusFromSyncRunId(syncRunId: number): EarthquakeSyncStatus {
    return {
        syncRunId,
        status: 'pending',
        isRunning: true,
        totalCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
    };
}

function refreshStatusLabel(
    feedEntryStatus: EarthquakeSyncStatus | null,
    mapPinStatus: EarthquakeSyncStatus | null,
    isStarting: boolean,
    pollingError: string | null,
) {
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

/*
 * DB pins 用のページ入口です。
 * Controller -> QueryAction -> Repository -> Responder で組み立てた Inertia props を受け取り、
 * 共通表示コンポーネントの JapanQuakeWaveMap に渡します。ここでは仮データを作りません。
 */
export default function QuakeWaveMapPage({ pins }: QuakeWaveMapPageProps) {
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

    const startMapRefresh = async () => {
        /*
         * POST は「XML取込 + PIN生成」の統合更新をQueueへ依頼するだけです。
         * 実際のfeed取得、個別XML解析、DB upsertは Laravel Job が既存Serviceを順番に呼びます。
         */
        if (isRefreshing) {
            return;
        }

        setIsStartingRefresh(true);
        setRefreshPollingError(null);

        try {
            const response = await axios.post<EarthquakeMapRefreshResponse>(
                '/quakewave-preview/map/refresh',
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
    };

    useEffect(() => {
        if (feedEntrySyncStatus === null || !feedEntrySyncStatus.isRunning) {
            return;
        }

        let isActive = true;
        let timeoutId: number | undefined;

        const pollFeedEntrySyncStatus = async () => {
            try {
                const response = await axios.get<EarthquakeSyncStatusResponse>(
                    '/quakewave-preview/feed-entries/sync/status',
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

        let isActive = true;
        let timeoutId: number | undefined;

        const pollMapPinSyncStatus = async () => {
            try {
                const response = await axios.get<EarthquakeSyncStatusResponse>(
                    '/quakewave-preview/map-pins/sync/status',
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

        router.reload({
            only: ['pins'],
        });
    }, [
        feedEntrySyncStatus?.isRunning,
        feedEntrySyncStatus?.finishedAt,
        mapPinSyncStatus?.isRunning,
        mapPinSyncStatus?.finishedAt,
    ]);

    return (
        <PublicLayout className="px-5 py-8 sm:px-8 lg:px-10">
            <Head title="QuakeWave Map" />

            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 pb-12 pt-4 sm:pt-8">
                <header className="flex items-center justify-between gap-4">
                    <Link
                        href="/lab"
                        className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(2,24,45,0.18)] backdrop-blur-xl transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        Lab
                    </Link>
                    <Link
                        href="/quakewave-preview"
                        className="rounded-full border border-cyan-100/35 bg-cyan-50/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-950/70 backdrop-blur-xl transition hover:bg-cyan-50/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/70"
                    >
                        Preview Tools
                    </Link>
                </header>

                <JapanQuakeWaveMap
                    pins={pins}
                    eyebrow="QuakeWave Map"
                    title="地震情報可視化"
                    summary="DBに保存済みの地震情報を日本地図上へ重ね、震源・震度・波紋を確認します。"
                    sourceLabel="earthquake_map_pins"
                    refreshAction={{
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
                    }}
                />
            </div>
        </PublicLayout>
    );
}
