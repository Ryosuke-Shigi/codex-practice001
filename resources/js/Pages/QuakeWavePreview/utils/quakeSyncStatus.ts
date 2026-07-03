import type {
    EarthquakeSyncStatus,
    EarthquakeSyncStatusValue,
} from '@/Pages/QuakeWavePreview/types';

export function statusClassName(status: string) {
    return status === 'Ready'
        ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50'
        : 'border-amber-300/50 bg-amber-300/15 text-amber-50';
}

export function syncBadgeClassName(status: EarthquakeSyncStatusValue | null) {
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

export function valueOrDash(value: string | number | null | undefined) {
    return value === null || value === undefined || value === '' ? '-' : value;
}

export function pendingStatusFromSyncRunId(syncRunId: number): EarthquakeSyncStatus {
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

export function feedEntrySyncStatusMessage(
    status: EarthquakeSyncStatus | null,
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

export function mapPinSyncStatusMessage(
    status: EarthquakeSyncStatus | null,
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
