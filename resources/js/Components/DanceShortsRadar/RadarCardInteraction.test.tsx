// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DanceShortsDisplayCardField from '../Lab/DanceShortsRadar/Cards/DanceShortsDisplayCardField';
import { autoSlideIntervalMs } from '../Lab/DanceShortsRadar/displayCardNavigation';
import type { DanceShortsDisplaySelectGroup } from '../Lab/DanceShortsRadar/displaySelectGroups';
import type { DanceShortsCandidate, DanceShortsDisplayCardField as CardField } from '../Lab/DanceShortsRadar/types';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@inertiajs/react', () => ({ router: { get } }));

// 既存useDanceShortsCardWindow.testのranking fixtureと同じ項目・値を使います。
function candidate(rank: number): DanceShortsCandidate {
    return {
        video_id: rank, youtube_video_id: `video-${rank}`, region: 'JP', title: `Ranking ${rank}`,
        channel_title: 'Dance Channel', published_at: '2026-06-01 12:00', collected_at: '2026-06-01 13:00',
        like_count: 100, comment_count: 10, view_count: 1000 + rank, previous_view_count: 900,
        view_diff: 100 + rank, view_growth_rate: 0.1, views_per_hour: 10, thumbnail_url: null, youtube_url: null,
    };
}

function rankingWindow(startRank: number): CardField {
    return {
        type: 'ranking', visibleCards: Array.from({ length: 5 }, (_, index) => candidate(startRank + index)),
        activeIndex: 0, activeRank: startRank,
        pagination: { startRank, windowSize: 5, hasPrev: startRank === 6, hasNext: startRank === 1,
            prevStartRank: startRank === 6 ? 1 : null, nextStartRank: startRank === 1 ? 6 : null },
        emptyMessage: null,
    };
}

const groups: DanceShortsDisplaySelectGroup[] = [{
    key: 'comparisonDays', label: '日数', shortLabel: '日数', options: [
        { value: 1, label: '1日', href: '/dance-shorts-radar?comparisonDays=1', isActive: true },
        { value: 3, label: '3日', href: '/dance-shorts-radar?comparisonDays=3', isActive: false },
    ],
}];
let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
        const url = new URL(input, 'http://localhost');
        const startRank = Number(url.searchParams.get('startRank'));
        expect([1, 6]).toContain(startRank);
        expect(url.searchParams.get('comparisonDays')).toBe('1');
        return { ok: true, json: async () => ({ displayCardField: rankingWindow(startRank) }) };
    }));
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    const displayCardField = rankingWindow(1);
    await act(async () => root.render(<DanceShortsDisplayCardField presentation="adopted" displayCardField={displayCardField}
        windowRequest={{ tab: 'ALL', comparisonDays: 1, sortKey: 'view_count_delta' }} selectGroups={groups} activeSelectGroup="comparisonDays" />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function button(label: string) { return host.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!; }
function expectRank(rank: number) {
    expect(host.querySelector('h3')?.textContent).toBe(`Ranking ${rank}`);
    expect(host.querySelector('[data-radar-rank]')?.textContent).toBe(`${rank}位`);
}
async function click(label: string) { await act(async () => button(label).click()); }
async function key(value: string) { await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }))); }
async function tick() { await act(async () => { await vi.advanceTimersByTimeAsync(autoSlideIntervalMs); }); }
async function swipe(deltaX: number, deltaY: number) {
    const field = host.querySelector('#dance-shorts-card-field')!;
    await act(async () => {
        const start = new Event('touchstart', { bubbles: true, cancelable: true });
        Object.defineProperty(start, 'touches', { value: [{ clientX: 150, clientY: 150 }] });
        field.dispatchEvent(start);
        const end = new Event('touchend', { bubbles: true, cancelable: true });
        Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 150 + deltaX, clientY: 150 + deltaY }] });
        field.dispatchEvent(end);
    });
}

describe('Radar adopted card interaction wiring with existing test windows', () => {
    it('moves manually and with arrow keys across the five-card boundary in both directions', async () => {
        expectRank(1);
        expect(button('前のカードへ移動').disabled).toBe(true);
        await click('次のカードへ移動'); expectRank(2);
        await key('ArrowRight'); expectRank(3);
        await click('次のカードへ移動'); await click('次のカードへ移動'); expectRank(5);
        await click('次のカードへ移動'); expectRank(6);
        await key('ArrowLeft'); expectRank(5);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('keeps auto slide active across the window boundary, reverses direction and stops on the active toggle or a user pointer', async () => {
        for (let index = 0; index < 4; index++) await click('次のカードへ移動');
        expectRank(5);
        await click('自動右送りを切り替え'); await tick(); expectRank(6);
        expect(button('自動右送りを切り替え').getAttribute('aria-pressed')).toBe('true');
        await click('自動左送りを切り替え'); await tick(); expectRank(5);
        await click('自動左送りを切り替え'); await tick(); expectRank(5);
        expect(button('自動左送りを切り替え').getAttribute('aria-pressed')).toBe('false');
        await click('自動右送りを切り替え');
        await act(async () => window.dispatchEvent(new Event('pointerdown')));
        await tick(); expectRank(5);
        expect(button('自動右送りを切り替え').getAttribute('aria-pressed')).toBe('false');
    });

    it('keeps horizontal card swipes and vertical condition navigation wired once', async () => {
        await swipe(-100, 0); expectRank(2);
        await swipe(100, 0); expectRank(1);
        await swipe(0, 100);
        expect(get).toHaveBeenCalledTimes(1);
        expect(get.mock.calls[0][0]).toBe('/dance-shorts-radar?comparisonDays=3');
        await click('自動右送りを切り替え');
        await swipe(-100, 0); expectRank(2);
        expect(button('自動右送りを切り替え').getAttribute('aria-pressed')).toBe('false');
    });
});
