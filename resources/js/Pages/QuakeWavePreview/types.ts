import type { EarthquakePinPreview } from '@/Components/JapanQuakeWaveMap/EarthquakePin';
import type { EarthquakeRipplePreview } from '@/Components/JapanQuakeWaveMap/EarthquakeRipple';

export type QuakeWavePreviewMock = {
    id: string;
    title: string;
    summary: string;
    status: string;
    href: string;
};

export type EarthquakeFeedEntry = {
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

export type EarthquakeSyncStatusValue = 'pending' | 'running' | 'completed' | 'failed';

export type EarthquakeSyncStatus = {
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

export type EarthquakeFeedEntrySyncStatus = EarthquakeSyncStatus;

export type EarthquakeMapPin = {
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

export type EarthquakeMapPinSyncStatus = EarthquakeSyncStatus;

export type EarthquakeSyncStartResponse = {
    syncRunId?: number;
    message?: string;
    syncStatus: EarthquakeSyncStatus | null;
};

export type EarthquakeSyncStatusResponse = {
    syncStatus: EarthquakeSyncStatus | null;
};

export type EarthquakeMapRefreshResponse = {
    feedEntrySyncRunId?: number;
    mapPinSyncRunId?: number;
    feedEntrySyncStatus: EarthquakeSyncStatus | null;
    mapPinSyncStatus: EarthquakeSyncStatus | null;
    message?: string;
};

export type QuakeWavePreviewIndexProps = {
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
