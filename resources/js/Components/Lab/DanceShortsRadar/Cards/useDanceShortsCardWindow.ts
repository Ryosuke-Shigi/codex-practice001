import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
    CardFieldTransitionDirection,
    CardFieldTransitionMode,
} from '../displayCardNavigation';
import type {
    DanceShortsDisplayCardField,
    DanceShortsDisplayCardWindowRequest,
} from '../types';

export type DanceShortsCardWindowCache = Record<
    number,
    DanceShortsDisplayCardField
>;
export type DanceShortsActiveDisplayCard =
    DanceShortsDisplayCardField['visibleCards'][number];
export type DanceShortsCardWindowLoadMode = 'prefetch' | 'switch';
export type DanceShortsCardWindowFetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
) => Promise<Response>;

type StateSetter<T> = (value: T | ((previous: T) => T)) => void;
type RefBox<T> = {
    current: T;
};
type DanceShortsCardWindowMoveResolution =
    | {
          kind: 'blocked';
      }
    | {
          kind: 'inside-window';
          activeIndex: number;
      }
    | {
          kind: 'cached-window';
          activeStartRank: number;
          activeIndex: number;
      }
    | {
          kind: 'load-window';
          startRank: number;
      };

type LoadDanceShortsCardWindowOptions = {
    startRank: number;
    mode: DanceShortsCardWindowLoadMode;
    windowRequest: DanceShortsDisplayCardWindowRequest;
    windowSize: number;
    windowCacheRef: RefBox<DanceShortsCardWindowCache>;
    inflightWindowsRef: RefBox<
        Map<number, Promise<DanceShortsDisplayCardField | null>>
    >;
    setWindowCache: StateSetter<DanceShortsCardWindowCache>;
    setIsPrefetching: StateSetter<boolean>;
    fetchWindow?: (
        startRank: number,
        windowRequest: DanceShortsDisplayCardWindowRequest,
        windowSize: number,
    ) => Promise<DanceShortsDisplayCardField | null>;
};

type UseDanceShortsCardWindowOptions = {
    displayCardField: DanceShortsDisplayCardField;
    windowRequest: DanceShortsDisplayCardWindowRequest;
    onCardMove: (
        direction: CardFieldTransitionDirection,
        mode: CardFieldTransitionMode,
    ) => void;
};

type ResolveDanceShortsCardWindowMoveOptions = {
    direction: CardFieldTransitionDirection;
    currentWindow: DanceShortsDisplayCardField;
    activeIndex: number;
    isWindowSwitching: boolean;
    cachedWindow?: DanceShortsDisplayCardField;
};

export function cacheKeyForDanceShortsCardWindow(
    field: DanceShortsDisplayCardField,
) {
    const cardIds = field.visibleCards
        .map((card) => {
            if ('region' in card) {
                return `${card.region}-${card.youtube_video_id ?? card.youtube_url ?? card.title}`;
            }

            return `${card.source_region}-${card.youtube_video_id ?? card.youtube_url ?? card.title}`;
        })
        .join('|');

    return `${field.type}:${field.pagination.startRank}:${field.pagination.windowSize}:${cardIds}`;
}

export function shouldPrefetchDanceShortsCardWindow(
    field: DanceShortsDisplayCardField,
    activeIndex: number,
) {
    return (
        field.pagination.hasNext &&
        field.pagination.nextStartRank !== null &&
        activeIndex >= 2
    );
}

export function rankForDanceShortsCardWindowIndex(
    field: DanceShortsDisplayCardField,
    index: number,
) {
    return field.pagination.startRank + index;
}

export function createDanceShortsCardWindowUrl({
    windowRequest,
    startRank,
    windowSize,
}: {
    windowRequest: DanceShortsDisplayCardWindowRequest;
    startRank: number;
    windowSize: number;
}) {
    const params = new URLSearchParams({
        tab: windowRequest.tab,
        comparisonDays: String(windowRequest.comparisonDays),
        sort: windowRequest.sortKey,
        startRank: String(startRank),
        windowSize: String(windowSize),
    });

    return `/api/dance-shorts-radar/display-card-window?${params.toString()}`;
}

export function resolveDanceShortsCardWindowMove({
    direction,
    currentWindow,
    activeIndex,
    isWindowSwitching,
    cachedWindow,
}: ResolveDanceShortsCardWindowMoveOptions): DanceShortsCardWindowMoveResolution {
    const canMove =
        direction === 1
            ? activeIndex < currentWindow.visibleCards.length - 1 ||
              currentWindow.pagination.hasNext
            : activeIndex > 0 || currentWindow.pagination.hasPrev;

    if (!canMove || isWindowSwitching) {
        return { kind: 'blocked' };
    }

    if (direction === 1 && activeIndex < currentWindow.visibleCards.length - 1) {
        return {
            kind: 'inside-window',
            activeIndex: activeIndex + 1,
        };
    }

    if (direction === -1 && activeIndex > 0) {
        return {
            kind: 'inside-window',
            activeIndex: activeIndex - 1,
        };
    }

    const startRank =
        direction === 1
            ? currentWindow.pagination.nextStartRank
            : currentWindow.pagination.prevStartRank;

    if (startRank === null) {
        return { kind: 'blocked' };
    }

    if (cachedWindow !== undefined) {
        return {
            kind: 'cached-window',
            activeStartRank: startRank,
            activeIndex:
                direction === 1
                    ? cachedWindow.activeIndex
                    : Math.max(0, cachedWindow.visibleCards.length - 1),
        };
    }

    return {
        kind: 'load-window',
        startRank,
    };
}

export async function fetchDanceShortsCardWindow(
    startRank: number,
    windowRequest: DanceShortsDisplayCardWindowRequest,
    windowSize: number,
    fetchWindow: DanceShortsCardWindowFetch = fetch,
) {
    const response = await fetchWindow(
        createDanceShortsCardWindowUrl({
            windowRequest,
            startRank,
            windowSize,
        }),
        {
            headers: {
                Accept: 'application/json',
            },
        },
    );

    if (!response.ok) {
        throw new Error('Failed to load display card window.');
    }

    const payload = (await response.json()) as {
        displayCardField: DanceShortsDisplayCardField;
    };

    return payload.displayCardField;
}

export function loadDanceShortsCardWindow({
    startRank,
    mode,
    windowRequest,
    windowSize,
    windowCacheRef,
    inflightWindowsRef,
    setWindowCache,
    setIsPrefetching,
    fetchWindow = fetchDanceShortsCardWindow,
}: LoadDanceShortsCardWindowOptions) {
    const cachedWindow = windowCacheRef.current[startRank];

    if (cachedWindow !== undefined) {
        return Promise.resolve(cachedWindow);
    }

    const inflightWindow = inflightWindowsRef.current.get(startRank);

    if (inflightWindow !== undefined) {
        return inflightWindow;
    }

    const requestWindow = (async () => {
        setIsPrefetching(mode === 'prefetch');

        try {
            const nextWindow = await fetchWindow(
                startRank,
                windowRequest,
                windowSize,
            );

            if (nextWindow === null) {
                return null;
            }

            setWindowCache((previousCache) => {
                if (previousCache[startRank] !== undefined) {
                    return previousCache;
                }

                return {
                    ...previousCache,
                    [startRank]: nextWindow,
                };
            });

            return nextWindow;
        } catch {
            return null;
        } finally {
            inflightWindowsRef.current.delete(startRank);
            setIsPrefetching(false);
        }
    })();

    inflightWindowsRef.current.set(startRank, requestWindow);

    return requestWindow;
}

/**
 * DanceShortsRadar 表示カードの window 状態機械と追加取得境界を扱います。
 *
 * JSXを持たず、現在window、active rank/index、cache、prefetch、window境界移動だけを返します。
 */
export default function useDanceShortsCardWindow({
    displayCardField,
    windowRequest,
    onCardMove,
}: UseDanceShortsCardWindowOptions) {
    const initialWindowKey = useMemo(
        () => cacheKeyForDanceShortsCardWindow(displayCardField),
        [displayCardField],
    );
    const [windowCache, setWindowCache] = useState<DanceShortsCardWindowCache>({
        [displayCardField.pagination.startRank]: displayCardField,
    });
    const windowCacheRef = useRef(windowCache);
    const inflightWindowsRef = useRef<
        Map<number, Promise<DanceShortsDisplayCardField | null>>
    >(new Map());
    const [activeStartRank, setActiveStartRank] = useState(
        displayCardField.pagination.startRank,
    );
    const [activeIndex, setActiveIndex] = useState(displayCardField.activeIndex);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [isWindowSwitching, setIsWindowSwitching] = useState(false);

    useEffect(() => {
        windowCacheRef.current = windowCache;
    }, [windowCache]);

    useEffect(() => {
        const nextCache = {
            [displayCardField.pagination.startRank]: displayCardField,
        };

        setWindowCache(nextCache);
        windowCacheRef.current = nextCache;
        inflightWindowsRef.current.clear();
        setActiveStartRank(displayCardField.pagination.startRank);
        setActiveIndex(displayCardField.activeIndex);
        setIsPrefetching(false);
        setIsWindowSwitching(false);
    }, [displayCardField, initialWindowKey]);

    const currentWindow = windowCache[activeStartRank] ?? displayCardField;
    const activeCard = currentWindow.visibleCards[activeIndex];
    const canMovePrev = activeIndex > 0 || currentWindow.pagination.hasPrev;
    const canMoveNext =
        activeIndex < currentWindow.visibleCards.length - 1 ||
        currentWindow.pagination.hasNext;

    const loadWindow = useCallback(
        (startRank: number, mode: DanceShortsCardWindowLoadMode) =>
            loadDanceShortsCardWindow({
                startRank,
                mode,
                windowRequest,
                windowSize: currentWindow.pagination.windowSize,
                windowCacheRef,
                inflightWindowsRef,
                setWindowCache,
                setIsPrefetching,
            }),
        [
            currentWindow.pagination.windowSize,
            windowRequest.comparisonDays,
            windowRequest.sortKey,
            windowRequest.tab,
        ],
    );

    useEffect(() => {
        if (!shouldPrefetchDanceShortsCardWindow(currentWindow, activeIndex)) {
            return;
        }

        const nextStartRank = currentWindow.pagination.nextStartRank;

        if (
            nextStartRank === null ||
            windowCacheRef.current[nextStartRank] !== undefined
        ) {
            return;
        }

        void loadWindow(nextStartRank, 'prefetch');
    }, [activeIndex, activeStartRank, currentWindow, loadWindow]);

    const moveToNext = useCallback(
        async (transitionMode: CardFieldTransitionMode = 'manual') => {
            const nextStartRank = currentWindow.pagination.nextStartRank;
            const resolution = resolveDanceShortsCardWindowMove({
                direction: 1,
                currentWindow,
                activeIndex,
                isWindowSwitching,
                cachedWindow:
                    nextStartRank === null
                        ? undefined
                        : windowCacheRef.current[nextStartRank],
            });

            if (resolution.kind === 'blocked') {
                return;
            }

            if (resolution.kind === 'inside-window') {
                onCardMove(1, transitionMode);
                setActiveIndex(resolution.activeIndex);
                return;
            }

            if (resolution.kind === 'cached-window') {
                onCardMove(1, transitionMode);
                setActiveStartRank(resolution.activeStartRank);
                setActiveIndex(resolution.activeIndex);
                return;
            }

            setIsWindowSwitching(true);

            try {
                const loadedWindow = await loadWindow(
                    resolution.startRank,
                    'switch',
                );

                if (loadedWindow !== null) {
                    onCardMove(1, transitionMode);
                    setActiveStartRank(resolution.startRank);
                    setActiveIndex(loadedWindow.activeIndex);
                }
            } finally {
                setIsWindowSwitching(false);
            }
        },
        [
            activeIndex,
            currentWindow,
            isWindowSwitching,
            loadWindow,
            onCardMove,
        ],
    );

    const moveToPrevious = useCallback(
        async (transitionMode: CardFieldTransitionMode = 'manual') => {
            const prevStartRank = currentWindow.pagination.prevStartRank;
            const resolution = resolveDanceShortsCardWindowMove({
                direction: -1,
                currentWindow,
                activeIndex,
                isWindowSwitching,
                cachedWindow:
                    prevStartRank === null
                        ? undefined
                        : windowCacheRef.current[prevStartRank],
            });

            if (resolution.kind === 'blocked') {
                return;
            }

            if (resolution.kind === 'inside-window') {
                onCardMove(-1, transitionMode);
                setActiveIndex(resolution.activeIndex);
                return;
            }

            if (resolution.kind === 'cached-window') {
                onCardMove(-1, transitionMode);
                setActiveStartRank(resolution.activeStartRank);
                setActiveIndex(resolution.activeIndex);
                return;
            }

            setIsWindowSwitching(true);

            try {
                const loadedWindow = await loadWindow(
                    resolution.startRank,
                    'switch',
                );

                if (loadedWindow !== null) {
                    onCardMove(-1, transitionMode);
                    setActiveStartRank(resolution.startRank);
                    setActiveIndex(
                        Math.max(0, loadedWindow.visibleCards.length - 1),
                    );
                }
            } finally {
                setIsWindowSwitching(false);
            }
        },
        [
            activeIndex,
            currentWindow,
            isWindowSwitching,
            loadWindow,
            onCardMove,
        ],
    );

    return {
        activeCard,
        activeIndex,
        activeStartRank,
        canMoveNext,
        canMovePrev,
        currentWindow,
        isPrefetching,
        isWindowSwitching,
        moveToNext,
        moveToPrevious,
    };
}
