/**
 * DanceShortsRadar のカードスワイプ/自動送り utility が、DOMなしで固定できる表示操作仕様を検証します。
 */
import { describe, expect, it } from 'vitest';

import {
    cardFieldTransitionClassNames,
    canStartAutoSlide,
    detectCardSwipe,
    selectOptionDirectionForVerticalSwipe,
} from './displayCardNavigation';

describe('displayCardNavigation', () => {
    it('does not start auto slide for empty or single-card windows', () => {
        expect(canStartAutoSlide(0)).toBe(false);
        expect(canStartAutoSlide(1)).toBe(false);
        expect(canStartAutoSlide(2)).toBe(true);
    });

    it('detects horizontal and vertical swipes while ignoring diagonal movement', () => {
        expect(detectCardSwipe(-70, 8)).toBe('left');
        expect(detectCardSwipe(70, 8)).toBe('right');
        expect(detectCardSwipe(8, -70)).toBe('up');
        expect(detectCardSwipe(8, 70)).toBe('down');
        expect(detectCardSwipe(45, 42)).toBeNull();
        expect(detectCardSwipe(20, 6)).toBeNull();
    });

    it('maps down swipe to the next/right option and up swipe to the previous/left option', () => {
        expect(selectOptionDirectionForVerticalSwipe('down')).toBe(1);
        expect(selectOptionDirectionForVerticalSwipe('up')).toBe(-1);
        expect(selectOptionDirectionForVerticalSwipe('left')).toBeNull();
        expect(selectOptionDirectionForVerticalSwipe('right')).toBeNull();
    });

    it('builds card field transition classes for manual and auto directions', () => {
        expect(
            cardFieldTransitionClassNames({
                direction: 1,
                mode: 'manual',
            }),
        ).toBe(
            'dance-shorts-card-transition dance-shorts-card-transition--manual dance-shorts-card-transition--right',
        );
        expect(
            cardFieldTransitionClassNames({
                direction: -1,
                mode: 'auto',
            }),
        ).toBe(
            'dance-shorts-card-transition dance-shorts-card-transition--auto dance-shorts-card-transition--left',
        );
        expect(cardFieldTransitionClassNames(null)).toBe('');
    });
});
