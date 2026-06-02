import { describe, expect, it } from 'vitest';

import {
    DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS,
    DANCE_SHORTS_RADAR_RELOAD_OPTIONS,
} from './inertiaReloadOptions';

describe('DanceShortsRadar Inertia reload options', () => {
    it('preserves page state and reloads only query-dependent display props', () => {
        expect(DANCE_SHORTS_RADAR_RELOAD_OPTIONS.preserveScroll).toBe(true);
        expect(DANCE_SHORTS_RADAR_RELOAD_OPTIONS.preserveState).toBe(true);
        expect(DANCE_SHORTS_RADAR_RELOAD_OPTIONS.only).toBe(
            DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS,
        );

        expect(DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS).toEqual([
            'filters',
            'regionTabs',
            'displayCardField',
            'comparisonDayOptions',
            'sortKeyOptions',
        ]);
        expect(DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS).not.toContain(
            'allCandidates',
        );
        expect(DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS).not.toContain(
            'candidatesByRegion',
        );
        expect(DANCE_SHORTS_RADAR_RELOAD_ONLY_PROPS).not.toContain(
            'risingCandidates',
        );
    });
});
