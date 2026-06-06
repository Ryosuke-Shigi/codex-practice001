export type CardSwipeDirection = 'left' | 'right' | 'up' | 'down';
export type CardFieldTransitionDirection = -1 | 1;
export type CardFieldTransitionMode = 'manual' | 'auto';
export type CardFieldTransition = {
    direction: CardFieldTransitionDirection;
    mode: CardFieldTransitionMode;
};

export const autoSlideIntervalMs = 1300;
export const cardSwipeDistanceThreshold = 40;
export const diagonalSwipeToleranceRatio = 1.25;

export function canStartAutoSlide(visibleCardCount: number) {
    return visibleCardCount > 1;
}

export function detectCardSwipe(deltaX: number, deltaY: number) {
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);

    if (
        absoluteX >= cardSwipeDistanceThreshold &&
        absoluteX >= absoluteY * diagonalSwipeToleranceRatio
    ) {
        return deltaX < 0 ? 'left' : 'right';
    }

    if (
        absoluteY >= cardSwipeDistanceThreshold &&
        absoluteY >= absoluteX * diagonalSwipeToleranceRatio
    ) {
        return deltaY < 0 ? 'up' : 'down';
    }

    return null;
}

export function selectOptionDirectionForVerticalSwipe(
    swipeDirection: CardSwipeDirection,
) {
    if (swipeDirection === 'down') {
        return 1;
    }

    if (swipeDirection === 'up') {
        return -1;
    }

    return null;
}

export function cardFieldTransitionClassNames(
    transition: CardFieldTransition | null,
) {
    if (transition === null) {
        return '';
    }

    const modeClassName =
        transition.mode === 'auto'
            ? 'dance-shorts-card-transition--auto'
            : 'dance-shorts-card-transition--manual';
    const directionClassName =
        transition.direction === 1
            ? 'dance-shorts-card-transition--right'
            : 'dance-shorts-card-transition--left';

    return [
        'dance-shorts-card-transition',
        modeClassName,
        directionClassName,
    ].join(' ');
}
