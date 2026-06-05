import { describe, expect, it } from 'vitest';

import {
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
});
