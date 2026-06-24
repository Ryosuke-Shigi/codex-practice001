/**
 * DanceShortsRadar 本体の表示カード window Component です。
 *
 * props の displayCardField を横スワイプ/自動送りで表示し、次 window の取得条件や ranking 種別判断は API / backend に渡します。
 */
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

import {
    cardFieldTransitionClassNames,
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
import type {
    DanceShortsDisplayCardField,
    DanceShortsDisplayCardWindowRequest,
} from '../types';
import DanceShortsActiveCardRenderer from './DanceShortsActiveCardRenderer';
import DanceShortsCardNavigationControls from './DanceShortsCardNavigationControls';
import EmptyDisplayCardField from './EmptyDisplayCardField';
import LoadingDisplayCardField from './LoadingDisplayCardField';
import useDanceShortsCardAutoSlide from './useDanceShortsCardAutoSlide';
import useDanceShortsCardWindow, {
    rankForDanceShortsCardWindowIndex,
} from './useDanceShortsCardWindow';

type DanceShortsDisplayCardFieldProps = {
    displayCardField: DanceShortsDisplayCardField;
    windowRequest: DanceShortsDisplayCardWindowRequest;
    selectGroups: DanceShortsDisplaySelectGroup[];
    activeSelectGroup: DanceShortsDisplaySelectGroupKey;
};

type CardFieldTransitionState = {
    direction: CardFieldTransitionDirection;
    mode: CardFieldTransitionMode;
    sequence: number;
};

/**
 * displayCardField は Laravel 側で確定した現在windowだけを受け取ります。
 * React 側では hook と子Componentを接続し、swipe / keyboard / select option の導線をまとめます。
 */
export default function DanceShortsDisplayCardField({
    displayCardField,
    windowRequest,
    selectGroups,
    activeSelectGroup,
}: DanceShortsDisplayCardFieldProps) {
    const cardTouchStartRef = useRef<{ x: number; y: number } | null>(null);
    const [cardFieldTransition, setCardFieldTransition] =
        useState<CardFieldTransitionState | null>(null);

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

    const {
        activeCard,
        activeIndex,
        canMoveNext,
        canMovePrev,
        currentWindow,
        isPrefetching,
        isWindowSwitching,
        moveToNext,
        moveToPrevious,
    } = useDanceShortsCardWindow({
        displayCardField,
        windowRequest,
        onCardMove: triggerCardFieldTransition,
    });

    const {
        autoSlideDirection,
        canStartCurrentAutoSlide,
        stopAutoSlide,
        toggleAutoSlide,
    } = useDanceShortsCardAutoSlide({
        visibleCardCount: currentWindow.visibleCards.length,
        canMoveNext,
        canMovePrev,
        moveToNext,
        moveToPrevious,
    });

    useEffect(() => {
        setCardFieldTransition(null);
        stopAutoSlide();
    }, [displayCardField, stopAutoSlide]);

    const currentSelectGroup = useMemo(
        () =>
            selectGroups.find((group) => group.key === activeSelectGroup) ??
            selectGroups[0] ??
            null,
        [activeSelectGroup, selectGroups],
    );

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

    const cardFieldTransitionClassName =
        cardFieldTransitionClassNames(cardFieldTransition);
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
                        <DanceShortsCardNavigationControls
                            canMovePrev={canMovePrev}
                            canMoveNext={canMoveNext}
                            isWindowSwitching={isWindowSwitching}
                            autoSlideDirection={autoSlideDirection}
                            canStartCurrentAutoSlide={
                                canStartCurrentAutoSlide
                            }
                            onPrevious={() => {
                                stopAutoSlide();
                                void moveToPrevious();
                            }}
                            onNext={() => {
                                stopAutoSlide();
                                void moveToNext();
                            }}
                            onToggleAutoSlide={toggleAutoSlide}
                        >
                            {(thumbnailControls) => (
                                <div className="w-full max-h-full min-h-0">
                                    <DanceShortsActiveCardRenderer
                                        currentWindow={currentWindow}
                                        activeCard={activeCard}
                                        sortKey={windowRequest.sortKey}
                                        rank={rankForDanceShortsCardWindowIndex(
                                            currentWindow,
                                            activeIndex,
                                        )}
                                        thumbnailControls={thumbnailControls}
                                        contentTransitionClassName={
                                            cardFieldTransitionClassName
                                        }
                                        contentTransitionKey={
                                            cardFieldTransitionKey
                                        }
                                    />
                                </div>
                            )}
                        </DanceShortsCardNavigationControls>
                    </div>
                )}
            </div>
        </section>
    );
}
