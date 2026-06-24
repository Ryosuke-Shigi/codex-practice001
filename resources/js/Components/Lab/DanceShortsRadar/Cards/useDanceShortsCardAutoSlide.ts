import { useCallback, useEffect, useState } from 'react';

import {
    autoSlideIntervalMs,
    canStartAutoSlide,
    type CardFieldTransitionDirection,
    type CardFieldTransitionMode,
} from '../displayCardNavigation';

type UseDanceShortsCardAutoSlideOptions = {
    visibleCardCount: number;
    canMoveNext: boolean;
    canMovePrev: boolean;
    moveToNext: (transitionMode?: CardFieldTransitionMode) => Promise<void>;
    moveToPrevious: (
        transitionMode?: CardFieldTransitionMode,
    ) => Promise<void>;
};

export type DanceShortsCardAutoSlideDirection =
    CardFieldTransitionDirection;

export function shouldStopDanceShortsCardAutoSlide({
    direction,
    visibleCardCount,
    canMoveNext,
    canMovePrev,
}: {
    direction: DanceShortsCardAutoSlideDirection | null;
    visibleCardCount: number;
    canMoveNext: boolean;
    canMovePrev: boolean;
}) {
    if (direction === null) {
        return false;
    }

    if (!canStartAutoSlide(visibleCardCount)) {
        return true;
    }

    return (direction === 1 && !canMoveNext) || (direction === -1 && !canMovePrev);
}

/**
 * DanceShortsRadar 表示カードの自動送り状態と interval 制御だけを扱います。
 *
 * 実際の window 移動は外から受け取った move 関数へ委譲し、fetch/cache には依存しません。
 */
export default function useDanceShortsCardAutoSlide({
    visibleCardCount,
    canMoveNext,
    canMovePrev,
    moveToNext,
    moveToPrevious,
}: UseDanceShortsCardAutoSlideOptions) {
    const [autoSlideDirection, setAutoSlideDirection] =
        useState<DanceShortsCardAutoSlideDirection | null>(null);
    const canStartCurrentAutoSlide = canStartAutoSlide(visibleCardCount);

    const stopAutoSlide = useCallback(() => {
        setAutoSlideDirection(null);
    }, []);

    const toggleAutoSlide = useCallback(
        (direction: DanceShortsCardAutoSlideDirection) => {
            if (!canStartCurrentAutoSlide) {
                return;
            }

            setAutoSlideDirection((current) =>
                current === direction ? null : direction,
            );
        },
        [canStartCurrentAutoSlide],
    );

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

    useEffect(() => {
        if (
            shouldStopDanceShortsCardAutoSlide({
                direction: autoSlideDirection,
                visibleCardCount,
                canMoveNext,
                canMovePrev,
            })
        ) {
            stopAutoSlide();
            return;
        }

        if (autoSlideDirection === null) {
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
        moveToNext,
        moveToPrevious,
        stopAutoSlide,
        visibleCardCount,
    ]);

    return {
        autoSlideDirection,
        canStartCurrentAutoSlide,
        stopAutoSlide,
        toggleAutoSlide,
    };
}
