// @vitest-environment jsdom

import { act, type HTMLAttributes } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, initial: _initial, animate: _animate, transition: _transition, ...props }: HTMLAttributes<HTMLDivElement> & {
            initial?: unknown; animate?: unknown; transition?: unknown;
        }) => <div {...props}>{children}</div>,
    },
}));

// Static map decoration is independent of the selection/detail state exercised here.
vi.mock('@/Components/JapanQuakeWaveMap/PlateBoundaryLayer', () => ({
    default: () => null,
}));

import JapanQuakeWaveMap, { type EarthquakeMapPin } from './JapanQuakeWaveMap';

function pin(sourceEntryId: number, overrides: Partial<EarthquakeMapPin> = {}): EarthquakeMapPin {
    return {
        eventId: `event-${sourceEntryId}`, sourceEntryId, title: null,
        areaName: `地域${sourceEntryId}`, headline: null, rawCoordinate: null,
        latitude: '38', longitude: '142', depthMeter: 40000,
        magnitude: '4.5', maxIntensity: '4', occurredAt: '2040-12-31T12:34:56+09:00',
        reportedAt: '2099-01-01T01:00:00+09:00', comment: null, ...overrides,
    };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

function render(pins: EarthquakeMapPin[], { product = true, defaultOpen = false } = {}) {
    act(() => root.render(
        <JapanQuakeWaveMap
            pins={pins}
            variant={product ? 'product' : 'default'}
            showIntroduction={false}
            detailPanelPlacement="below"
            detailPanelCollapsible
            detailPanelDefaultOpen={defaultOpen}
        />,
    ));
}

function button(text: string) {
    const target = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === text);
    if (!target) throw new Error(`button not found: ${text}`);
    return target;
}

function marker(area: string) {
    const target = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'))
        .find((candidate) => candidate.getAttribute('aria-label')?.startsWith(`${area} `));
    if (!target) throw new Error(`map pin not found: ${area}`);
    return target;
}

function selectedDetail() {
    const target = container.querySelector('aside');
    if (!target) throw new Error('selected detail not found');
    return target;
}

function toggleLayer(label: string) {
    if (!container.querySelector('input[type="checkbox"]')) act(() => button('開く').click());
    const target = Array.from(container.querySelectorAll('label'))
        .find((candidate) => candidate.textContent?.trim() === label)?.querySelector<HTMLInputElement>('input');
    if (!target) throw new Error(`layer not found: ${label}`);
    act(() => target.click());
}

describe('explicit PRODUCT map interaction', () => {
    it('shows center intensities on all pins and the lower numbered label only on the selected pin', () => {
        render([pin(1), pin(2, { maxIntensity: '3' })]);

        expect(marker('地域1').textContent).toContain('#1');
        expect(marker('地域2').textContent?.trim()).toBe('3');
        expect(marker('地域1').getAttribute('aria-pressed')).toBe('true');

        act(() => marker('地域2').click());

        expect(marker('地域1').textContent?.trim()).toBe('4');
        expect(marker('地域2').textContent).toContain('#2');
        expect(marker('地域2').getAttribute('aria-pressed')).toBe('true');
    });

    it('keeps the semantic pin buttons and focused element when intensity text is hidden', () => {
        render([pin(1), pin(2)]);
        toggleLayer('震度表示');
        const target = marker('地域2');
        target.focus();

        expect(document.activeElement).toBe(target);
        expect(target.type).toBe('button');
        expect(target.textContent?.trim()).toBe('');
        expect(marker('地域1').textContent?.trim()).toBe('');
        act(() => target.click());
        expect(marker('地域2')).toBe(target);
        expect(target.getAttribute('aria-pressed')).toBe('true');
    });

    it('shows area, maximum intensity and occurrence date while closed, without substituting the report date', () => {
        render([pin(1, { areaName: '北海道東方沖（根室半島南東沖）' })]);

        expect(button('詳細を開く').getAttribute('aria-expanded')).toBe('false');
        expect(selectedDetail().textContent).toContain('北海道東方沖（根室半島南東沖）');
        expect(selectedDetail().textContent).toContain('最大震度');
        expect(selectedDetail().textContent).toContain('発生日時');
        expect(selectedDetail().textContent).toContain('2040');
        expect(selectedDetail().textContent).not.toContain('2099');
        expect(selectedDetail().querySelector('dl')).toBeNull();
    });

    it('does not use report time when the occurrence date is missing', () => {
        render([pin(1, { occurredAt: null })]);

        expect(selectedDetail().textContent).toContain('発生日時');
        expect(selectedDetail().textContent).not.toContain('2099');
    });

    it.each([true, false])('preserves the user-chosen open=%s through manual and automatic selection changes', (open) => {
        const first = pin(1);
        const second = pin(2, { maxIntensity: '3' });
        render([first, second], { defaultOpen: !open });
        act(() => button(open ? '詳細を開く' : '詳細を閉じる').click());

        act(() => marker('地域2').click());
        expect(button(open ? '詳細を閉じる' : '詳細を開く').getAttribute('aria-expanded')).toBe(String(open));
        expect(selectedDetail().textContent).toContain('地域2');

        // A filter/limit change removes the selected pin; the first remaining pin becomes selected.
        render([first], { defaultOpen: !open });
        expect(selectedDetail().textContent).toContain('地域1');
        expect(button(open ? '詳細を閉じる' : '詳細を開く').getAttribute('aria-expanded')).toBe(String(open));
    });

    it.each([true, false])('does not force an open=%s choice to reset when targets temporarily become empty', (open) => {
        const first = pin(1);
        render([first], { defaultOpen: !open });
        act(() => button(open ? '詳細を開く' : '詳細を閉じる').click());

        render([], { defaultOpen: !open });
        expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0);
        expect(selectedDetail().textContent).not.toContain('地域1');
        render([first], { defaultOpen: !open });

        expect(button(open ? '詳細を閉じる' : '詳細を開く').getAttribute('aria-expanded')).toBe(String(open));
    });

    it('keeps selection and details when only the pin layer is turned off', () => {
        render([pin(1), pin(2)]);
        act(() => marker('地域2').click());
        act(() => button('詳細を開く').click());
        toggleLayer('震源ピン');

        expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0);
        expect(selectedDetail().textContent).toContain('地域2');
        expect(button('詳細を閉じる').getAttribute('aria-expanded')).toBe('true');
        expect(container.textContent).not.toContain('この表示条件に該当する地震はありません');

        toggleLayer('震源ピン');
        expect(marker('地域2').getAttribute('aria-pressed')).toBe('true');
    });

    it('uses a condition-specific empty message in PRODUCT only', () => {
        render([]);
        expect(container.textContent).toContain('この表示条件に該当する地震はありません');
        expect(container.textContent).not.toContain('保存済みの地震ピンはありません');

        render([], { product: false });
        expect(container.textContent).toContain('保存済みの地震ピンはありません');
    });

    it('keeps current details in the final set when refreshed props update the same pin identity', () => {
        render([pin(1)]);
        render([pin(1, { areaName: '更新された地域', maxIntensity: '3', occurredAt: '2041-01-01T01:00:00+09:00' })]);

        expect(selectedDetail().textContent).toContain('更新された地域');
        expect(selectedDetail().textContent).not.toContain('地域1');
        expect(marker('更新された地域').getAttribute('aria-pressed')).toBe('true');
    });
});

describe('shared default map regression', () => {
    it('does not infer PRODUCT behavior from below/collapsible/defaultOpen settings also used by MOCK', () => {
        render([pin(1), pin(2)], { product: false });

        expect(marker('地域1').textContent).toContain('#1');
        expect(marker('地域2').textContent).toContain('#2');
        expect(selectedDetail().textContent).not.toContain('発生日時');
        act(() => button('詳細を開く').click());
        act(() => marker('地域2').click());
        expect(button('詳細を開く').getAttribute('aria-expanded')).toBe('false');
    });
});
