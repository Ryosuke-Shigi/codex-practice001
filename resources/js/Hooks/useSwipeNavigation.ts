import { useEffect } from 'react';

type SwipeNavigationOptions = {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    minDistance?: number;
    dominanceRatio?: number;
    edgeIgnoreWidth?: number;
    disabled?: boolean;
};

type SwipeStart = {
    x: number;
    y: number;
};

const DEFAULT_MIN_DISTANCE = 64;
const DEFAULT_DOMINANCE_RATIO = 1.35;
const DEFAULT_EDGE_IGNORE_WIDTH = 24;

function shouldIgnoreSwipeTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]') !== null;
}

/**
 * ページ全体の左右スワイプを検出して、呼び出し元のページ移動処理へ通知する共通Hookです。
 *
 * button / link / form 操作や画面端のOSジェスチャーを除外し、Hook自身はURL遷移や
 * Inertia操作を実行しません。Page側が onSwipeLeft / onSwipeRight で用途を決めます。
 */
export default function useSwipeNavigation({
    onSwipeLeft,
    onSwipeRight,
    minDistance = DEFAULT_MIN_DISTANCE,
    dominanceRatio = DEFAULT_DOMINANCE_RATIO,
    edgeIgnoreWidth = DEFAULT_EDGE_IGNORE_WIDTH,
    disabled = false,
}: SwipeNavigationOptions) {
    useEffect(() => {
        if (disabled || (onSwipeLeft === undefined && onSwipeRight === undefined)) {
            return;
        }

        let start: SwipeStart | null = null;

        const resetSwipe = () => {
            start = null;
        };

        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1 || shouldIgnoreSwipeTarget(event.target)) {
                resetSwipe();
                return;
            }

            const touch = event.touches[0];
            const viewportWidth = window.innerWidth;

            if (touch.clientX <= edgeIgnoreWidth || touch.clientX >= viewportWidth - edgeIgnoreWidth) {
                resetSwipe();
                return;
            }

            start = {
                x: touch.clientX,
                y: touch.clientY,
            };
        };

        const handleTouchEnd = (event: TouchEvent) => {
            if (start === null || event.changedTouches.length === 0) {
                resetSwipe();
                return;
            }

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - start.x;
            const deltaY = touch.clientY - start.y;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            resetSwipe();

            if (absX < minDistance || absX < absY * dominanceRatio) {
                return;
            }

            if (deltaX < 0) {
                onSwipeLeft?.();
                return;
            }

            onSwipeRight?.();
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', resetSwipe, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', resetSwipe);
        };
    }, [disabled, dominanceRatio, edgeIgnoreWidth, minDistance, onSwipeLeft, onSwipeRight]);
}
