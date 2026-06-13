/**
 * DanceShortsRadar 表示カードのスワイプ/自動送り utility です。
 *
 * DOMに依存しない表示操作だけを扱い、ランキング順や取得 window の意味判断は backend / Page 側へ残します。
 */
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

/**
 * カードwindow内で自動送りを開始できるかを判定します。
 *
 * 件数判定をComponentから切り出し、ボタンのdisabledとinterval開始条件を同じUI契約にそろえます。
 */
export function canStartAutoSlide(visibleCardCount: number) {
    /*
     * 1枚だけの window では自動送りを始めません。
     * ボタンや interval の有効状態を同じ条件にそろえ、Component 側で件数判定を重複させないための helper です。
     */
    return visibleCardCount > 1;
}

/**
 * カード領域のtouch移動量から、カード送りまたはselect操作に使うswipe方向を返します。
 *
 * ここでは方向検出だけを担当し、実際のURL遷移やwindow取得は呼び出し元Componentへ残します。
 */
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

/**
 * 縦swipeをselect optionの前後移動へ変換します。
 *
 * 横swipeはカード送りの責務なので null を返し、呼び出し側がカード移動として扱えるようにします。
 */
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

/**
 * カード切替アニメーション用のCSS classを組み立てます。
 *
 * transition stateの意味をTypeScript側に閉じ、CSSはmanual / auto と方向別の見た目だけを担当します。
 */
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
