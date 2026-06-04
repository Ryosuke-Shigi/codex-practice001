import { router } from '@inertiajs/react';
import { useRef } from 'react';
import type { TouchEvent } from 'react';

import {
    activeSelectGroupIndex,
    isNavigableSelectOption,
    moveSelectGroup,
    type DanceShortsDisplaySelectGroup,
    type DanceShortsDisplaySelectGroupKey,
    type DanceShortsDisplaySelectOption,
} from '../displaySelectGroups';
import { DANCE_SHORTS_RADAR_RELOAD_OPTIONS } from '../inertiaReloadOptions';

const groupSwipeDistanceThreshold = 32;

function visitOption(option: DanceShortsDisplaySelectOption) {
    if (!isNavigableSelectOption(option)) {
        return;
    }

    router.get(option.href, {}, DANCE_SHORTS_RADAR_RELOAD_OPTIONS);
}

export default function DanceShortsDisplaySelectField({
    selectGroups,
    activeSelectGroup,
    onActiveSelectGroupChange,
}: {
    selectGroups: DanceShortsDisplaySelectGroup[];
    activeSelectGroup: DanceShortsDisplaySelectGroupKey;
    onActiveSelectGroupChange: (
        activeGroup: DanceShortsDisplaySelectGroupKey,
    ) => void;
}) {
    /*
     * SelectField は「どのジャンルを選ぶか」を左右/スライドで切り替え、
     * そのジャンル内のボタンで値を決める操作面です。
     * 上昇候補は固定順なので、並び順ジャンル自体を出しません。
     * 値ボタンは Responder が作った href を使い、React 側では ranking / sort / slice しません。
     */
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const activeIndex = activeSelectGroupIndex(
        selectGroups,
        activeSelectGroup,
    );
    const currentGroup = selectGroups[activeIndex];

    if (currentGroup === undefined) {
        return null;
    }

    const onMoveGroup = (direction: -1 | 1) => {
        onActiveSelectGroupChange(
            moveSelectGroup(selectGroups, activeSelectGroup, direction),
        );
    };

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
            Math.abs(deltaX) < groupSwipeDistanceThreshold ||
            Math.abs(deltaX) <= Math.abs(deltaY)
        ) {
            return;
        }

        onMoveGroup(deltaX < 0 ? 1 : -1);
    };

    return (
        <section
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="grid touch-pan-y gap-1 rounded-lg border border-white/18 bg-slate-950/38 p-1 text-white shadow-[0_10px_22px_rgba(4,25,42,0.12)] backdrop-blur-xl"
        >
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-1">
                <button
                    type="button"
                    aria-label="選択ジャンルを前へ"
                    onClick={() => onMoveGroup(-1)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-white/18 bg-white/8 text-sm font-black text-cyan-50 transition hover:bg-white/14 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                >
                    <span aria-hidden="true">&lt;</span>
                </button>
                <div className="min-w-0 rounded-md border border-cyan-100/22 bg-cyan-100/12 px-2 py-0.5 text-center text-xs font-bold text-white">
                    <span className="sm:hidden">
                        {currentGroup.shortLabel}
                    </span>
                    <span className="hidden sm:inline">
                        {currentGroup.label}
                    </span>
                </div>
                <button
                    type="button"
                    aria-label="選択ジャンルを次へ"
                    onClick={() => onMoveGroup(1)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-white/18 bg-white/8 text-sm font-black text-cyan-50 transition hover:bg-white/14 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                >
                    <span aria-hidden="true">&gt;</span>
                </button>
            </div>

            <div
                className="grid min-w-0 gap-1"
                style={{
                    gridTemplateColumns: `repeat(${currentGroup.options.length}, minmax(0, 1fr))`,
                }}
            >
                {currentGroup.options.map((option) => (
                    <button
                        key={`${currentGroup.key}-${option.value}`}
                        type="button"
                        aria-pressed={option.isActive}
                        onClick={() => visitOption(option)}
                        className={[
                            'min-h-7 min-w-0 truncate rounded-md border px-1 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35 sm:text-xs',
                            option.isActive
                                ? 'border-white bg-white text-slate-950 shadow-[0_8px_16px_rgba(255,255,255,0.16)]'
                                : 'border-white/16 bg-white/8 text-cyan-50/82 hover:bg-white/14',
                        ].join(' ')}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </section>
    );
}
