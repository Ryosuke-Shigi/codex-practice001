import { describe, expect, it } from 'vitest';

import type { EarthquakeSyncStatus } from '@/Pages/QuakeWavePreview/types';
import {
    mapRefreshStatusLabel,
    syncStatusOrPendingFromRunId,
} from '@/Pages/QuakeWavePreview/utils/quakeSyncStatus';

function syncStatus(overrides: Partial<EarthquakeSyncStatus> = {}): EarthquakeSyncStatus {
    const baseStatus: EarthquakeSyncStatus = {
        syncRunId: 1,
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

    return {
        ...baseStatus,
        ...overrides,
    };
}

describe('syncStatusOrPendingFromRunId', () => {
    it('keeps an explicit status before building a pending fallback', () => {
        const completedStatus = syncStatus({
            status: 'completed',
            isRunning: false,
            syncRunId: 10,
            finishedAt: '2026-05-11T08:30:00+09:00',
        });

        expect(syncStatusOrPendingFromRunId(completedStatus, 20)).toBe(completedStatus);
    });

    it('builds a pending status from a sync run id', () => {
        expect(syncStatusOrPendingFromRunId(null, 20)).toEqual(syncStatus({
            syncRunId: 20,
        }));
    });

    it('returns null when no status or run id is available', () => {
        expect(syncStatusOrPendingFromRunId(null, undefined)).toBeNull();
    });
});

describe('mapRefreshStatusLabel', () => {
    it('prioritizes start, error, failed, running, and completed states', () => {
        const feedRunning = syncStatus({ status: 'running', isRunning: true });
        const mapRunning = syncStatus({ syncRunId: 2, status: 'running', isRunning: true });
        const feedCompleted = syncStatus({
            status: 'completed',
            isRunning: false,
            finishedAt: '2026-05-11T08:30:00+09:00',
        });
        const mapCompleted = syncStatus({
            syncRunId: 2,
            status: 'completed',
            isRunning: false,
            finishedAt: '2026-05-11T08:32:00+09:00',
        });

        expect(mapRefreshStatusLabel(null, null, true, null)).toBe(
            '地図データ更新Jobを投入しています',
        );
        expect(mapRefreshStatusLabel(null, null, false, '状態取得に失敗しました')).toBe(
            '状態取得に失敗しました',
        );
        expect(mapRefreshStatusLabel(syncStatus({ status: 'failed', isRunning: false }), null, false, null)).toBe(
            '地図データ更新に失敗しました',
        );
        expect(mapRefreshStatusLabel(feedRunning, null, false, null)).toBe(
            'XML取込を実行中です',
        );
        expect(mapRefreshStatusLabel(feedCompleted, mapRunning, false, null)).toBe(
            '地図ピン生成を実行中です',
        );
        expect(mapRefreshStatusLabel(feedCompleted, mapCompleted, false, null)).toBe(
            '地図データ更新が完了しました',
        );
        expect(mapRefreshStatusLabel(null, null, false, null)).toBe(
            'XML取込とPIN生成を1つのJobで開始できます',
        );
    });
});
