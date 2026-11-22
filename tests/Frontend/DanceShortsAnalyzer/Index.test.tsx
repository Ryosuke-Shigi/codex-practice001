// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
const get = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', () => ({Head: () => null, Link: ({children, href, ...props}: {children: ReactNode; href: string}) => <a href={href} {...props}>{children}</a>, router: {get}}));
vi.mock('@/Layouts/PublicLayout', () => ({default: ({children}: {children: ReactNode}) => <main>{children}</main>}));
vi.mock('@/Components/Effects/BackgroundTraceEffect/BackgroundTraceEffect', () => ({default: () => null}));
import Index from '@/Pages/DanceShortsAnalyzer/Index';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const searchField = {keyword: 'dance', action: '/dance-shorts-analyzer', analyze_action: '/dance-shorts-analyzer/analyze', placeholder: '', button_label: 'Search'};
const videos = Array.from({length: 20}, (_, i) => ({video_id: i + 1, youtube_video_id: `youtube-${i + 1}`, title: `動画${i + 1}`, channel_title: null, thumbnail_url: null, published_at: null, youtube_url: '', tracking_status: 'active'}));
const cardsField = {videos, empty_message: null, end_message: null, has_searched: true, has_more: true, next_page: 2, current_page: 1, per_page: 20, sort: 'published_desc' as const, sort_options: [{value: 'published_desc' as const, label: '登録日 ↓'}, {value: 'published_asc' as const, label: '登録日 ↑'}]};
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
async function render(cards = cardsField) {
    if (!host) {host = document.createElement('div'); document.body.append(host); root = createRoot(host);}
    await act(async () => root.render(<Index searchField={searchField} cardsField={cards} />));
}
async function click(button: Element) {await act(async () => (button as HTMLElement).click());}
afterEach(async () => {await act(async () => root?.unmount()); host?.remove(); host = undefined!; get.mockClear();});
describe('Analyzer search selection contract', () => {
    it('explains the search before selection and keeps analyze next to the count', async () => {
        await render();
        expect(host.textContent).toContain('保存済みのダンス動画を検索して、最大5件の推移を比較');
        expect(host.querySelector('a[href*="/analyze?"]')).toBeNull();
        expect(host.querySelector('input')!.compareDocumentPosition(host.querySelector('h2')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    it('keeps five selected videos removable and preserves ordered internal IDs', async () => {
        await render();
        for (const button of Array.from(host.querySelectorAll('h2')).slice(0, 5)) await click(button.closest('button')!);
        expect(host.textContent).toContain('選択中 5/5');
        expect(host.textContent).toContain('別の動画を選ぶには1件解除');
        expect(host.querySelectorAll('h2')[5].closest('button')!.disabled).toBe(true);
        const href = host.querySelector('a[href*="/analyze?"]')!.getAttribute('href')!;
        const query = new URL(href, 'http://localhost').searchParams;
        expect(query.getAll('video_ids[]')).toEqual(['1','2','3','4','5']);
        expect(query.get('active_video_id')).toBe('1');
        await click(host.querySelector('h2')!.closest('button')!);
        expect(host.querySelectorAll('h2')[5].closest('button')!.disabled).toBe(false);
    });
    it('appends the next page uniquely while retaining selection then resets on sorting', async () => {
        await render(); await click(host.querySelector('h2')!.closest('button')!);
        await click(Array.from(host.querySelectorAll('button')).find((button) => button.textContent === 'さらに取得')!);
        expect(get.mock.calls[0][1]).toEqual({keyword:'dance', page:2, sort:'published_desc'});
        await render({...cardsField, current_page:2, next_page:3, videos:[videos[0], ...videos.map(video => ({...video, video_id:video.video_id + 20, youtube_video_id:`next-${video.video_id}`}))]});
        expect(host.querySelectorAll('h2')).toHaveLength(40);
        expect(host.textContent).toContain('選択中 1/5');
        await click(Array.from(host.querySelectorAll('button')).find(button => button.textContent === '登録日 ↑')!);
        expect(host.querySelector('a[href*="/analyze?"]')).toBeNull();
        expect(get.mock.calls[1][1]).toEqual({keyword:'dance', page:1, sort:'published_asc'});
    });
    it('announces searching beside the input and clears selection on a new search', async () => {
        await render(); await click(host.querySelector('h2')!.closest('button')!);
        await act(async () => {host.querySelector('form')!.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));});
        expect(host.querySelector('a[href*="/analyze?"]')).toBeNull();
        const options = get.mock.calls[0][2];
        await act(async () => options.onStart());
        expect(host.querySelector('#analyzer-search-status')!.textContent).toBe('検索中です。');
        expect(host.querySelector('input')!.disabled).toBe(true);
        await act(async () => options.onFinish());
        await render({...cardsField, videos: [], has_searched: true});
        expect(host.querySelector('#analyzer-search-status')!.textContent).toContain('該当する保存済み動画はありません');
        await render({...cardsField, videos: [], has_searched: false});
        expect(host.querySelector('#analyzer-search-status')!.textContent).toContain('キーワードを入力');
    });

});
