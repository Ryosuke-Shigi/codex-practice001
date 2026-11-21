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
    presentation?: 'adopted';
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
    presentation,
}: DanceShortsDisplayCardFieldProps) {
    const cardTouchStartRef = useRef<{ x: number; y: number; allowVerticalSwipe: boolean } | null>(null);
    const cardContentRef = useRef<HTMLDivElement>(null);
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
        // 新しい候補では順位・主指標から読み直せるよう、本文だけを先頭へ戻します。
        if (presentation === 'adopted' && cardContentRef.current !== null) {
            cardContentRef.current.scrollTop = 0;
        }
    }, [activeCard, presentation]);

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
        const target = event.target instanceof Element ? event.target : null;
        if (presentation === 'adopted' && target?.closest('.radar-card-navigation')) {
            cardTouchStartRef.current = null;
            return;
        }
        cardTouchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            // 公開本文は縦に読めるようにし、条件の縦swipeは動画面に残します。横swipeは本文全体で維持します。
            allowVerticalSwipe: presentation !== 'adopted' || Boolean(target?.closest('.radar-candidate__media')),
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

        if (swipeDirection === null || ((swipeDirection === 'up' || swipeDirection === 'down') && !start.allowVerticalSwipe)) {
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
            onTouchCancel={() => { cardTouchStartRef.current = null; }}
            className={`relative h-full min-h-0 overflow-hidden ${presentation === 'adopted' ? 'touch-pan-y' : 'touch-none'}`}
            aria-busy={isWindowSwitching || isPrefetching}
        >
            <div className="flex h-full min-h-0 items-start justify-center">
                {isWindowSwitching ? (
                    <LoadingDisplayCardField />
                ) : (
                    <div className={presentation === 'adopted' ? 'radar-card-window' : 'relative mx-auto max-h-full min-h-0 w-full max-w-md overflow-hidden landscape:max-w-sm sm:max-w-lg lg:max-w-xl lg:landscape:max-w-xl'}>
                        <DanceShortsCardNavigationControls
                            placement={presentation === 'adopted' ? 'footer' : undefined}
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
                                <div ref={cardContentRef} tabIndex={presentation === 'adopted' ? 0 : undefined} role={presentation === 'adopted' ? 'region' : undefined} aria-label={presentation === 'adopted' ? 'カードの情報と動画' : undefined} className={presentation === 'adopted' ? 'radar-card-content' : 'w-full max-h-full min-h-0'}>
                                    <DanceShortsActiveCardRenderer
                                        presentation={presentation}
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
