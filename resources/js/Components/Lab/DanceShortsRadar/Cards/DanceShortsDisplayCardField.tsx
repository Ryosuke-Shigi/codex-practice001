import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DanceShortsCandidateCard from '../DanceShortsCandidateCard';
import DanceShortsRisingCandidateCard from '../DanceShortsRisingCandidateCard';
import {
    DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES,
    type DanceShortsDisplayCardField,
    type DanceShortsDisplayCardWindowRequest,
} from '../types';
import EmptyDisplayCardField from './EmptyDisplayCardField';
import LoadingDisplayCardField from './LoadingDisplayCardField';

type DanceShortsDisplayCardFieldProps = {
    displayCardField: DanceShortsDisplayCardField;
    windowRequest: DanceShortsDisplayCardWindowRequest;
};

type WindowCache = Record<number, DanceShortsDisplayCardField>;

/*
 * サーバーから同じ startRank が返ってきても、タブ・並び順・元データが変われば別 window として
 * 扱う必要があります。カードID相当の値まで含めた key を作り、Inertia の再描画時に
 * 古い cache や activeIndex が残らないようにします。
 */
function cacheKeyFor(field: DanceShortsDisplayCardField) {
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

/*
 * 5件 window の3枚目に到達した時点で次 window を先読みします。
 * ユーザーが4枚目、5枚目へ進む間に API を待てるため、window 境界を越える操作で
 * Loading が見える時間を短くできます。
 */
function shouldPrefetchNextWindow(
    field: DanceShortsDisplayCardField,
    activeIndex: number,
) {
    return (
        field.pagination.hasNext &&
        field.pagination.nextStartRank !== null &&
        activeIndex >= 2
    );
}

function rankForIndex(field: DanceShortsDisplayCardField, index: number) {
    return field.pagination.startRank + index;
}

/*
 * displayCardField は Laravel 側で確定した現在windowだけを受け取ります。
 * React 側では受け取ったwindowをcacheし、前後移動、先読み、Loading表示、カード本体の
 * 表示だけを扱います。ranking / rising の判定やsortはここでは行いません。
 */
export default function DanceShortsDisplayCardField({
    displayCardField,
    windowRequest,
}: DanceShortsDisplayCardFieldProps) {
    const initialWindowKey = useMemo(
        () => cacheKeyFor(displayCardField),
        [displayCardField],
    );
    const [windowCache, setWindowCache] = useState<WindowCache>({
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
        /*
         * タブ・比較日数・並び順が変わって Inertia から新しい initial window が届いたら、
         * 以前の条件で cache した window や移動中状態をすべて捨てます。
         */
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
    const canMovePrev =
        activeIndex > 0 || currentWindow.pagination.hasPrev;
    const canMoveNext =
        activeIndex < currentWindow.visibleCards.length - 1 ||
        currentWindow.pagination.hasNext;

    const loadWindow = useCallback(
        async (startRank: number, mode: 'prefetch' | 'switch') => {
            const cachedWindow = windowCacheRef.current[startRank];

            if (cachedWindow !== undefined) {
                return cachedWindow;
            }

            const inflightWindow = inflightWindowsRef.current.get(startRank);

            if (inflightWindow !== undefined) {
                return inflightWindow;
            }

            const requestWindow = (async () => {
                setIsPrefetching(mode === 'prefetch');

                try {
                    const params = new URLSearchParams({
                        tab: windowRequest.tab,
                        comparisonDays: String(windowRequest.comparisonDays),
                        sort: windowRequest.sortKey,
                        startRank: String(startRank),
                        windowSize: String(currentWindow.pagination.windowSize),
                    });
                    const response = await fetch(
                        `/api/dance-shorts-radar/display-card-window?${params.toString()}`,
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
                    const nextWindow = payload.displayCardField;

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
        },
        [
            currentWindow.pagination.windowSize,
            windowRequest.comparisonDays,
            windowRequest.sortKey,
            windowRequest.tab,
        ],
    );

    useEffect(() => {
        if (!shouldPrefetchNextWindow(currentWindow, activeIndex)) {
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

    const moveToNext = useCallback(async () => {
        if (!canMoveNext || isWindowSwitching) {
            return;
        }

        if (activeIndex < currentWindow.visibleCards.length - 1) {
            setActiveIndex((current) => current + 1);
            return;
        }

        const nextStartRank = currentWindow.pagination.nextStartRank;

        if (nextStartRank === null) {
            return;
        }

        const cachedWindow = windowCacheRef.current[nextStartRank];

        if (cachedWindow !== undefined) {
            setActiveStartRank(nextStartRank);
            setActiveIndex(cachedWindow.activeIndex);
            return;
        }

        setIsWindowSwitching(true);
        const loadedWindow = await loadWindow(nextStartRank, 'switch');

        if (loadedWindow !== null) {
            setActiveStartRank(nextStartRank);
            setActiveIndex(loadedWindow.activeIndex);
        }

        setIsWindowSwitching(false);
    }, [
        activeIndex,
        canMoveNext,
        currentWindow,
        isWindowSwitching,
        loadWindow,
    ]);

    const moveToPrevious = useCallback(async () => {
        if (!canMovePrev || isWindowSwitching) {
            return;
        }

        if (activeIndex > 0) {
            setActiveIndex((current) => current - 1);
            return;
        }

        const prevStartRank = currentWindow.pagination.prevStartRank;

        if (prevStartRank === null) {
            return;
        }

        const cachedWindow = windowCacheRef.current[prevStartRank];

        if (cachedWindow !== undefined) {
            setActiveStartRank(prevStartRank);
            setActiveIndex(Math.max(0, cachedWindow.visibleCards.length - 1));
            return;
        }

        setIsWindowSwitching(true);
        const loadedWindow = await loadWindow(prevStartRank, 'switch');

        if (loadedWindow !== null) {
            setActiveStartRank(prevStartRank);
            setActiveIndex(Math.max(0, loadedWindow.visibleCards.length - 1));
        }

        setIsWindowSwitching(false);
    }, [
        activeIndex,
        canMovePrev,
        currentWindow,
        isWindowSwitching,
        loadWindow,
    ]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName;

            if (
                tagName === 'INPUT' ||
                tagName === 'TEXTAREA' ||
                target?.isContentEditable
            ) {
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                void moveToPrevious();
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                void moveToNext();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [moveToNext, moveToPrevious]);

    if (currentWindow.visibleCards.length === 0) {
        return (
            <EmptyDisplayCardField
                message={
                    currentWindow.emptyMessage ??
                    '表示できるカードはまだありません。'
                }
            />
        );
    }

    if (activeCard === undefined) {
        return (
            <EmptyDisplayCardField message="表示できるカードはまだありません。" />
        );
    }

    return (
        <section
            id="dance-shorts-card-field"
            className="relative h-full min-h-0 overflow-hidden"
            aria-busy={isWindowSwitching || isPrefetching}
        >
            <div className="h-full min-h-0">
                {isWindowSwitching ? (
                    <LoadingDisplayCardField />
                ) : (
                    <div className="relative mx-auto h-full min-h-0 w-full max-w-md sm:max-w-3xl lg:max-w-4xl">
                        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 flex items-center justify-between px-1.5 sm:px-2">
                            <button
                                type="button"
                                onClick={() => void moveToPrevious()}
                                disabled={!canMovePrev || isWindowSwitching}
                                aria-label="前のカードへ移動"
                                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/36 bg-slate-950/70 text-xl font-bold text-white shadow-[0_14px_26px_rgba(2,24,45,0.24)] backdrop-blur-xl transition hover:bg-slate-900/82 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                <span aria-hidden="true">&lt;</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => void moveToNext()}
                                disabled={!canMoveNext || isWindowSwitching}
                                aria-label="次のカードへ移動"
                                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/36 bg-slate-950/70 text-xl font-bold text-white shadow-[0_14px_26px_rgba(2,24,45,0.24)] backdrop-blur-xl transition hover:bg-slate-900/82 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                <span aria-hidden="true">&gt;</span>
                            </button>
                        </div>
                        {currentWindow.type ===
                        DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING &&
                        'region' in activeCard ? (
                            <DanceShortsCandidateCard
                                key={
                                    activeCard.youtube_video_id ??
                                    `${activeCard.region}-${activeCard.title}-${activeIndex}`
                                }
                                candidate={activeCard}
                                sortKey={windowRequest.sortKey}
                                rank={rankForIndex(currentWindow, activeIndex)}
                                isActive
                            />
                        ) : currentWindow.type ===
                          DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RISING &&
                          'source_region' in activeCard ? (
                            <DanceShortsRisingCandidateCard
                                key={
                                    activeCard.youtube_video_id ??
                                    `${activeCard.source_region}-${activeCard.title}-${activeIndex}`
                                }
                                title={activeCard.title}
                                publishedAt={activeCard.published_at}
                                sourceRegion={activeCard.source_region}
                                sourceRegionLabel={
                                    activeCard.source_region_label
                                }
                                sourceCollectedAt={
                                    activeCard.source_collected_at
                                }
                                japanStatus={activeCard.japan_status}
                                viewCountDelta={activeCard.view_count_delta}
                                viewGrowthRate={activeCard.view_growth_rate}
                                japanViewCountDelta={
                                    activeCard.japan_view_count_delta ?? null
                                }
                                thumbnailUrl={activeCard.thumbnail_url}
                                youtubeUrl={activeCard.youtube_url}
                                tags={activeCard.tags}
                                observationNote={activeCard.observation_note}
                                rank={rankForIndex(currentWindow, activeIndex)}
                                isActive
                            />
                        ) : (
                            <EmptyDisplayCardField message="表示できるカードはまだありません。" />
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
