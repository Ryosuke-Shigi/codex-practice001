/**
 * DanceShortsRadar 表示カードの自動送り停止条件を固定します。
 */
import { describe, expect, it } from 'vitest';

import { shouldStopDanceShortsCardAutoSlide } from './useDanceShortsCardAutoSlide';

describe('useDanceShortsCardAutoSlide helpers', () => {
    it('keeps stopped state stable when auto slide has not started', () => {
        expect(
            shouldStopDanceShortsCardAutoSlide({
                direction: null,
                visibleCardCount: 5,
                canMoveNext: true,
                canMovePrev: true,
            }),
        ).toBe(false);
    });

    it('stops auto slide for empty or single-card windows', () => {
        expect(
            shouldStopDanceShortsCardAutoSlide({
                direction: 1,
                visibleCardCount: 1,
                canMoveNext: true,
                canMovePrev: true,
            }),
        ).toBe(true);
    });

    it('stops at the edge for the active auto slide direction only', () => {
        expect(
            shouldStopDanceShortsCardAutoSlide({
                direction: 1,
                visibleCardCount: 5,
                canMoveNext: false,
                canMovePrev: true,
            }),
        ).toBe(true);
        expect(
            shouldStopDanceShortsCardAutoSlide({
                direction: -1,
                visibleCardCount: 5,
                canMoveNext: false,
                canMovePrev: true,
            }),
        ).toBe(false);
        expect(
            shouldStopDanceShortsCardAutoSlide({
                direction: -1,
                visibleCardCount: 5,
                canMoveNext: true,
                canMovePrev: false,
            }),
        ).toBe(true);
    });
});
