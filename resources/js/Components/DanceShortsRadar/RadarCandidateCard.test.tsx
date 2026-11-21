// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import type { DanceShortsCandidate, DanceShortsRisingCandidate } from '../Lab/DanceShortsRadar/types';
import RadarCandidateCard from './RadarCandidateCard';
import DanceShortsCardNavigationControls from '../Lab/DanceShortsRadar/Cards/DanceShortsCardNavigationControls';

const candidate: DanceShortsCandidate = {
    video_id: 1, region: 'JP', title: '最初の動画', published_at: null,
    like_count: null, view_count: 100, previous_view_count: null,
    view_diff: null, views_per_hour: null,
    thumbnail_url: 'https://example.test/one.jpg',
    youtube_url: 'https://www.youtube.com/shorts/one',
};
const container = document.createElement('div');
document.body.append(container);
let root = createRoot(container);
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { act(() => root.unmount()); root = createRoot(container); });

describe('Radar PRODUCT card', () => {
    it('restarts the information animation on a new sequence while keeping the media instance stable', () => {
        act(() => root.render(<RadarCandidateCard candidate={candidate} rank={1} sortKey="views_per_hour" contentTransitionClassName="same-direction" contentTransitionKey={1} />));
        const firstHeading = container.querySelector('h3');
        const firstLink = container.querySelector('a');
        act(() => root.render(<RadarCandidateCard candidate={candidate} rank={1} sortKey="views_per_hour" contentTransitionClassName="same-direction" contentTransitionKey={2} />));
        expect(container.querySelector('h3')).not.toBe(firstHeading);
        expect(container.querySelector('a')).toBe(firstLink);
    });

    it('keeps one set of footer controls and stops auto-button touch propagation', () => {
        const calls: string[] = [];
        act(() => root.render(
            <div onTouchStart={() => calls.push('parent touch')}>
                <DanceShortsCardNavigationControls placement="footer" canMovePrev canMoveNext isWindowSwitching={false} autoSlideDirection={1} canStartCurrentAutoSlide
                    onPrevious={() => calls.push('previous')} onNext={() => calls.push('next')} onToggleAutoSlide={direction => calls.push(`auto ${direction}`)}>
                    {() => <article>Card content</article>}
                </DanceShortsCardNavigationControls>
            </div>
        ));
        const buttons = Array.from(container.querySelectorAll('button'));
        expect(buttons).toHaveLength(4);
        expect(container.querySelector('article')!.compareDocumentPosition(buttons[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        const right = container.querySelector<HTMLButtonElement>('[aria-label="自動右送りを切り替え"]')!;
        expect(right.getAttribute('aria-pressed')).toBe('true');
        act(() => {
            right.dispatchEvent(new Event('touchstart', { bubbles: true }));
            right.click();
            container.querySelector<HTMLButtonElement>('[aria-label="自動左送りを切り替え"]')!.click();
            buttons[0].click();
            buttons[3].click();
        });
        expect(calls).toEqual(['auto 1', 'auto -1', 'previous', 'next']);
    });

    it('keeps rank, title, thumbnail and usable link together through rapid changes without image load events', () => {
        for (const index of [1, 2, 3, 2, 1]) {
            const next = { ...candidate, video_id: index, title: `動画${index}`,
                thumbnail_url: `https://example.test/${index}.jpg`,
                youtube_url: `https://www.youtube.com/shorts/${index}` };
            act(() => root.render(<RadarCandidateCard candidate={next} rank={index} sortKey="views_per_hour" />));
            expect(container.querySelector('h3')?.textContent).toBe(`動画${index}`);
            expect(container.querySelector('[data-radar-rank]')?.textContent).toContain(String(index));
            expect(container.querySelector('img')?.getAttribute('src')).toBe(next.thumbnail_url);
            expect(container.querySelector('a')?.getAttribute('href')).toBe(next.youtube_url);
            expect(container.querySelector('img')?.getAttribute('alt')).toContain(next.title);
        }
    });

    it('keeps missing metrics distinct from zero and puts information before media in document order', () => {
        act(() => root.render(<RadarCandidateCard candidate={candidate} rank={1} sortKey="views_per_hour" />));
        expect(container.textContent).toContain('算出不可');
        expect(container.querySelector('h3')!.compareDocumentPosition(container.querySelector('img')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        act(() => root.render(<RadarCandidateCard candidate={{...candidate, views_per_hour: 0}} rank={1} sortKey="views_per_hour" />));
        expect(container.textContent).toContain('0回/時');
        expect(container.textContent).not.toContain('算出不可');
        act(() => root.render(<RadarCandidateCard candidate={candidate} rank={1} sortKey="current_view_count" />));
        expect(container.textContent).toContain('比較元なし');
    });

    it('shows the supplied overseas increase, Japan status and reason without treating Japan zero as unobserved', () => {
        const rising: DanceShortsRisingCandidate = {
            title: '海外の候補', source_region: 'US', source_region_label: 'アメリカ',
            japan_status: '日本側の増加は小さい', japan_view_count_delta: 0,
            view_count_delta: 300, view_growth_rate: null,
            thumbnail_url: null, youtube_url: null, tags: ['US先行'], observation_note: 'サーバーが返した候補理由',
        };
        act(() => root.render(<RadarCandidateCard candidate={rising} rank={6} sortKey="__rising" />));
        expect(container.textContent).toContain('+300回');
        expect(container.textContent).toContain('日本側の増加は小さい');
        expect(container.textContent).toContain('+0回');
        expect(container.textContent).toContain('算出不可');
        expect(container.textContent).toContain(rising.observation_note);
        act(() => root.render(<RadarCandidateCard candidate={{...rising, japan_view_count_delta: null, japan_status: '日本側は未観測'}} rank={6} sortKey="__rising" />));
        expect(container.textContent).toContain('未観測');
        expect(container.textContent).not.toContain('+0回');
    });
});
