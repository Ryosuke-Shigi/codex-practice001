import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

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
type SlideDirection = 'previous' | 'next';

const swipeDistanceThreshold = 48;
const slideAnimationLockMs = 280;

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
function shouldPrefetchNextWindow(field: DanceShortsDisplayCardField, activeIndex: number) {
    return (
        field.pagination.hasNext &&
        field.pagination.nextStartRank !== null &&
        activeIndex >= 2
    );
}

/*
 * 順位バッジは window 内 index ではなくランキング全体の順位を表示します。
 * startRank は Laravel 側で正規化済みなので、React 側では足し算だけに留めます。
 */
function activeRankFor(field: DanceShortsDisplayCardField, activeIndex: number) {
    if (field.visibleCards.length === 0) {
        return null;
    }

    return field.pagination.startRank + activeIndex;
}

/*
 * displayCardField は Laravel 側で確定した現在windowだけを受け取ります。
 * React 側では受け取ったwindowをcacheし、前後移動、先読み、Loading表示、カード本体の
 * スライドだけを扱います。ranking / rising の判定やsortはここでは行いません。
 */
export default function DanceShortsDisplayCardField({
    displayCardField,
    windowRequest,
}: DanceShortsDisplayCardFieldProps) {
    const initialWindowKey = useMemo(
        () => cacheKeyFor(displayCardField),
        [displayCardField],
    );
    /*
     * windowCache は正規化済み startRank を key にします。
     * これにより「1-5」「6-10」のような表示単位をそのまま cache 単位にでき、
     * 戻る操作では API を再実行せず即座に前 window を表示できます。
     */
    const [windowCache, setWindowCache] = useState<WindowCache>({
        [displayCardField.pagination.startRank]: displayCardField,
    });
    /*
     * keydown / fetch の callback は React state の更新タイミングに左右されやすいため、
     * windowCacheRef で最新 cache を参照します。inflightWindowsRef は同じ window への
     * prefetch と手動移動が重なったとき、二重 request を出さず同じ Promise を共有するためのものです。
     */
    const windowCacheRef = useRef(windowCache);
    const inflightWindowsRef = useRef<
        Map<number, Promise<DanceShortsDisplayCardField | null>>
    >(new Map());
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const animationTimeoutRef = useRef<number | null>(null);
    const [activeStartRank, setActiveStartRank] = useState(
        displayCardField.pagination.startRank,
    );
    const [activeIndex, setActiveIndex] = useState(displayCardField.activeIndex);
    const [slideDirection, setSlideDirection] = useState<SlideDirection>('next');
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [isWindowSwitching, setIsWindowSwitching] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        /*
         * state と ref を同期して、moveToNext / moveToPrevious / loadWindow が
         * 古い closure の cache を見ないようにします。
         */
        windowCacheRef.current = windowCache;
    }, [windowCache]);

    const startSlideAnimationLock = useCallback(() => {
        /*
         * AnimatePresence は前カードの exit と新カードの enter を同時に走らせます。
         * アニメーション中に逆方向の入力を受けるとカードが左右へ連続で割り込むため、
         * 実際の transition duration より少し長めに入力を抑制します。
         */
        if (animationTimeoutRef.current !== null) {
            window.clearTimeout(animationTimeoutRef.current);
        }

        setIsAnimating(true);
        animationTimeoutRef.current = window.setTimeout(() => {
            setIsAnimating(false);
            animationTimeoutRef.current = null;
        }, slideAnimationLockMs);
    }, []);

    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current !== null) {
                window.clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

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
        setSlideDirection('next');
        setIsPrefetching(false);
        setIsWindowSwitching(false);
        setIsAnimating(false);

        if (animationTimeoutRef.current !== null) {
            window.clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = null;
        }
    }, [displayCardField, initialWindowKey]);

    const currentWindow = windowCache[activeStartRank] ?? displayCardField;
    const currentActiveRank = activeRankFor(currentWindow, activeIndex);
    const canMovePrev =
        activeIndex > 0 || currentWindow.pagination.hasPrev;
    const canMoveNext =
        activeIndex < currentWindow.visibleCards.length - 1 ||
        currentWindow.pagination.hasNext;

    const loadWindow = useCallback(
        async (startRank: number, mode: 'prefetch' | 'switch') => {
            /*
             * 追加 API は初期 props と同じ displayCardField shape を返します。
             * React 側は API response を特別扱いせず cache に追加するだけなので、
             * 初期表示、先読み、window 境界の手動移動で同じ描画経路を使えます。
             */
            const cachedWindow = windowCacheRef.current[startRank];

            if (cachedWindow !== undefined) {
                return cachedWindow;
            }

            const inflightWindow = inflightWindowsRef.current.get(startRank);

            if (inflightWindow !== undefined) {
                return inflightWindow;
            }

            const requestWindow = (async () => {
                /*
                 * switch 中だけ全体 Loading を出し、prefetch 中は裏側で静かに取得します。
                 * 失敗時は null を返して現在カードに留まるため、カード移動 UI 自体は壊れません。
                 */
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
        /*
         * 先読みは「今の window の後ろ」にだけ行います。
         * 前 window は一度通過したものが cache されていることが多く、次方向の体感速度を優先します。
         */
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
        if (!canMoveNext || isWindowSwitching || isAnimating) {
            return;
        }

        setSlideDirection('next');

        if (activeIndex < currentWindow.visibleCards.length - 1) {
            /*
             * 同じ window 内の移動は index だけを進めます。
             * startRank は変えないため、順位バッジは activeRankFor() の足し算で自然に更新されます。
             */
            startSlideAnimationLock();
            setActiveIndex((current) => current + 1);
            return;
        }

        const nextStartRank = currentWindow.pagination.nextStartRank;

        if (nextStartRank === null) {
            return;
        }

        const cachedWindow = windowCacheRef.current[nextStartRank];

        if (cachedWindow !== undefined) {
            /*
             * 先読み済み window がある場合は Loading を挟まず即切り替えます。
             * next window の activeIndex は Laravel が返した初期位置を使い、通常は0枚目です。
             */
            startSlideAnimationLock();
            setActiveStartRank(nextStartRank);
            setActiveIndex(cachedWindow.activeIndex);
            return;
        }

        setIsWindowSwitching(true);
        const loadedWindow = await loadWindow(nextStartRank, 'switch');

        if (loadedWindow !== null) {
            /*
             * 先読みが間に合っていない場合だけ switch mode で取得します。
             * 取得に失敗したときは activeStartRank / activeIndex を変えず、現在カードに留まります。
             */
            startSlideAnimationLock();
            setActiveStartRank(nextStartRank);
            setActiveIndex(loadedWindow.activeIndex);
        }

        setIsWindowSwitching(false);
    }, [
        activeIndex,
        canMoveNext,
        currentWindow,
        isAnimating,
        isWindowSwitching,
        loadWindow,
        startSlideAnimationLock,
    ]);

    const moveToPrevious = useCallback(async () => {
        if (!canMovePrev || isWindowSwitching || isAnimating) {
            return;
        }

        setSlideDirection('previous');

        if (activeIndex > 0) {
            /*
             * 同じ window 内で戻るときも、API には触らず index だけを戻します。
             * これにより右矢印で進んだ直後の左矢印でも、同じ window 内なら軽く戻れます。
             */
            startSlideAnimationLock();
            setActiveIndex((current) => current - 1);
            return;
        }

        const prevStartRank = currentWindow.pagination.prevStartRank;

        if (prevStartRank === null) {
            return;
        }

        const cachedWindow = windowCacheRef.current[prevStartRank];

        if (cachedWindow !== undefined) {
            /*
             * 前 window へ戻るときは、その window の最後のカードを表示します。
             * 1-5 から 6-10 へ進んだ後に戻る場合、5位へ戻るのが自然な操作になるためです。
             */
            startSlideAnimationLock();
            setActiveStartRank(prevStartRank);
            setActiveIndex(Math.max(0, cachedWindow.visibleCards.length - 1));
            return;
        }

        setIsWindowSwitching(true);
        const loadedWindow = await loadWindow(prevStartRank, 'switch');

        if (loadedWindow !== null) {
            startSlideAnimationLock();
            setActiveStartRank(prevStartRank);
            setActiveIndex(Math.max(0, loadedWindow.visibleCards.length - 1));
        }

        setIsWindowSwitching(false);
    }, [
        activeIndex,
        canMovePrev,
        currentWindow,
        isAnimating,
        isWindowSwitching,
        loadWindow,
        startSlideAnimationLock,
    ]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName;

            /*
             * グローバルな左右キー移動は PC 操作用です。
             * 入力欄や contenteditable にフォーカスしているときは、文字編集のカーソル移動を
             * 奪わないようカード移動を無効にします。
             */
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) {
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

    const onTouchStart = (event: TouchEvent<HTMLElement>) => {
        const touch = event.touches[0];

        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
        };
    };

    const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
        const start = touchStartRef.current;

        touchStartRef.current = null;

        if (start === null) {
            return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;

        if (
            Math.abs(deltaX) < swipeDistanceThreshold ||
            Math.abs(deltaX) <= Math.abs(deltaY)
        ) {
            return;
        }

        if (deltaX < 0) {
            void moveToNext();
            return;
        }

        void moveToPrevious();
    };

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

    return (
        <section
            id="dance-shorts-card-field"
            className="relative min-h-[30rem]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-busy={isWindowSwitching || isPrefetching || isAnimating}
        >
            <button
                type="button"
                onClick={() => void moveToPrevious()}
                disabled={!canMovePrev || isWindowSwitching || isAnimating}
                aria-label="前のカードへ移動"
                className="absolute left-1 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/32 bg-slate-950/54 text-2xl font-bold text-white shadow-[0_16px_30px_rgba(2,24,45,0.24)] backdrop-blur-xl transition hover:bg-slate-900/72 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-35 sm:left-3 sm:h-12 sm:w-12"
            >
                <span aria-hidden="true">&lt;</span>
            </button>

            <button
                type="button"
                onClick={() => void moveToNext()}
                disabled={!canMoveNext || isWindowSwitching || isAnimating}
                aria-label="次のカードへ移動"
                className="absolute right-1 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/32 bg-slate-950/54 text-2xl font-bold text-white shadow-[0_16px_30px_rgba(2,24,45,0.24)] backdrop-blur-xl transition hover:bg-slate-900/72 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 disabled:cursor-not-allowed disabled:opacity-35 sm:right-3 sm:h-12 sm:w-12"
            >
                <span aria-hidden="true">&gt;</span>
            </button>

            <div className="px-0 sm:px-8">
                <div className="relative">
                    {currentActiveRank !== null && !isWindowSwitching && (
                        /*
                         * 順位バッジは section 全体ではなくカード本体の wrapper を基準に置きます。
                         * 外側には左右矢印や responsive padding があるため、section 基準にすると
                         * ウィンドウ幅変更時にカード角からズレて見えます。
                         */
                        <div className="absolute -left-3 -top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/45 bg-cyan-200/70 text-lg font-black tabular-nums text-slate-950 shadow-[0_12px_18px_rgba(6,182,212,0.2)] sm:-left-3.5 sm:-top-3.5 sm:h-11 sm:w-11 sm:text-xl">
                            {currentActiveRank}
                        </div>
                    )}

                    <div className="overflow-hidden">
                        {isWindowSwitching ? (
                            <LoadingDisplayCardField />
                        ) : (
                            <div className="grid">
                                <AnimatePresence initial={false}>
                                    <motion.div
                                        key={`${activeStartRank}-${activeIndex}-${currentActiveRank}`}
                                        className="col-start-1 row-start-1 min-w-0"
                                        initial={{
                                            opacity: 0,
                                            x:
                                                slideDirection === 'next'
                                                    ? 84
                                                    : -84,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            x:
                                                slideDirection === 'next'
                                                    ? -84
                                                    : 84,
                                        }}
                                        transition={{
                                            duration: 0.24,
                                            ease: 'easeOut',
                                        }}
                                    >
                                        {currentWindow.type ===
                                        DANCE_SHORTS_DISPLAY_CARD_FIELD_TYPES.RANKING ? (
                                            <DanceShortsCandidateCard
                                                candidate={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ]
                                                }
                                            />
                                        ) : (
                                            <DanceShortsRisingCandidateCard
                                                title={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].title
                                                }
                                                sourceRegion={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].source_region
                                                }
                                                sourceRegionLabel={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].source_region_label
                                                }
                                                japanStatus={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].japan_status
                                                }
                                                viewCountDelta={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].view_count_delta
                                                }
                                                viewGrowthRate={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].view_growth_rate
                                                }
                                                japanViewCountDelta={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].japan_view_count_delta ??
                                                    null
                                                }
                                                thumbnailUrl={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].thumbnail_url
                                                }
                                                youtubeUrl={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].youtube_url
                                                }
                                                tags={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].tags
                                                }
                                                observationNote={
                                                    currentWindow.visibleCards[
                                                        activeIndex
                                                    ].observation_note
                                                }
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
