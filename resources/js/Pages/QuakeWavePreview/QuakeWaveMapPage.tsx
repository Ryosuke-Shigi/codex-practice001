import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import JapanQuakeWaveMap, {
    type EarthquakeMapPin,
} from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import PinDisplayLimitSlider, {
    PIN_DISPLAY_LIMIT_INITIAL,
} from '@/Components/JapanQuakeWaveMap/PinDisplayLimitSlider';
import QuakeDateRangeFilter, {
    type QuakeDateRange,
} from '@/Components/JapanQuakeWaveMap/QuakeDateRangeFilter';
import QuakeIntensitySwitchFilter, {
    quakeIntensityKey,
    quakeIntensityKeys,
    quakeIntensitySortRank,
    type QuakeIntensityKey,
} from '@/Components/JapanQuakeWaveMap/QuakeIntensitySwitchFilter';
import PublicLayout from '@/Layouts/PublicLayout';

type QuakeWaveMapFilters = {
    startDate: string | null;
    endDate: string | null;
};

type QuakeWaveMapPageProps = {
    pins: EarthquakeMapPin[];
    filters: QuakeWaveMapFilters;
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

function dateRangeFromFilters(filters: QuakeWaveMapFilters): QuakeDateRange {
    return {
        startDate: filters.startDate ?? '',
        endDate: filters.endDate ?? '',
    };
}

function pinTimestamp(pin: Pick<EarthquakeMapPin, 'occurredAt' | 'reportedAt'>) {
    const value = pin.reportedAt ?? pin.occurredAt;
    const timestamp = value ? new Date(value).getTime() : Number.NaN;

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function pinKey(pin: EarthquakeMapPin) {
    return `${pin.eventId ?? 'no-event'}:${pin.sourceEntryId}`;
}

function comparePinsForDisplay(left: EarthquakeMapPin, right: EarthquakeMapPin) {
    const intensityDifference = quakeIntensitySortRank(right.maxIntensity)
        - quakeIntensitySortRank(left.maxIntensity);

    if (intensityDifference !== 0) {
        return intensityDifference;
    }

    return pinTimestamp(right) - pinTimestamp(left);
}

function pickVisiblePins(
    filteredPins: EarthquakeMapPin[],
    selectedIntensities: QuakeIntensityKey[],
    limit: number,
) {
    const sortedPins = [...filteredPins].sort(comparePinsForDisplay);

    if (
        selectedIntensities.length === 0
        || selectedIntensities.length === quakeIntensityKeys.length
    ) {
        return sortedPins.slice(0, limit);
    }

    const pickedPins: EarthquakeMapPin[] = [];
    const pickedKeys = new Set<string>();

    for (const intensity of selectedIntensities) {
        if (pickedPins.length >= limit) {
            break;
        }

        const pin = sortedPins.find((candidate) => quakeIntensityKey(candidate.maxIntensity) === intensity
            && !pickedKeys.has(pinKey(candidate)));

        if (pin) {
            pickedPins.push(pin);
            pickedKeys.add(pinKey(pin));
        }
    }

    for (const pin of sortedPins) {
        if (pickedPins.length >= limit) {
            break;
        }

        if (!pickedKeys.has(pinKey(pin))) {
            pickedPins.push(pin);
            pickedKeys.add(pinKey(pin));
        }
    }

    return pickedPins.sort(comparePinsForDisplay);
}

/*
 * DB pins 用のページ入口です。
 * Controller -> QueryAction -> Repository -> Responder で組み立てた Inertia props を受け取り、
 * 共通表示コンポーネントの JapanQuakeWaveMap に渡します。ここでは仮データを作りません。
 */
export default function QuakeWaveMapPage({ pins, filters }: QuakeWaveMapPageProps) {
    const [feedEntrySyncStatus, setFeedEntrySyncStatus] = useState<EarthquakeSyncStatus | null>(null);
    const [mapPinSyncStatus, setMapPinSyncStatus] = useState<EarthquakeSyncStatus | null>(null);
    const [isStartingRefresh, setIsStartingRefresh] = useState(false);
    const [refreshPollingError, setRefreshPollingError] = useState<string | null>(null);
    const [pinDisplayLimit, setPinDisplayLimit] = useState(PIN_DISPLAY_LIMIT_INITIAL);
    const [selectedIntensities, setSelectedIntensities] = useState<QuakeIntensityKey[]>(quakeIntensityKeys);
    const [dateRange, setDateRange] = useState<QuakeDateRange>(() => dateRangeFromFilters(filters));
    const filteredPins = useMemo(() => {
        const selectedSet = new Set(selectedIntensities);

        return pins.filter((pin) => selectedSet.has(quakeIntensityKey(pin.maxIntensity)));
    }, [pins, selectedIntensities]);
    const visiblePins = useMemo(
        /*
         * 日付範囲だけは Inertia 経由で再取得します。
         * 震度ON/OFFと表示件数は、取得済み pins の見え方を調整する画面状態に留めます。
         */
        () => pickVisiblePins(filteredPins, selectedIntensities, pinDisplayLimit),
        [filteredPins, pinDisplayLimit, selectedIntensities],
    );

    const isRefreshing = isStartingRefresh
        || (feedEntrySyncStatus?.isRunning ?? false)
        || (mapPinSyncStatus?.isRunning ?? false);
    const refreshErrorMessage = refreshPollingError
        ?? feedEntrySyncStatus?.errorMessage
        ?? mapPinSyncStatus?.errorMessage
        ?? null;

    const reloadPinsByDateRange = (nextDateRange: QuakeDateRange) => {
        setDateRange(nextDateRange);

        router.get(
            '/quakewave-preview/map',
            {
                startDate: nextDateRange.startDate,
                endDate: nextDateRange.endDate,
            },
            {
                only: ['pins', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

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
        setDateRange(dateRangeFromFilters(filters));
    }, [filters.startDate, filters.endDate]);

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

        router.get(
            '/quakewave-preview/map',
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
                    pins={visiblePins}
                    eyebrow="QuakeWave Map"
                    title="地震情報可視化"
                    summary="DBに保存済みの地震情報を日本地図上へ重ね、震源・震度・波紋を確認します。"
                    mapOverlay={(
                        <PinDisplayLimitSlider
                            value={pinDisplayLimit}
                            availablePinCount={filteredPins.length}
                            onChange={setPinDisplayLimit}
                        />
                    )}
                    mapTopContent={(
                        <QuakeDateRangeFilter
                            value={dateRange}
                            onChange={reloadPinsByDateRange}
                        />
                    )}
                    controlPanelsBeforeLayers={(
                        <QuakeIntensitySwitchFilter
                            selectedIntensities={selectedIntensities}
                            onChange={setSelectedIntensities}
                        />
                    )}
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
                    refreshPanelPlacement="controls"
                    detailPanelPlacement="below"
                    detailPanelCollapsible
                    detailPanelDefaultOpen={false}
                />
            </div>
        </PublicLayout>
    );
}
