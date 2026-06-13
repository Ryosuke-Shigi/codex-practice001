/**
 * QuakeWave Preview の開発確認入口 Page Component です。
 *
 * XML / map / sync status への導線と polling UI を扱い、Atom feed 取得や map pin 生成本体は backend に委譲します。
 */
import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import EarthquakePin, { type EarthquakePinPreview } from '@/Components/JapanQuakeWaveMap/EarthquakePin';
import EarthquakeRipple, { type EarthquakeRipplePreview } from '@/Components/JapanQuakeWaveMap/EarthquakeRipple';
import PublicLayout from '@/Layouts/PublicLayout';

const EARTHQUAKE_FEED_SYNC_POLL_INTERVAL_MS = 2500;
const EARTHQUAKE_MAP_PIN_SYNC_POLL_INTERVAL_MS = 2500;

type QuakeWavePreviewMock = {
    id: string;
    title: string;
    summary: string;
    status: string;
    href: string;
};

type EarthquakeFeedEntry = {
    id: number;
    entryId: string;
    title: string;
    xmlUrl: string | null;
    updatedAtFromFeed: string | null;
    publishedAtFromFeed: string | null;
    rawCategory: string | null;
    rawAuthor: string | null;
    lastFetchedAt: string | null;
};

type EarthquakeSyncStatusValue = 'pending' | 'running' | 'completed' | 'failed';

type EarthquakeFeedEntrySyncStatus = {
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

type EarthquakeFeedEntrySyncResponse = {
    syncRunId?: number;
    message?: string;
    syncStatus: EarthquakeFeedEntrySyncStatus | null;
};

type EarthquakeMapPin = {
    id: number;
    eventId: string | null;
    sourceEntryId: number;
    title: string | null;
    areaName: string | null;
    headline: string | null;
    rawCoordinate: string | null;
    latitude: string | null;
    longitude: string | null;
    depthMeter: number | null;
    magnitude: string | null;
    maxIntensity: string | null;
    occurredAt: string | null;
    reportedAt: string | null;
    comment: string | null;
};

type EarthquakeMapPinSyncStatus = {
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

type EarthquakeMapPinSyncResponse = {
    syncRunId?: number;
    message?: string;
    syncStatus: EarthquakeMapPinSyncStatus | null;
};

type IndexProps = {
    mocks: QuakeWavePreviewMock[];
    visualPreview: {
        pins: EarthquakePinPreview[];
        ripples: EarthquakeRipplePreview[];
    };
    savedFeedEntries: EarthquakeFeedEntry[];
    feedEntrySyncStatus: EarthquakeFeedEntrySyncStatus | null;
    feedEntrySyncRuns: EarthquakeFeedEntrySyncStatus[];
    savedMapPins: EarthquakeMapPin[];
    mapPinSyncStatus: EarthquakeMapPinSyncStatus | null;
    mapPinSyncRuns: EarthquakeMapPinSyncStatus[];
};

function statusClassName(status: string) {
    return status === 'Ready'
        ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50'
        : 'border-amber-300/50 bg-amber-300/15 text-amber-50';
}

function syncBadgeClassName(status: EarthquakeSyncStatusValue | null) {
    if (status === 'completed') {
        return 'border-emerald-200/50 bg-emerald-200/15 text-emerald-50';
    }

    if (status === 'failed') {
        return 'border-rose-200/50 bg-rose-200/15 text-rose-50';
    }

    if (status === 'pending' || status === 'running') {
        return 'border-cyan-100/45 bg-cyan-100/15 text-cyan-50';
    }

    return 'border-white/20 bg-white/10 text-slate-100';
}

function valueOrDash(value: string | number | null | undefined) {
    return value === null || value === undefined || value === '' ? '-' : value;
}

function feedEntrySyncStatusMessage(
    status: EarthquakeFeedEntrySyncStatus | null,
    isStarting: boolean,
    pollingError: string | null,
) {
    if (isStarting) {
        return '地震feed取込を開始しています';
    }

    if (pollingError !== null) {
        return pollingError;
    }

    if (status === null) {
        return '地震feed取込はまだ実行されていません';
    }

    if (status.status === 'pending') {
        return '地震feed取込を受け付けました';
    }

    if (status.status === 'running') {
        return '地震feed取込中です';
    }

    if (status.status === 'completed') {
        return '地震feed取込が完了しました';
    }

    return '地震feed取込に失敗しました';
}

function mapPinSyncStatusMessage(
    status: EarthquakeMapPinSyncStatus | null,
    isStarting: boolean,
    pollingError: string | null,
) {
    if (isStarting) {
        return '地図ピン生成を開始しています';
    }

    if (pollingError !== null) {
        return pollingError;
    }

    if (status === null) {
        return '地図ピン生成はまだ実行されていません';
    }

    if (status.status === 'pending') {
        return '地図ピン生成を受け付けました';
    }

    if (status.status === 'running') {
        return '地図ピン生成中です';
    }

    if (status.status === 'completed') {
        return '地図ピン生成が完了しました';
    }

    return '地図ピン生成に失敗しました';
}

function pendingStatusFromSyncRunId(syncRunId: number): EarthquakeFeedEntrySyncStatus {
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

function pendingMapPinStatusFromSyncRunId(syncRunId: number): EarthquakeMapPinSyncStatus {
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

export default function Index({
    mocks,
    visualPreview,
    savedFeedEntries,
    feedEntrySyncStatus: initialFeedEntrySyncStatus,
    feedEntrySyncRuns,
    savedMapPins,
    mapPinSyncStatus: initialMapPinSyncStatus,
    mapPinSyncRuns,
}: IndexProps) {
    /*
     * QuakeWave Preview は API Preview と同じく「本実装前の確認入口」です。
     * MAP / XML preview の既存導線には触らず、feed entry 同期だけを追加します。
     */
    const mapMock = mocks.find((mock) => mock.id === 'map-display') ?? mocks[0];
    const xmlMock = mocks.find((mock) => mock.id === 'xml-preview');
    const [feedEntrySyncStatus, setFeedEntrySyncStatus] = useState<EarthquakeFeedEntrySyncStatus | null>(
        initialFeedEntrySyncStatus,
    );
    const [isStartingFeedEntrySync, setIsStartingFeedEntrySync] = useState(false);
    const [feedEntrySyncPollingError, setFeedEntrySyncPollingError] = useState<string | null>(null);
    const [mapPinSyncStatus, setMapPinSyncStatus] = useState<EarthquakeMapPinSyncStatus | null>(
        initialMapPinSyncStatus,
    );
    const [isStartingMapPinSync, setIsStartingMapPinSync] = useState(false);
    const [mapPinSyncPollingError, setMapPinSyncPollingError] = useState<string | null>(null);

    const latestVisibleSyncStatus = feedEntrySyncStatus ?? feedEntrySyncRuns[0] ?? null;
    const isFeedEntrySyncButtonDisabled = isStartingFeedEntrySync || (feedEntrySyncStatus?.isRunning ?? false);
    const feedEntrySyncMessage = feedEntrySyncStatusMessage(
        latestVisibleSyncStatus,
        isStartingFeedEntrySync,
        feedEntrySyncPollingError,
    );
    const latestVisibleMapPinSyncStatus = mapPinSyncStatus ?? mapPinSyncRuns[0] ?? null;
    const isMapPinSyncButtonDisabled = isStartingMapPinSync || (mapPinSyncStatus?.isRunning ?? false);
    const mapPinSyncMessage = mapPinSyncStatusMessage(
        latestVisibleMapPinSyncStatus,
        isStartingMapPinSync,
        mapPinSyncPollingError,
    );

    const startFeedEntrySync = async () => {
        /*
         * POST は「同期開始依頼」だけを行います。
         * 実際の feed 取得と DB 保存は Laravel Queue の Job が担当し、React は返ってきた
         * syncRunId を使って status API を polling します。
         */
        if (isFeedEntrySyncButtonDisabled) {
            return;
        }

        setIsStartingFeedEntrySync(true);
        setFeedEntrySyncPollingError(null);

        try {
            const response = await axios.post<EarthquakeFeedEntrySyncResponse>(
                '/quakewave-preview/feed-entries/sync',
                {},
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            const nextStatus = response.data.syncStatus
                ?? (response.data.syncRunId !== undefined
                    ? pendingStatusFromSyncRunId(response.data.syncRunId)
                    : null);

            setFeedEntrySyncStatus(nextStatus);
        } catch (error) {
            /*
             * migration 未適用など、Laravel が原因付き JSON を返した場合はその message を出します。
             * ネットワーク断や予期しないエラーでは、画面向けの短い文言に丸めます。
             */
            if (axios.isAxiosError<EarthquakeFeedEntrySyncResponse>(error)) {
                setFeedEntrySyncPollingError(
                    error.response?.data.message ?? '地震feed取込の開始に失敗しました',
                );

                return;
            }

            setFeedEntrySyncPollingError('地震feed取込の開始に失敗しました');
        } finally {
            setIsStartingFeedEntrySync(false);
        }
    };

    const startMapPinSync = async () => {
        /*
         * 第2段階では feed entry 取込とは別ボタンとして実行します。
         * POST は map pin 生成Jobの投入だけを行い、React は syncRunId で status API を追います。
         *
         * このボタンは保存済み earthquake_feed_entries を入力にします。
         * feed entry 取込を自動で先に走らせる統合処理は、次の段階で専用Actionとして設計します。
         */
        if (isMapPinSyncButtonDisabled) {
            return;
        }

        setIsStartingMapPinSync(true);
        setMapPinSyncPollingError(null);

        try {
            const response = await axios.post<EarthquakeMapPinSyncResponse>(
                '/quakewave-preview/map-pins/sync',
                {},
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            const nextStatus = response.data.syncStatus
                ?? (response.data.syncRunId !== undefined
                    ? pendingMapPinStatusFromSyncRunId(response.data.syncRunId)
                    : null);

            setMapPinSyncStatus(nextStatus);
        } catch (error) {
            if (axios.isAxiosError<EarthquakeMapPinSyncResponse>(error)) {
                setMapPinSyncPollingError(
                    error.response?.data.message ?? '地図ピン生成の開始に失敗しました',
                );

                return;
            }

            setMapPinSyncPollingError('地図ピン生成の開始に失敗しました');
        } finally {
            setIsStartingMapPinSync(false);
        }
    };

    useEffect(() => {
        setFeedEntrySyncStatus(initialFeedEntrySyncStatus);
    }, [
        initialFeedEntrySyncStatus,
        initialFeedEntrySyncStatus?.syncRunId,
        initialFeedEntrySyncStatus?.status,
        initialFeedEntrySyncStatus?.finishedAt,
    ]);

    useEffect(() => {
        if (feedEntrySyncStatus === null || !feedEntrySyncStatus.isRunning) {
            return;
        }

        let isActive = true;
        let timeoutId: number | undefined;

        const pollFeedEntrySyncStatus = async () => {
            try {
                /*
                 * status API は GET で読み取りだけを行います。
                 * completed / failed の終端状態を受け取った時だけ polling を止め、保存済みentry一覧を
                 * Inertia の partial reload で更新します。
                 */
                const response = await axios.get<EarthquakeFeedEntrySyncResponse>(
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

                const nextStatus = response.data.syncStatus;

                if (nextStatus !== null) {
                    setFeedEntrySyncStatus(nextStatus);
                    setFeedEntrySyncPollingError(null);

                    if (!nextStatus.isRunning) {
                        router.reload({
                            only: ['savedFeedEntries', 'feedEntrySyncStatus', 'feedEntrySyncRuns'],
                        });

                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setFeedEntrySyncPollingError('地震feed取込状態の取得に失敗しました');
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(
                    pollFeedEntrySyncStatus,
                    EARTHQUAKE_FEED_SYNC_POLL_INTERVAL_MS,
                );
            }
        };

        timeoutId = window.setTimeout(
            pollFeedEntrySyncStatus,
            EARTHQUAKE_FEED_SYNC_POLL_INTERVAL_MS,
        );

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [feedEntrySyncStatus?.syncRunId, feedEntrySyncStatus?.isRunning]);

    useEffect(() => {
        setMapPinSyncStatus(initialMapPinSyncStatus);
    }, [
        initialMapPinSyncStatus,
        initialMapPinSyncStatus?.syncRunId,
        initialMapPinSyncStatus?.status,
        initialMapPinSyncStatus?.finishedAt,
    ]);

    useEffect(() => {
        if (mapPinSyncStatus === null || !mapPinSyncStatus.isRunning) {
            return;
        }

        let isActive = true;
        let timeoutId: number | undefined;

        const pollMapPinSyncStatus = async () => {
            try {
                /*
                 * 状態確認はGETだけで行います。
                 * completed / failed になった時だけ保存済みmap pin一覧をpartial reloadし、
                 * 画面遷移なしで生成結果を確認できるようにします。
                 */
                const response = await axios.get<EarthquakeMapPinSyncResponse>(
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

                const nextStatus = response.data.syncStatus;

                if (nextStatus !== null) {
                    setMapPinSyncStatus(nextStatus);
                    setMapPinSyncPollingError(null);

                    if (!nextStatus.isRunning) {
                        router.reload({
                            only: ['savedMapPins', 'mapPinSyncStatus', 'mapPinSyncRuns'],
                        });

                        return;
                    }
                }
            } catch {
                if (isActive) {
                    setMapPinSyncPollingError('地図ピン生成状態の取得に失敗しました');
                }
            }

            if (isActive) {
                timeoutId = window.setTimeout(
                    pollMapPinSyncStatus,
                    EARTHQUAKE_MAP_PIN_SYNC_POLL_INTERVAL_MS,
                );
            }
        };

        timeoutId = window.setTimeout(
            pollMapPinSyncStatus,
            EARTHQUAKE_MAP_PIN_SYNC_POLL_INTERVAL_MS,
        );

        return () => {
            isActive = false;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [mapPinSyncStatus?.syncRunId, mapPinSyncStatus?.isRunning]);

    return (
        <PublicLayout className="bg-slate-950/55 px-4 py-6 sm:px-6 lg:px-8">
            <Head title="QuakeWave Preview" />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 py-4">
                <header className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                            Development Tool
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                            QuakeWave Preview
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
                            地震波可視化 UI を、本実装・API 接続・DB 保存に入る前に画面単位で確認するための入口です。
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={startFeedEntrySync}
                            disabled={isFeedEntrySyncButtonDisabled}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-100/35 bg-cyan-100/15 px-4 text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/22 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isFeedEntrySyncButtonDisabled ? '取込中' : '地震feed取込'}
                        </button>
                        <button
                            type="button"
                            onClick={startMapPinSync}
                            disabled={isMapPinSyncButtonDisabled}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-100/35 bg-emerald-100/15 px-4 text-sm font-bold text-emerald-50 transition hover:bg-emerald-100/22 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isMapPinSyncButtonDisabled ? '生成中' : '地図ピン生成'}
                        </button>
                        <Link
                            href="/lab"
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                        >
                            Lab
                        </Link>
                    </div>
                </header>

                <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <article className="rounded-lg border border-cyan-100/25 bg-cyan-100/8 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${syncBadgeClassName(latestVisibleSyncStatus?.status ?? null)}`}>
                                    {latestVisibleSyncStatus?.status ?? 'idle'}
                                </span>
                                <h2 className="mt-3 text-xl font-semibold text-white">
                                    地震feed取込
                                </h2>
                            </div>
                            <span className="rounded-md border border-white/15 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                Queue
                            </span>
                        </div>

                        <p role="status" aria-live="polite" className="mt-4 text-sm font-semibold leading-6 text-cyan-50">
                            {feedEntrySyncMessage}
                        </p>

                        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Total</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.totalCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Inserted</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.insertedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Updated</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.updatedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Skipped</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.skippedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Failed</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleSyncStatus?.failedCount ?? 0}</dd>
                            </div>
                        </dl>

                        {latestVisibleSyncStatus?.errorMessage && (
                            <p className="mt-4 rounded-md border border-rose-200/35 bg-rose-200/10 px-3 py-2 text-sm leading-6 text-rose-50">
                                {latestVisibleSyncStatus.errorMessage}
                            </p>
                        )}

                        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm leading-6 sm:grid-cols-2">
                            <div>
                                <dt className="font-semibold text-slate-300/70">startedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleSyncStatus?.startedAt)}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-300/70">finishedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleSyncStatus?.finishedAt)}</dd>
                            </div>
                        </dl>
                    </article>

                    <section className="rounded-lg border border-white/15 bg-slate-950/70 shadow-[0_18px_40px_rgba(2,6,23,0.22)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                            <h2 className="text-xl font-semibold text-white">
                                保存済みentry
                            </h2>
                            <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                {savedFeedEntries.length}件
                            </span>
                        </div>

                        <div className="max-h-[420px] divide-y divide-white/10 overflow-y-auto">
                            {savedFeedEntries.length > 0 ? (
                                savedFeedEntries.map((entry) => (
                                    <article key={entry.id} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">
                                                {entry.title}
                                            </h3>
                                            <p className="mt-2 break-all font-mono text-xs leading-5 text-cyan-50/78">
                                                {entry.entryId}
                                            </p>
                                        </div>
                                        <dl className="grid grid-cols-1 gap-2 text-sm leading-6 sm:grid-cols-2">
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">updated</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(entry.updatedAtFromFeed)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">published</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(entry.publishedAtFromFeed)}</dd>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <dt className="font-semibold text-slate-300/70">xmlUrl</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(entry.xmlUrl)}</dd>
                                            </div>
                                        </dl>
                                    </article>
                                ))
                            ) : (
                                <p className="px-5 py-8 text-sm leading-6 text-slate-200/75">
                                    保存済みentryはありません。
                                </p>
                            )}
                        </div>
                    </section>
                </section>

                <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                    <article className="rounded-lg border border-emerald-100/25 bg-emerald-100/8 p-5 shadow-[0_18px_40px_rgba(16,185,129,0.12)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${syncBadgeClassName(latestVisibleMapPinSyncStatus?.status ?? null)}`}>
                                    {latestVisibleMapPinSyncStatus?.status ?? 'idle'}
                                </span>
                                <h2 className="mt-3 text-xl font-semibold text-white">
                                    地図ピン生成
                                </h2>
                            </div>
                            <span className="rounded-md border border-white/15 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                Queue
                            </span>
                        </div>

                        <p role="status" aria-live="polite" className="mt-4 text-sm font-semibold leading-6 text-emerald-50">
                            {mapPinSyncMessage}
                        </p>

                        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Total</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.totalCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Inserted</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.insertedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Updated</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.updatedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Skipped</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.skippedCount ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300/70">Failed</dt>
                                <dd className="mt-1 text-2xl font-semibold text-white">{latestVisibleMapPinSyncStatus?.failedCount ?? 0}</dd>
                            </div>
                        </dl>

                        {latestVisibleMapPinSyncStatus?.errorMessage && (
                            <p className="mt-4 rounded-md border border-rose-200/35 bg-rose-200/10 px-3 py-2 text-sm leading-6 text-rose-50">
                                {latestVisibleMapPinSyncStatus.errorMessage}
                            </p>
                        )}

                        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm leading-6 sm:grid-cols-2">
                            <div>
                                <dt className="font-semibold text-slate-300/70">startedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleMapPinSyncStatus?.startedAt)}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-300/70">finishedAt</dt>
                                <dd className="break-all text-slate-100">{valueOrDash(latestVisibleMapPinSyncStatus?.finishedAt)}</dd>
                            </div>
                        </dl>
                    </article>

                    <section className="rounded-lg border border-white/15 bg-slate-950/70 shadow-[0_18px_40px_rgba(2,6,23,0.22)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                            <h2 className="text-xl font-semibold text-white">
                                保存済みmap pin
                            </h2>
                            <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                {savedMapPins.length}件
                            </span>
                        </div>

                        <div className="max-h-[420px] divide-y divide-white/10 overflow-y-auto">
                            {savedMapPins.length > 0 ? (
                                savedMapPins.map((pin) => (
                                    <article key={pin.id} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">
                                                {valueOrDash(pin.title)}
                                            </h3>
                                            <p className="mt-2 break-all font-mono text-xs leading-5 text-emerald-50/78">
                                                {valueOrDash(pin.eventId)}
                                            </p>
                                        </div>
                                        <dl className="grid grid-cols-1 gap-2 text-sm leading-6 sm:grid-cols-2">
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">area</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.areaName)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">maxIntensity</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.maxIntensity)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">lat / lng</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.latitude)} / {valueOrDash(pin.longitude)}</dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold text-slate-300/70">reported</dt>
                                                <dd className="break-all text-slate-100">{valueOrDash(pin.reportedAt)}</dd>
                                            </div>
                                        </dl>
                                    </article>
                                ))
                            ) : (
                                <p className="px-5 py-8 text-sm leading-6 text-slate-200/75">
                                    保存済みmap pinはありません。
                                </p>
                            )}
                        </div>
                    </section>
                </section>

                {/*
                    OBENTO 構造は「主役の大きい区画」と部品確認を同じ入口で見せるための
                    開発用レイアウトです。予定だけのカードは置かず、今確認できるものだけを並べます。
                */}
                <section className="grid grid-cols-1 gap-3 md:grid-cols-6 xl:grid-cols-12">
                    {mapMock && (
                        <Link
                            href={mapMock.href}
                            className="group flex min-h-[300px] flex-col justify-between rounded-lg border border-cyan-100/35 bg-cyan-100/10 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)] transition hover:border-cyan-100/70 hover:bg-cyan-100/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 md:col-span-6 xl:col-span-7 xl:row-span-2"
                        >
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(mapMock.status)}`}>
                                        {mapMock.status}
                                    </span>
                                    <span className="rounded-md border border-cyan-100/30 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                                        Primary
                                    </span>
                                </div>
                                <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                                    {mapMock.title}
                                </h2>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/85">
                                    {mapMock.summary}
                                </p>
                            </div>
                            <span className="mt-8 text-sm font-bold text-cyan-100 transition group-hover:text-white">
                                モックを開く
                            </span>
                        </Link>
                    )}

                    {xmlMock && (
                        <Link
                            href={xmlMock.href}
                            className="group flex min-h-[144px] flex-col justify-between rounded-lg border border-emerald-200/30 bg-emerald-200/10 p-4 transition hover:border-emerald-100/60 hover:bg-emerald-200/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 md:col-span-3 xl:col-span-5"
                        >
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClassName(xmlMock.status)}`}>
                                        {xmlMock.status}
                                    </span>
                                    <span className="rounded-md border border-emerald-100/30 bg-slate-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                                        Atom feed
                                    </span>
                                </div>
                                <h3 className="mt-3 text-lg font-semibold text-white">
                                    {xmlMock.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-200/80">
                                    {xmlMock.summary}
                                </p>
                            </div>
                            <span className="mt-4 text-sm font-bold text-emerald-100 transition group-hover:text-white">
                                取得画面を開く
                            </span>
                        </Link>
                    )}

                    <article className="flex min-h-[220px] flex-col rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-3 xl:col-span-5">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                DTO Preview
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                ピン表示
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            Laravel 側 DTO から渡した震度別のピン見本です。地図上への配置はまだ行いません。
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {visualPreview.pins.map((pin) => (
                                <EarthquakePin key={`${pin.label}-${pin.sizeLabel}`} pin={pin} />
                            ))}
                        </div>
                    </article>

                    <article className="flex min-h-[220px] flex-col rounded-lg border border-white/15 bg-slate-950/62 p-4 md:col-span-3 xl:col-span-5">
                        <div>
                            <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-amber-50">
                                DTO Preview
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-white">
                                波紋レイヤー
                            </h3>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-200/75">
                            Laravel 側 DTO から渡した波紋見本です。XML 取得結果や MAP 表示にはまだ接続しません。
                        </p>
                        <div className="mt-5 grid gap-5">
                            {visualPreview.ripples.map((ripple) => (
                                <EarthquakeRipple key={`${ripple.label}-${ripple.ringCount}`} ripple={ripple} />
                            ))}
                        </div>
                    </article>

                </section>
            </div>
        </PublicLayout>
    );
}
