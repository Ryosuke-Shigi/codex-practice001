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
    /*
     * 1枚だけの window では自動送りを始めません。
     * ボタンや interval の有効状態を同じ条件にそろえ、Component 側で件数判定を重複させないための helper です。
     */
    return visibleCardCount > 1;
}

export function detectCardSwipe(deltaX: number, deltaY: number) {
    /*
     * 斜め swipe は誤操作になりやすいため、主方向が副方向の一定倍率を超えた場合だけ採用します。
     * 横移動はカード送り、縦移動は selector 操作用に分け、Component は方向名だけを受け取ります。
     */
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
    /*
     * 縦 swipe は select option の前後移動として使います。
     * 横 swipe はカード送り側の責務なので、ここでは null にして呼び出し側へ判断を戻します。
     */
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
    /*
     * transition の意味は TypeScript state に閉じ、CSS class はここでだけ組み立てます。
     * manual / auto と左右方向を class に分けることで、CSS 側はアニメーション定義だけを担当できます。
     */
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
