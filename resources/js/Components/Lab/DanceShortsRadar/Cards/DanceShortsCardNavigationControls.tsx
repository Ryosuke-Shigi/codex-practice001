import type { MouseEvent, PointerEvent, ReactNode, TouchEvent } from 'react';

import type { CardFieldTransitionDirection } from '../displayCardNavigation';

type DanceShortsCardThumbnailControls = {
    topRight: ReactNode;
    bottomLeft: ReactNode;
};

type DanceShortsCardNavigationControlsProps = {
    canMovePrev: boolean;
    canMoveNext: boolean;
    isWindowSwitching: boolean;
    autoSlideDirection: CardFieldTransitionDirection | null;
    canStartCurrentAutoSlide: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onToggleAutoSlide: (direction: CardFieldTransitionDirection) => void;
    children: (controls: DanceShortsCardThumbnailControls) => ReactNode;
};

function stopAutoSlideButtonPropagation(
    event: PointerEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>,
) {
    event.stopPropagation();
}

function autoSlideButtonClassName(
    direction: CardFieldTransitionDirection,
    autoSlideDirection: CardFieldTransitionDirection | null,
) {
    return [
        'grid h-7 min-w-11 place-items-center rounded-full border px-2 text-xs font-black text-white shadow-[0_10px_20px_rgba(14,116,144,0.18)] backdrop-blur-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100/50 disabled:cursor-not-allowed disabled:opacity-35',
        autoSlideDirection === direction
            ? 'border-white/70 bg-pink-500/75'
            : 'border-white/50 bg-sky-500/65 hover:bg-pink-500/70',
    ].join(' ');
}

/**
 * DanceShortsRadar 表示カードの操作ボタンだけを描画します。
 *
 * window取得やcache更新は持たず、クリック結果を親へ通知する表示Componentです。
 */
export default function DanceShortsCardNavigationControls({
    canMovePrev,
    canMoveNext,
    isWindowSwitching,
    autoSlideDirection,
    canStartCurrentAutoSlide,
    onPrevious,
    onNext,
    onToggleAutoSlide,
    children,
}: DanceShortsCardNavigationControlsProps) {
    const onAutoSlideButtonClick = (
        event: MouseEvent<HTMLButtonElement>,
        direction: CardFieldTransitionDirection,
    ) => {
        event.preventDefault();
        event.stopPropagation();
        onToggleAutoSlide(direction);
    };
    const thumbnailControls = {
        topRight: (
            <button
                type="button"
                aria-label="自動右送りを切り替え"
                aria-pressed={autoSlideDirection === 1}
                disabled={!canStartCurrentAutoSlide}
                onPointerDown={stopAutoSlideButtonPropagation}
                onTouchStart={stopAutoSlideButtonPropagation}
                onClick={(event) => onAutoSlideButtonClick(event, 1)}
                className={autoSlideButtonClassName(1, autoSlideDirection)}
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
                onPointerDown={stopAutoSlideButtonPropagation}
                onTouchStart={stopAutoSlideButtonPropagation}
                onClick={(event) => onAutoSlideButtonClick(event, -1)}
                className={autoSlideButtonClassName(-1, autoSlideDirection)}
            >
                <span aria-hidden="true">&lt;&lt;</span>
            </button>
        ),
    };

    return (
        <>
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 flex items-center justify-between px-1.5 sm:px-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={!canMovePrev || isWindowSwitching}
                    aria-label="前のカードへ移動"
                    className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-sky-500/70 text-xl font-bold text-white shadow-[0_14px_26px_rgba(14,116,144,0.22)] backdrop-blur-xl transition hover:bg-pink-500/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100/50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                    <span aria-hidden="true">&lt;</span>
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canMoveNext || isWindowSwitching}
                    aria-label="次のカードへ移動"
                    className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-sky-500/70 text-xl font-bold text-white shadow-[0_14px_26px_rgba(14,116,144,0.22)] backdrop-blur-xl transition hover:bg-pink-500/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100/50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                    <span aria-hidden="true">&gt;</span>
                </button>
            </div>
            {children(thumbnailControls)}
        </>
    );
}
