import { describe, expect, it } from 'vitest';

import {
    canStartAutoSlide,
    detectCardSwipe,
    nextAutoSlideIndex,
    previousAutoSlideIndex,
    selectOptionDirectionForVerticalSwipe,
} from './displayCardNavigation';

describe('displayCardNavigation', () => {
    it('loops auto slide indices inside the current window only', () => {
        expect(nextAutoSlideIndex(4, 5)).toBe(0);
        expect(previousAutoSlideIndex(0, 5)).toBe(4);
        expect(nextAutoSlideIndex(2, 5)).toBe(3);
        expect(previousAutoSlideIndex(2, 5)).toBe(1);
    });

    it('does not start auto slide for empty or single-card windows', () => {
        expect(canStartAutoSlide(0)).toBe(false);
        expect(canStartAutoSlide(1)).toBe(false);
        expect(canStartAutoSlide(2)).toBe(true);
        expect(nextAutoSlideIndex(0, 1)).toBe(0);
        expect(previousAutoSlideIndex(0, 1)).toBe(0);
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
});
