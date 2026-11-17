// @vitest-environment jsdom

import { act, type HTMLAttributes, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.hoisted(() => vi.fn());
const reload = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ children, href, ...props }: { children?: ReactNode; href: string; [key: string]: unknown }) => <a href={href} {...props}>{children}</a>,
    router: { get: reload },
}));
vi.mock('@/Layouts/PublicLayout', () => ({
    default: ({ children }: { children?: ReactNode }) => <main>{children}</main>,
}));
vi.mock('motion/react', () => ({
    motion: {
        div: ({ children, initial: _initial, animate: _animate, transition: _transition, ...props }: HTMLAttributes<HTMLDivElement> & {
            initial?: unknown; animate?: unknown; transition?: unknown;
        }) => <div {...props}>{children}</div>,
    },
}));
// This suite exercises page composition and final targets, not asynchronous map decoration.
vi.mock('@/Components/JapanQuakeWaveMap/PlateBoundaryLayer', () => ({
    default: () => null,
}));
vi.mock('@/Pages/QuakeWavePreview/hooks/useQuakeMapRefresh', () => ({
    useQuakeMapRefresh: () => ({
        refreshAction: {
            buttonLabel: '更新', disabledLabel: '更新中', statusLabel: '最新です',
            description: '内部処理', isRefreshing: false, errorMessage: null, onRefresh: refresh,
        },
    }),
}));

import type { EarthquakeMapPin } from '@/Components/JapanQuakeWaveMap/JapanQuakeWaveMap';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';

import JapanQuakeWaveMapMockPage from '@/Pages/QuakeWavePreview/JapanQuakeWaveMapMockPage';
import QuakeWaveMapPage from '@/Pages/QuakeWavePreview/QuakeWaveMapPage';

function pin(sourceEntryId: number, maxIntensity = '4', overrides: Partial<EarthquakeMapPin> = {}): EarthquakeMapPin {
    return {
        eventId: `event-${sourceEntryId}`, sourceEntryId, title: null,
        areaName: `地域${sourceEntryId}`, headline: null, rawCoordinate: null,
        latitude: '38', longitude: '142', depthMeter: 40000, magnitude: '4.5', maxIntensity,
        occurredAt: '2040-12-31T12:34:56+09:00',
        reportedAt: `2026-10-01T02:${String(sourceEntryId).padStart(2, '0')}:00+09:00`,
        comment: null, ...overrides,
    };
}

const candidates = [pin(1, '5-'), pin(2), pin(3), pin(4, '3'), pin(5, '2'), pin(6, '1')];
const filters = { startDate: '2026-10-01', endDate: '2026-10-02' };
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    refresh.mockClear();
    reload.mockClear();
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

function render(pins: EarthquakeMapPin[] = candidates) {
    act(() => root.render(<QuakeWaveMapPage pins={pins} filters={filters} />));
}

function button(text: string) {
    const target = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((candidate) => candidate.textContent?.trim() === text);
    if (!target) throw new Error(`button not found: ${text}`);
    return target;
}

function marker(area: string) {
    const target = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'))
        .find((candidate) => candidate.getAttribute('aria-label')?.startsWith(`${area} `));
    if (!target) throw new Error(`map pin not found: ${area}`);
    return target;
}

function sectionWithHeading(text: string) {
    const target = Array.from(container.querySelectorAll('h2')).find((heading) => heading.textContent?.trim() === text)?.closest('section');
    if (!target) throw new Error(`section not found: ${text}`);
    return target;
}

function expectBefore(first: Element, second: Element) {
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
}

function setLimit(value: number) {
    const range = container.querySelector<HTMLInputElement>('input[type="range"]');
    if (!range) throw new Error('display limit not found');
    act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(range, String(value));
        range.dispatchEvent(new Event('input', { bubbles: true }));
        range.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

function toggleIntensity(label: string) {
    const target = container.querySelector<HTMLButtonElement>(`button[role="switch"][aria-label="震度${label}の表示"]`);
    if (!target) throw new Error(`intensity switch not found: ${label}`);
    act(() => target.click());
}

describe('PRODUCT page accepted composition and final targets', () => {
    it('places dates before the map and the unique update/back/existing Preview Tools after all map controls', () => {
        render();
        const map = container.querySelector('[role="img"][aria-label="日本地図"]');
        const detail = container.querySelector('aside');
        const backHref = getStageProjectReturnLink('japan-quake-wave-map').href;
        const back = container.querySelector(`a[href="${backHref}"]`);
        const preview = container.querySelector('a[href="/quakewave-preview"]');
        if (!map || !detail || !back || !preview) throw new Error('PRODUCT composition is incomplete');

        expectBefore(sectionWithHeading('日付範囲'), map);
        expectBefore(map, detail);
        expectBefore(detail, sectionWithHeading('震度フィルター'));
        expectBefore(sectionWithHeading('震度フィルター'), sectionWithHeading('MAP LAYERS'));
        expectBefore(sectionWithHeading('MAP LAYERS'), button('更新'));
        expectBefore(button('更新'), back);
        expectBefore(back, preview);
        expect(container.querySelectorAll('a[href="/quakewave-preview"]')).toHaveLength(1);
        expect(Array.from(container.querySelectorAll('button')).filter((candidate) => candidate.textContent?.trim() === '更新')).toHaveLength(1);
        expect(container.querySelectorAll('input[type="date"]')).toHaveLength(2);
        act(() => button('更新').click());
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('keeps all ten intensity controls in the requested order and opts PRODUCT into the single-row layout', () => {
        render();
        const section = sectionWithHeading('震度フィルター');
        const switches = Array.from(section.querySelectorAll('[role="switch"]'));

        expect(switches.map((target) => target.getAttribute('aria-label'))).toEqual(
            ['7', '6強', '6弱', '5強', '5弱', '4', '3', '2', '1', '不明'].map((label) => `震度${label}の表示`),
        );
        // This asserts the declared CSS layout, not actual browser geometry or touch size.
        const row = switches[0].parentElement?.parentElement;
        expect(row?.classList.contains('grid-cols-10')).toBe(true);
        expect(row?.classList.contains('grid-cols-5')).toBe(false);
    });

    it('uses the same valid final set for map pins, selected details and the displayed target count', () => {
        render([pin(7, '7', { latitude: null }), pin(8, '6+', { longitude: 'invalid' }), ...candidates]);

        expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(6);
        expect(container.textContent).toMatch(/対象\s*6件/);
        expect(container.querySelector<HTMLInputElement>('input[type="range"]')?.value).toBe('10');
        expect(container.querySelector('aside')?.textContent).toContain('地域1');
        expect(container.textContent).not.toContain('地域7');
        expect(container.textContent).not.toContain('地域8');
    });

    it.each(['filter', 'limit'])('maintains an opened detail when a %s change automatically replaces the selected target', (change) => {
        render();
        act(() => marker('地域6').click());
        act(() => button('詳細を開く').click());

        if (change === 'filter') toggleIntensity('1');
        else setLimit(5);

        expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(5);
        expect(container.textContent).toMatch(/対象\s*5件/);
        expect(container.querySelector('aside')?.textContent).toContain('地域1');
        expect(button('詳細を閉じる').getAttribute('aria-expanded')).toBe('true');
        expect(marker('地域1').getAttribute('aria-pressed')).toBe('true');
    });

    it('keeps the final count and selected detail when the pin layer is hidden', () => {
        render();
        act(() => marker('地域6').click());
        const layers = sectionWithHeading('MAP LAYERS');
        const open = layers.querySelector<HTMLButtonElement>('button');
        if (!open) throw new Error('layers toggle not found');
        act(() => open.click());
        const pinsToggle = Array.from(layers.querySelectorAll('label')).find((label) => label.textContent?.trim() === '震源ピン')?.querySelector('input');
        if (!pinsToggle) throw new Error('pins checkbox not found');
        act(() => pinsToggle.click());

        expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0);
        expect(container.textContent).toMatch(/対象\s*6件/);
        expect(container.querySelector('aside')?.textContent).toContain('地域6');
        expect(container.textContent).not.toContain('この表示条件に該当する地震はありません');
    });

    it('distinguishes a filtered empty final set from missing saved data and from the configured limit', () => {
        render();
        for (const target of Array.from(container.querySelectorAll<HTMLButtonElement>('[role="switch"]'))) {
            act(() => target.click());
        }

        expect(container.textContent).toMatch(/対象\s*0件/);
        expect(container.querySelector<HTMLInputElement>('input[type="range"]')?.value).toBe('10');
        expect(container.textContent).toContain('この表示条件に該当する地震はありません');
        expect(container.textContent).not.toContain('保存済みの地震ピンはありません');
        expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(0);
        expect(container.querySelector('aside')?.textContent).not.toContain('地域1');
    });
});

describe('MOCK page scope regression', () => {
    it('keeps its existing header links, all numbered labels and responsive filter rather than inheriting PRODUCT presentation', () => {
        act(() => root.render(<JapanQuakeWaveMapMockPage />));
        const header = container.querySelector('header');
        const markers = Array.from(container.querySelectorAll('button[aria-pressed]'));

        expect(header?.textContent).toContain('QuakeWave Preview');
        expect(header?.textContent).toContain('DB Map');
        expect(container.textContent).not.toContain('Preview Tools');
        expect(markers.length).toBeGreaterThan(1);
        expect(markers.every((target) => target.textContent?.includes('#'))).toBe(true);
        const firstSwitch = sectionWithHeading('震度フィルター').querySelector('[role="switch"]');
        expect(firstSwitch?.parentElement?.parentElement?.classList.contains('grid-cols-5')).toBe(true);
    });
});
