import { describe, expect, it } from 'vitest';

import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import { mapProjectionBounds } from '@/Components/JapanQuakeWaveMap/mapProjection';
import { quakeIntensityKeys } from '@/Components/JapanQuakeWaveMap/QuakeIntensitySwitchFilter';

import { pickVisiblePins } from './useVisibleEarthquakePins';

function pin(sourceEntryId: number, overrides: Partial<EarthquakeMapPin> = {}): EarthquakeMapPin {
    return {
        eventId: `event-${sourceEntryId}`, sourceEntryId, title: null,
        areaName: `地域${sourceEntryId}`, headline: null, rawCoordinate: null,
        latitude: '38', longitude: '142', depthMeter: 40000,
        magnitude: '4.5', maxIntensity: '4',
        occurredAt: '2026-10-01T01:00:00+09:00',
        reportedAt: `2026-10-01T02:${String(sourceEntryId).padStart(2, '0')}:00+09:00`,
        comment: null, ...overrides,
    };
}

describe('PRODUCT map candidate selection', () => {
    it.each([
        { latitude: null }, { longitude: null }, { latitude: '' }, { longitude: '   ' },
        { latitude: 'not-a-coordinate' }, { longitude: '142east' },
        { latitude: 'NaN' }, { longitude: 'Infinity' },
        { latitude: String(mapProjectionBounds.minLatitude - 0.001) },
        { latitude: String(mapProjectionBounds.maxLatitude + 0.001) },
        { longitude: String(mapProjectionBounds.minLongitude - 0.001) },
        { longitude: String(mapProjectionBounds.maxLongitude + 0.001) },
    ])('excludes an invalid higher-ranked candidate before applying the limit: %j', (invalid) => {
        const valid = [pin(2), pin(3), pin(4), pin(5), pin(6)];
        const result = pickVisiblePins([pin(1, { maxIntensity: '7', ...invalid }), ...valid], quakeIntensityKeys, 5);

        expect(result.map((candidate) => candidate.sourceEntryId)).toEqual([6, 5, 4, 3, 2]);
    });

    it('keeps coordinates exactly on the existing projection boundaries', () => {
        const { minLatitude, maxLatitude, minLongitude, maxLongitude } = mapProjectionBounds;
        const candidates = [
            pin(1, { latitude: String(minLatitude), longitude: String(minLongitude) }),
            pin(2, { latitude: String(maxLatitude), longitude: String(maxLongitude) }),
            pin(3, { latitude: ' 38.0 ', longitude: ' 142.0 ' }),
        ];

        expect(pickVisiblePins(candidates, quakeIntensityKeys, 10)).toHaveLength(3);
    });

    it('chooses a valid representative for every enabled intensity before filling the remaining places', () => {
        const candidates = [
            pin(1, { maxIntensity: '4', latitude: null, reportedAt: '2026-10-01T10:00:00+09:00' }),
            pin(2, { maxIntensity: '4' }), pin(3, { maxIntensity: '4' }),
            pin(4, { maxIntensity: '4' }), pin(5, { maxIntensity: '4' }),
            pin(6, { maxIntensity: '4' }), pin(7, { maxIntensity: '1' }),
            pin(8, { maxIntensity: '1', longitude: '', reportedAt: '2026-10-01T10:00:00+09:00' }),
        ];

        expect(pickVisiblePins(candidates, ['4', '1'], 5).map((candidate) => candidate.sourceEntryId))
            .toEqual([6, 5, 4, 3, 7]);
    });

    it('retains severity first, report time next, and occurrence time only when report time is missing', () => {
        const candidates = [
            pin(1, { maxIntensity: '3', reportedAt: '2099-01-01T00:00:00+09:00' }),
            pin(2, { reportedAt: '2026-10-01T03:00:00+09:00', occurredAt: '2026-10-01T09:00:00+09:00' }),
            pin(3, { reportedAt: '2026-10-01T04:00:00+09:00', occurredAt: '2026-10-01T00:00:00+09:00' }),
            pin(4, { reportedAt: null, occurredAt: '2026-10-01T05:00:00+09:00' }),
        ];

        expect(pickVisiblePins(candidates, quakeIntensityKeys, 10).map((candidate) => candidate.sourceEntryId))
            .toEqual([4, 3, 2, 1]);
        expect(candidates.map((candidate) => candidate.sourceEntryId)).toEqual([1, 2, 3, 4]);
    });

    it('returns an empty final set when every candidate is invalid', () => {
        expect(pickVisiblePins([pin(1, { latitude: null }), pin(2, { longitude: 'wrong' })], quakeIntensityKeys, 10))
            .toEqual([]);
    });
});
