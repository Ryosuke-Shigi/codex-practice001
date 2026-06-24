/**
 * DanceShortsRadar 表示カード window hook の通信境界と移動判定を固定します。
 */
import { describe, expect, it, vi } from 'vitest';

import {
    DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES,
    type DanceShortsCandidate,
    type DanceShortsDisplayCardField,
    type DanceShortsDisplayCardWindowRequest,
} from '../types';
import {
    createDanceShortsCardWindowUrl,
    fetchDanceShortsCardWindow,
    loadDanceShortsCardWindow,
    resolveDanceShortsCardWindowMove,
    shouldPrefetchDanceShortsCardWindow,
    type DanceShortsCardWindowCache,
} from './useDanceShortsCardWindow';

const windowRequest: DanceShortsDisplayCardWindowRequest = {
    tab: 'ALL',
    comparisonDays: 7,
    sortKey: 'view_count_delta',
};

function candidate(rank: number): DanceShortsCandidate {
    return {
        video_id: rank,
        youtube_video_id: `video-${rank}`,
        region: 'JP',
        title: `Ranking ${rank}`,
        channel_title: 'Dance Channel',
        published_at: '2026-06-01 12:00',
        collected_at: '2026-06-01 13:00',
        like_count: 100,
        comment_count: 10,
        view_count: 1000 + rank,
        previous_view_count: 900,
        view_diff: 100 + rank,
        view_growth_rate: 0.1,
        views_per_hour: 10,
        thumbnail_url: null,
        youtube_url: null,
    };
}

function rankingWindow({
    startRank,
    activeIndex = 0,
    hasPrev = false,
    hasNext = false,
    prevStartRank = null,
    nextStartRank = null,
    count = 5,
}: {
    startRank: number;
    activeIndex?: number;
    hasPrev?: boolean;
    hasNext?: boolean;
    prevStartRank?: number | null;
    nextStartRank?: number | null;
    count?: number;
}): DanceShortsDisplayCardField {
    return {
        type: DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING,
        visibleCards: Array.from({ length: count }, (_, index) =>
            candidate(startRank + index),
        ),
        activeIndex,
        activeRank: startRank + activeIndex,
        pagination: {
            startRank,
            windowSize: 5,
            hasPrev,
            hasNext,
            prevStartRank,
            nextStartRank,
        },
        emptyMessage: null,
    };
}

function applyState<T>(
    box: { current: T },
    value: T | ((previous: T) => T),
) {
    box.current =
        typeof value === 'function'
            ? (value as (previous: T) => T)(box.current)
            : value;
}

describe('useDanceShortsCardWindow helpers', () => {
    it('resolves next and previous moves across cached window boundaries', () => {
        const currentWindow = rankingWindow({
            startRank: 1,
            activeIndex: 4,
            hasNext: true,
            nextStartRank: 6,
        });
        const cachedNextWindow = rankingWindow({
            startRank: 6,
            activeIndex: 0,
            hasPrev: true,
            prevStartRank: 1,
        });

        expect(
            resolveDanceShortsCardWindowMove({
                direction: 1,
                currentWindow,
                activeIndex: 4,
                isWindowSwitching: false,
                cachedWindow: cachedNextWindow,
            }),
        ).toEqual({
            kind: 'cached-window',
            activeStartRank: 6,
            activeIndex: 0,
        });

        expect(
            resolveDanceShortsCardWindowMove({
                direction: -1,
                currentWindow: cachedNextWindow,
                activeIndex: 0,
                isWindowSwitching: false,
                cachedWindow: currentWindow,
            }),
        ).toEqual({
            kind: 'cached-window',
            activeStartRank: 1,
            activeIndex: 4,
        });
    });

    it('blocks disabled movement and moves inside the current window', () => {
        const currentWindow = rankingWindow({
            startRank: 1,
            activeIndex: 2,
        });

        expect(
            resolveDanceShortsCardWindowMove({
                direction: 1,
                currentWindow,
                activeIndex: 2,
                isWindowSwitching: false,
            }),
        ).toEqual({
            kind: 'inside-window',
            activeIndex: 3,
        });

        expect(
            resolveDanceShortsCardWindowMove({
                direction: 1,
                currentWindow,
                activeIndex: 4,
                isWindowSwitching: false,
            }),
        ).toEqual({ kind: 'blocked' });

        expect(
            resolveDanceShortsCardWindowMove({
                direction: -1,
                currentWindow,
                activeIndex: 2,
                isWindowSwitching: true,
            }),
        ).toEqual({ kind: 'blocked' });
    });

    it('prefetches after the third card when a next window exists', () => {
        const currentWindow = rankingWindow({
            startRank: 1,
            hasNext: true,
            nextStartRank: 6,
        });

        expect(shouldPrefetchDanceShortsCardWindow(currentWindow, 1)).toBe(
            false,
        );
        expect(shouldPrefetchDanceShortsCardWindow(currentWindow, 2)).toBe(
            true,
        );
        expect(
            shouldPrefetchDanceShortsCardWindow(
                rankingWindow({ startRank: 1 }),
                2,
            ),
        ).toBe(false);
    });

    it('builds the existing display card window API URL and Accept header', async () => {
        const nextWindow = rankingWindow({ startRank: 6 });
        const fetchWindow = vi.fn(async () =>
            Promise.resolve(
                new Response(
                    JSON.stringify({ displayCardField: nextWindow }),
                    { status: 200 },
                ),
            ),
        );

        await expect(
            fetchDanceShortsCardWindow(6, windowRequest, 5, fetchWindow),
        ).resolves.toStrictEqual(nextWindow);
        expect(
            createDanceShortsCardWindowUrl({
                windowRequest,
                startRank: 6,
                windowSize: 5,
            }),
        ).toBe(
            '/api/dance-shorts-radar/display-card-window?tab=ALL&comparisonDays=7&sort=view_count_delta&startRank=6&windowSize=5',
        );
        expect(fetchWindow).toHaveBeenCalledWith(
            '/api/dance-shorts-radar/display-card-window?tab=ALL&comparisonDays=7&sort=view_count_delta&startRank=6&windowSize=5',
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        );
    });

    it('reuses cached windows without fetching', async () => {
        const cachedWindow = rankingWindow({ startRank: 6 });
        const cacheRef = {
            current: {
                6: cachedWindow,
            } satisfies DanceShortsCardWindowCache,
        };
        const inflightWindowsRef = {
            current: new Map<
                number,
                Promise<DanceShortsDisplayCardField | null>
            >(),
        };
        const fetchWindow = vi.fn();

        await expect(
            loadDanceShortsCardWindow({
                startRank: 6,
                mode: 'switch',
                windowRequest,
                windowSize: 5,
                windowCacheRef: cacheRef,
                inflightWindowsRef,
                setWindowCache: (value) => applyState(cacheRef, value),
                setIsPrefetching: vi.fn(),
                fetchWindow,
            }),
        ).resolves.toBe(cachedWindow);
        expect(fetchWindow).not.toHaveBeenCalled();
    });

    it('deduplicates inflight window fetches for the same startRank', async () => {
        const nextWindow = rankingWindow({ startRank: 6 });
        const cacheRef: { current: DanceShortsCardWindowCache } = {
            current: {},
        };
        const inflightWindowsRef = {
            current: new Map<
                number,
                Promise<DanceShortsDisplayCardField | null>
            >(),
        };
        const setIsPrefetching = vi.fn();
        const fetchWindow = vi.fn(async () => nextWindow);

        const firstRequest = loadDanceShortsCardWindow({
            startRank: 6,
            mode: 'prefetch',
            windowRequest,
            windowSize: 5,
            windowCacheRef: cacheRef,
            inflightWindowsRef,
            setWindowCache: (value) => applyState(cacheRef, value),
            setIsPrefetching,
            fetchWindow,
        });
        const secondRequest = loadDanceShortsCardWindow({
            startRank: 6,
            mode: 'prefetch',
            windowRequest,
            windowSize: 5,
            windowCacheRef: cacheRef,
            inflightWindowsRef,
            setWindowCache: (value) => applyState(cacheRef, value),
            setIsPrefetching,
            fetchWindow,
        });

        expect(secondRequest).toBe(firstRequest);
        await expect(secondRequest).resolves.toBe(nextWindow);
        expect(fetchWindow).toHaveBeenCalledTimes(1);
        expect(cacheRef.current[6]).toBe(nextWindow);
        expect(inflightWindowsRef.current.size).toBe(0);
        expect(setIsPrefetching).toHaveBeenNthCalledWith(1, true);
        expect(setIsPrefetching).toHaveBeenLastCalledWith(false);
    });
});
