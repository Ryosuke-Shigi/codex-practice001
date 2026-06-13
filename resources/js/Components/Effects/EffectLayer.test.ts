/**
 * 背景演出 layer が jQuery ripples の外部依存を安全に初期化・破棄する境界を固定します。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('jquery', () => ({
    default: () => ({
        ripples: vi.fn(),
    }),
}));

vi.mock('jquery.ripples', () => ({}));

import {
    defaultEffectName,
    effectNames,
    effectPatterns,
    isEffectName,
    readPreferredEffectName,
    resolveEffectName,
    storePreferredEffectName,
} from './EffectLayer';

const effectPreferenceStorageKey = 'portfolio.backgroundEffect';

function stubSessionStorage(initialValue: string | null = null) {
    const values: Record<string, string> = {};

    if (initialValue !== null) {
        values[effectPreferenceStorageKey] = initialValue;
    }

    const sessionStorage = {
        getItem: vi.fn((key: string) => values[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            values[key] = value;
        }),
    };

    vi.stubGlobal('window', {
        sessionStorage,
    });

    return sessionStorage;
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('EffectLayer effect definitions', () => {
    it('exposes the five selectable background effects only', () => {
        expect(effectNames).toEqual([
            'water',
            'caustics',
            'cursorRipple',
            'aquaParticles',
            'surfaceShimmer',
        ]);
        expect(effectPatterns.map((pattern) => pattern.key)).toEqual(effectNames);
        expect(effectNames).not.toContain('none');
        expect(effectNames).not.toContain('floatingLight');
    });

    it('uses water as the default and fallback effect', () => {
        expect(defaultEffectName).toBe('water');
        expect(resolveEffectName(undefined)).toBe('water');
        expect(resolveEffectName('none')).toBe('water');
        expect(resolveEffectName('floatingLight')).toBe('water');
        expect(resolveEffectName('unknown')).toBe('water');
        expect(isEffectName('water')).toBe(true);
        expect(isEffectName('none')).toBe(false);
    });

    it('falls back to water when old sessionStorage values remain', () => {
        stubSessionStorage('none');

        expect(readPreferredEffectName()).toBe('water');

        stubSessionStorage('floatingLight');

        expect(readPreferredEffectName()).toBe('water');
    });

    it('reads and stores a valid preferred effect', () => {
        const sessionStorage = stubSessionStorage('aquaParticles');

        expect(readPreferredEffectName()).toBe('aquaParticles');

        storePreferredEffectName('caustics');

        expect(sessionStorage.setItem).toHaveBeenCalledWith(
            effectPreferenceStorageKey,
            'caustics',
        );
    });
});
