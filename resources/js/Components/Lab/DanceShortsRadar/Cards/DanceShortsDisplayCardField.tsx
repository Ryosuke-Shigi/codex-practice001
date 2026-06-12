import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, TouchEvent } from 'react';

import DanceShortsCandidateCard from '../DanceShortsCandidateCard';
import DanceShortsRisingCandidateCard from '../DanceShortsRisingCandidateCard';
import {
    autoSlideIntervalMs,
    cardFieldTransitionClassNames,
    canStartAutoSlide,
    detectCardSwipe,
    selectOptionDirectionForVerticalSwipe,
    type CardFieldTransitionDirection,
    type CardFieldTransitionMode,
} from '../displayCardNavigation';
import {
    isNavigableSelectOption,
    selectLoopedOption,
    type DanceShortsDisplaySelectGroup,
    type DanceShortsDisplaySelectGroupKey,
} from '../displaySelectGroups';
import { DANCE_SHORTS_RADAR_RELOAD_OPTIONS } from '../inertiaReloadOptions';
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
    selectGroups: DanceShortsDisplaySelectGroup[];
    activeSelectGroup: DanceShortsDisplaySelectGroupKey;
};

type WindowCache = Record<number, DanceShortsDisplayCardField>;
type AutoSlideDirection = CardFieldTransitionDirection;
type CardFieldTransitionState = {
    direction: CardFieldTransitionDirection;
    mode: CardFieldTransitionMode;
    sequence: number;
};

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

/**
 * displayCardField は Laravel 側で確定した現在windowだけを受け取ります。
 * React 側では受け取ったwindowをcacheし、前後移動、先読み、Loading表示、カード本体の
 * 表示だけを扱います。ranking / rising の判定やsortはここでは行いません。
 */
export default function DanceShortsDisplayCardField({
    displayCardField,
    windowRequest,
    selectGroups,
    activeSelectGroup,
}: DanceShortsDisplayCardFieldProps) {
    const initialWindowKey = useMemo(
        () => cacheKeyFor(displayCardField),
        [displayCardField],
    );
    const [windowCache, setWindowCache] = useState<WindowCache>({
        [displayCardField.pagination.startRank]: displayCardField,
    });
    const windowCacheRef = useRef(windowCache);
    const cardTouchStartRef = useRef<{ x: number; y: number } | null>(null);
    const inflightWindowsRef = useRef<
        Map<number, Promise<DanceShortsDisplayCardField | null>>
    >(new Map());
    const [activeStartRank, setActiveStartRank] = useState(
        displayCardField.pagination.startRank,
    );
    const [activeIndex, setActiveIndex] = useState(displayCardField.activeIndex);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [isWindowSwitching, setIsWindowSwitching] = useState(false);
    const [autoSlideDirection, setAutoSlideDirection] =
        useState<AutoSlideDirection | null>(null);
    const [cardFieldTransition, setCardFieldTransition] =
        useState<CardFieldTransitionState | null>(null);

    const stopAutoSlide = useCallback(() => {
        setAutoSlideDirection(null);
    }, []);

    const triggerCardFieldTransition = useCallback(
        (
            direction: CardFieldTransitionDirection,
            mode: CardFieldTransitionMode,
        ) => {
            setCardFieldTransition((current) => ({
                direction,
                mode,
                sequence: (current?.sequence ?? 0) + 1,
            }));
        },
        [],
    );

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
        setCardFieldTransition(null);
        stopAutoSlide();
    }, [displayCardField, initialWindowKey, stopAutoSlide]);

    const currentWindow = windowCache[activeStartRank] ?? displayCardField;
    const activeCard = currentWindow.visibleCards[activeIndex];
    const canMovePrev = activeIndex > 0 || currentWindow.pagination.hasPrev;
    const canMoveNext =
        activeIndex < currentWindow.visibleCards.length - 1 ||
        currentWindow.pagination.hasNext;
    const canStartCurrentAutoSlide = canStartAutoSlide(
        currentWindow.visibleCards.length,
    );
    const currentSelectGroup =
        selectGroups.find((group) => group.key === activeSelectGroup) ??
        selectGroups[0] ??
        null;

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

    useEffect(() => {
        if (autoSlideDirection === null) {
            return;
        }

        const stopOnUserAction = () => stopAutoSlide();

        window.addEventListener('click', stopOnUserAction);
        window.addEventListener('pointerdown', stopOnUserAction);
        window.addEventListener('touchstart', stopOnUserAction);

        return () => {
            window.removeEventListener('click', stopOnUserAction);
            window.removeEventListener('pointerdown', stopOnUserAction);
            window.removeEventListener('touchstart', stopOnUserAction);
        };
    }, [autoSlideDirection, stopAutoSlide]);

    const moveToNext = useCallback(async (
        transitionMode: CardFieldTransitionMode = 'manual',
    ) => {
        if (!canMoveNext || isWindowSwitching) {
            return;
        }

        if (activeIndex < currentWindow.visibleCards.length - 1) {
            triggerCardFieldTransition(1, transitionMode);
            setActiveIndex((current) => current + 1);
            return;
        }

        const nextStartRank = currentWindow.pagination.nextStartRank;

        if (nextStartRank === null) {
            return;
        }

        const cachedWindow = windowCacheRef.current[nextStartRank];

        if (cachedWindow !== undefined) {
            triggerCardFieldTransition(1, transitionMode);
            setActiveStartRank(nextStartRank);
            setActiveIndex(cachedWindow.activeIndex);
            return;
        }

        setIsWindowSwitching(true);
        const loadedWindow = await loadWindow(nextStartRank, 'switch');

        if (loadedWindow !== null) {
            triggerCardFieldTransition(1, transitionMode);
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
        triggerCardFieldTransition,
    ]);

    const moveToPrevious = useCallback(async (
        transitionMode: CardFieldTransitionMode = 'manual',
    ) => {
        if (!canMovePrev || isWindowSwitching) {
            return;
        }

        if (activeIndex > 0) {
            triggerCardFieldTransition(-1, transitionMode);
            setActiveIndex((current) => current - 1);
            return;
        }

        const prevStartRank = currentWindow.pagination.prevStartRank;

        if (prevStartRank === null) {
            return;
        }

        const cachedWindow = windowCacheRef.current[prevStartRank];

        if (cachedWindow !== undefined) {
            triggerCardFieldTransition(-1, transitionMode);
            setActiveStartRank(prevStartRank);
            setActiveIndex(Math.max(0, cachedWindow.visibleCards.length - 1));
            return;
        }

        setIsWindowSwitching(true);
        const loadedWindow = await loadWindow(prevStartRank, 'switch');

        if (loadedWindow !== null) {
            triggerCardFieldTransition(-1, transitionMode);
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
        triggerCardFieldTransition,
    ]);

    useEffect(() => {
        if (autoSlideDirection === null) {
            return;
        }

        if (!canStartAutoSlide(currentWindow.visibleCards.length)) {
            stopAutoSlide();
            return;
        }

        if (
            (autoSlideDirection === 1 && !canMoveNext) ||
            (autoSlideDirection === -1 && !canMovePrev)
        ) {
            stopAutoSlide();
            return;
        }

        const intervalId = window.setInterval(() => {
            if (autoSlideDirection === 1) {
                void moveToNext('auto');
                return;
            }

            void moveToPrevious('auto');
        }, autoSlideIntervalMs);

        return () => window.clearInterval(intervalId);
    }, [
        autoSlideDirection,
        canMoveNext,
        canMovePrev,
        currentWindow.visibleCards.length,
        moveToNext,
        moveToPrevious,
        stopAutoSlide,
    ]);

    const visitSelectOptionBySwipe = useCallback(
        (direction: -1 | 1) => {
            if (currentSelectGroup === null) {
                return;
            }

            const option = selectLoopedOption(
                currentSelectGroup.options,
                direction,
            );

            if (option === null || !isNavigableSelectOption(option)) {
                return;
            }

            router.get(option.href, {}, DANCE_SHORTS_RADAR_RELOAD_OPTIONS);
        },
        [currentSelectGroup],
    );

    const onAutoSlideButtonPointerDown = (
        event: PointerEvent<HTMLButtonElement>,
    ) => {
        event.stopPropagation();
    };

    const onAutoSlideButtonTouchStart = (
        event: TouchEvent<HTMLButtonElement>,
    ) => {
        event.stopPropagation();
    };

    const onAutoSlideButtonClick = (
        event: MouseEvent<HTMLButtonElement>,
        direction: AutoSlideDirection,
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (!canStartCurrentAutoSlide) {
            return;
        }

        setAutoSlideDirection((current) =>
            current === direction ? null : direction,
        );
    };

    const thumbnailControls = {
        topRight: (
            <button
                type="button"
                aria-label="自動右送りを切り替え"
                aria-pressed={autoSlideDirection === 1}
                disabled={!canStartCurrentAutoSlide}
                onPointerDown={onAutoSlideButtonPointerDown}
                onTouchStart={onAutoSlideButtonTouchStart}
                onClick={(event) => onAutoSlideButtonClick(event, 1)}
                className={[
                    'grid h-7 min-w-11 place-items-center rounded-full border px-2 text-xs font-black text-white shadow-[0_10px_20px_rgba(14,116,144,0.18)] backdrop-blur-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100/50 disabled:cursor-not-allowed disabled:opacity-35',
                    autoSlideDirection === 1
                        ? 'border-white/70 bg-pink-500/75'
                        : 'border-white/50 bg-sky-500/65 hover:bg-pink-500/70',
                ].join(' ')}
            >
                <span aria-hidden="true">&gt;&gt;</span>
            </button>
        ),
        bottomLeft: (
            <button
                type="button"
                aria-label="自動左送りを切り替え"
                aria-pressed={autoSlideDirection === -1}
                disabled={!canStartCurrentAutoSlide}
                onPointerDown={onAutoSlideButtonPointerDown}
                onTouchStart={onAutoSlideButtonTouchStart}
                onClick={(event) => onAutoSlideButtonClick(event, -1)}
                className={[
                    'grid h-7 min-w-11 place-items-center rounded-full border px-2 text-xs font-black text-white shadow-[0_10px_20px_rgba(14,116,144,0.18)] backdrop-blur-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100/50 disabled:cursor-not-allowed disabled:opacity-35',
                    autoSlideDirection === -1
                        ? 'border-white/70 bg-pink-500/75'
                        : 'border-white/50 bg-sky-500/65 hover:bg-pink-500/70',
                ].join(' ')}
            >
                <span aria-hidden="true">&lt;&lt;</span>
            </button>
        ),
    };

    const onTouchStart = (event: TouchEvent<HTMLElement>) => {
        const touch = event.touches[0];

        stopAutoSlide();
        cardTouchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
        };
    };

    const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
        const start = cardTouchStartRef.current;

        cardTouchStartRef.current = null;

        if (start === null) {
            return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        const swipeDirection = detectCardSwipe(deltaX, deltaY);

        if (swipeDirection === null) {
            return;
        }

        event.preventDefault();
        stopAutoSlide();

        if (swipeDirection === 'left') {
            void moveToNext();
            return;
        }

        if (swipeDirection === 'right') {
            void moveToPrevious();
            return;
        }

        const selectOptionDirection =
            selectOptionDirectionForVerticalSwipe(swipeDirection);

        if (selectOptionDirection !== null) {
            visitSelectOptionBySwipe(selectOptionDirection);
        }
    };

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

            stopAutoSlide();

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
    }, [moveToNext, moveToPrevious, stopAutoSlide]);

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

    const cardFieldTransitionClassName =
        cardFieldTransitionClassNames(cardFieldTransition);
    const cardShellClassName = 'w-full max-h-full min-h-0';
    const cardFieldTransitionKey = cardFieldTransition?.sequence ?? 0;

    return (
        <section
            id="dance-shorts-card-field"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="relative h-full min-h-0 touch-none overflow-hidden"
            aria-busy={isWindowSwitching || isPrefetching}
        >
            <div className="flex h-full min-h-0 items-start justify-center">
                {isWindowSwitching ? (
                    <LoadingDisplayCardField />
                ) : (
                    <div className="relative mx-auto max-h-full min-h-0 w-full max-w-md overflow-hidden landscape:max-w-sm sm:max-w-lg lg:max-w-xl lg:landscape:max-w-xl">
                        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 flex items-center justify-between px-1.5 sm:px-2">
                            <button
                                type="button"
                                onClick={() => {
                                    stopAutoSlide();
                                    void moveToPrevious();
                                }}
                                disabled={!canMovePrev || isWindowSwitching}
                                aria-label="前のカードへ移動"
                                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-sky-500/70 text-xl font-bold text-white shadow-[0_14px_26px_rgba(14,116,144,0.22)] backdrop-blur-xl transition hover:bg-pink-500/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100/50 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                <span aria-hidden="true">&lt;</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    stopAutoSlide();
                                    void moveToNext();
                                }}
                                disabled={!canMoveNext || isWindowSwitching}
                                aria-label="次のカードへ移動"
                                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-sky-500/70 text-xl font-bold text-white shadow-[0_14px_26px_rgba(14,116,144,0.22)] backdrop-blur-xl transition hover:bg-pink-500/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100/50 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                <span aria-hidden="true">&gt;</span>
                            </button>
                        </div>
                        <div className={cardShellClassName}>
                            {currentWindow.type ===
                            DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING &&
                            'region' in activeCard ? (
                                <DanceShortsCandidateCard
                                    candidate={activeCard}
                                    sortKey={windowRequest.sortKey}
                                    rank={rankForIndex(
                                        currentWindow,
                                        activeIndex,
                                    )}
                                    isActive
                                    thumbnailControls={thumbnailControls}
                                    contentTransitionClassName={
                                        cardFieldTransitionClassName
                                    }
                                    contentTransitionKey={
                                        cardFieldTransitionKey
                                    }
                                />
                            ) : currentWindow.type ===
                              DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RISING &&
                              'source_region' in activeCard ? (
                                <DanceShortsRisingCandidateCard
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
                                    observationNote={
                                        activeCard.observation_note
                                    }
                                    rank={rankForIndex(
                                        currentWindow,
                                        activeIndex,
                                    )}
                                    isActive
                                    thumbnailControls={thumbnailControls}
                                    contentTransitionClassName={
                                        cardFieldTransitionClassName
                                    }
                                    contentTransitionKey={
                                        cardFieldTransitionKey
                                    }
                                />
                            ) : (
                                <EmptyDisplayCardField message="表示できるカードはまだありません。" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
