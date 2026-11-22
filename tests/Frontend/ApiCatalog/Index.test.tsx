// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ApiCatalogIndexProps } from '@/Pages/ApiCatalog/types';
const { get, post, reload, visit, axiosGet } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), reload: vi.fn(), visit: vi.fn(), axiosGet: vi.fn() }));
const { listeners, on } = vi.hoisted(() => {
    const listeners = new Map<string, (event: { detail: { visit: object } }) => void>();
    return { listeners, on: vi.fn((name: string, callback: (event: { detail: { visit: object } }) => void) => {
        listeners.set(name, callback); return () => { listeners.delete(name); };
    }) };
});
vi.mock('@inertiajs/react', () => ({
    Head: () => null, router: { get, reload, visit, on },
    Link: ({ children, ...props }: { children: ReactNode; href: string }) => <a {...props}>{children}</a>,
}));
vi.mock('axios', () => ({ default: { post, get: axiosGet } }));
vi.mock('@/Layouts/PublicLayout', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
import Index from '@/Pages/ApiCatalog/Index';
let host: HTMLDivElement; let root: Root;
const base: ApiCatalogIndexProps = {
    filters: { keyword: 'webhooks', providerKey: 'adyen.com', domain: 'com', sortKey: 'name_asc' },
    providers: ['adyen.com', 'example.org'], domains: ['com', 'org'], syncStatus: null,
    pagination: { currentPage: 2, totalPages: 3, totalItems: 16, perPage: 6, from: 7, to: 12 },
    apiCatalogItems: [{ id: 1, apiKey: 'adyen.com:webhooks', title: 'Payment webhooks', description: 'Receive payment events.',
        providerKey: 'adyen.com', serviceKey: 'payments', preferredVersion: 'v1', openapiVersion: '3.1.0', isActive: true }],
};
beforeEach(async () => {
    vi.clearAllMocks(); listeners.clear(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    window.history.replaceState({}, '', '/api-catalog?keyword=webhooks&provider_key=adyen.com&domain=com&sort=name_asc&page=2');
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    await act(async () => root.render(<Index {...base} />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
async function click(label: string) {
    const b = Array.from(host.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === label)!;
    await act(async () => b.click());
}
async function input(value: string) {
    const field = host.querySelector<HTMLInputElement>('input[type="search"]')!;
    await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
    });
}
it('removes one condition from page two, preserves the others, and hides stale counts until server confirmation', async () => {
    expect(host.textContent).toContain('検索結果 16件');
    const href = host.querySelector('article a')!.getAttribute('href')!;
    expect(decodeURIComponent(href)).toContain('return_url=/api-catalog?keyword=webhooks&provider_key=adyen.com&domain=com&sort=name_asc&page=2');
    await click('Provider「adyen.com」を解除');
    expect(get.mock.calls[0][1]).toEqual({ keyword: 'webhooks', domain: 'com', sort: 'name_asc', page: 1 });
    expect(host.textContent).toContain('検索結果を更新中');
    expect(host.textContent).not.toContain('検索結果 16件');
    expect(host.querySelector('article')).toBeNull();
    expect(document.activeElement?.getAttribute('role')).toBe('status');
    const options = get.mock.calls[0][2];
    const next = { ...base, filters: { ...base.filters, providerKey: null }, pagination: { ...base.pagination, currentPage: 1, from: 1, to: 6, totalItems: 22, totalPages: 4 } };
    await act(async () => { root.render(<Index {...next} />); options.onSuccess({ props: next }); options.onFinish(); });
    expect(host.textContent).toContain('検索結果 22件');
    expect(host.querySelector('article')).not.toBeNull();
});
it('keeps the latest request pending, reports failed application, and allows condition removal at zero results', async () => {
    await input('first'); const firstOptions = get.mock.calls[0][2];
    await input('second'); const secondOptions = get.mock.calls[1][2];
    await act(async () => firstOptions.onFinish());
    expect(host.textContent).toContain('検索結果を更新中');
    await act(async () => { secondOptions.onError({ keyword: 'error' }); secondOptions.onFinish(); });
    expect(host.textContent).toContain('検索条件が未適用');
    expect(host.textContent).not.toContain('検索結果 16件');
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
});
it('allows a single condition to be removed from zero results', async () => {
    const zero = { ...base, pagination: { ...base.pagination, currentPage: 1, totalItems: 0, totalPages: 1, from: null, to: null }, apiCatalogItems: [] };
    await act(async () => root.render(<Index {...zero} />));
    expect(host.textContent).toContain('検索結果 0件');
    await click('Domain「com」を解除');
    expect(get.mock.calls[get.mock.calls.length - 1][1]).toEqual({ keyword: 'webhooks', provider_key: 'adyen.com', sort: 'name_asc', page: 1 });
});
it('keeps Clear sort and prevents duplicate page visits from keyboard actions while pending', async () => {
    await act(async () => host.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(get).not.toHaveBeenCalled();
    await act(async () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(get).toHaveBeenCalledTimes(1); expect(get.mock.calls[0][1].page).toBe(3);
    await act(async () => get.mock.calls[0][2].onFinish()); get.mockClear();
    const clear = Array.from(host.querySelectorAll('button')).find(b => b.textContent === '条件をすべて解除')!;
    await act(async () => clear.click());
    expect(get.mock.calls[0][1]).toEqual({ sort: 'name_asc', page: 1 });
    expect(post).not.toHaveBeenCalled();
});
it('ignores form swipes and navigates once for a horizontal swipe', async () => {
    function swipe(target: Element) {
        const start = new Event('touchstart', { bubbles: true });
        Object.defineProperty(start, 'touches', { value: [{ clientX: 200, clientY: 200 }] }); target.dispatchEvent(start);
        const end = new Event('touchend', { bubbles: true });
        Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 80, clientY: 200 }] }); target.dispatchEvent(end);
    }
    await act(async () => swipe(host.querySelector('input')!)); expect(get).not.toHaveBeenCalled();
    await act(async () => { swipe(host.querySelector('article')!); swipe(host.querySelector('main')!); });
    expect(get).toHaveBeenCalledTimes(1); expect(get.mock.calls[0][1].page).toBe(3);
});

it('retries the failed page request with the original page and conditions', async () => {
    await click('次のページ');
    const options = get.mock.calls[0][2];
    await act(async () => { options.onError({}); options.onFinish(); });
    const retry = Array.from(host.querySelectorAll('button')).find(b => b.textContent === '再試行')!;
    await act(async () => retry.click());
    expect(get.mock.calls[1][1]).toEqual(get.mock.calls[0][1]);
    expect(get.mock.calls[1][1].page).toBe(3);
});

it('keeps new input while an older refresh is already queued and refreshes only the confirmed new URL', async () => {
    vi.useFakeTimers();
    const queued = { id: 9, status: 'queued' as const, isRunning: true, isStale: false,
        result: { totalCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, inactiveCount: 0, failedCount: 0 },
        errorMessage: null, startedAt: null, finishedAt: null, createdAt: null, updatedAt: null };
    const completed = { ...queued, status: 'completed' as const, isRunning: false };
    axiosGet.mockResolvedValueOnce({ data: { syncStatus: completed } });
    await act(async () => root.render(<Index {...base} syncStatus={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    const oldRefresh = visit.mock.calls[0][1];
    const cancelOld = vi.fn(); oldRefresh.onCancelToken({ cancel: cancelOld });
    expect(oldRefresh.async).toBe(false);
    await input('transfer'); expect(cancelOld).toHaveBeenCalledTimes(1);
    // Inertiaの直列response queueへ既に入ったAはBより先にpropsを適用し得ます。
    const stale = { ...base, pagination: { ...base.pagination, totalItems: 99 }, syncStatus: completed };
    await act(async () => root.render(<Index {...stale} />));
    expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('transfer');
    expect(host.textContent).not.toContain('検索結果 99件');
    const next = { ...base, filters: { ...base.filters, keyword: 'transfer' }, syncStatus: completed,
        pagination: { ...base.pagination, currentPage: 1, totalItems: 3, totalPages: 1, from: 1, to: 3 } };
    window.history.replaceState({}, '', '/api-catalog?keyword=transfer&provider_key=adyen.com&domain=com&sort=name_asc&page=1');
    await act(async () => { root.render(<Index {...next} />); get.mock.calls[0][2].onSuccess({ props: next }); get.mock.calls[0][2].onFinish(); });
    expect(visit.mock.calls[1][0]).toBe(window.location.pathname + window.location.search);
    await act(async () => oldRefresh.onSuccess({ props: stale }));
    expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('transfer');
    expect(host.textContent).toContain('検索結果 3件');
});

it('restores focus to the result heading after page-button navigation completes', async () => {
    await click('次のページ');
    const next = { ...base, pagination: { ...base.pagination, currentPage: 3, from: 13, to: 16 } };
    await act(async () => { root.render(<Index {...next} />); get.mock.calls[0][2].onSuccess({ props: next }); get.mock.calls[0][2].onFinish(); });
    expect(document.activeElement).toBe(host.querySelector('[aria-label="検索結果と条件"] h2'));
});

it('keeps a failed page retry available when import completes, then refreshes the retried page', async () => {
    vi.useFakeTimers();
    const queued = { id: 15, status: 'queued' as const, isRunning: true, isStale: false,
        result: { totalCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, inactiveCount: 0, failedCount: 0 },
        errorMessage: null, startedAt: null, finishedAt: null, createdAt: null, updatedAt: null };
    const completed = { ...queued, status: 'completed' as const, isRunning: false };
    await act(async () => root.render(<Index {...base} syncStatus={queued} />));
    await click('次のページ');
    await act(async () => { get.mock.calls[0][2].onError({}); get.mock.calls[0][2].onFinish(); });
    axiosGet.mockResolvedValueOnce({ data: { syncStatus: completed } });
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(visit).not.toHaveBeenCalled();
    const retry = Array.from(host.querySelectorAll('button')).find(button => button.textContent === '再試行')!;
    expect(retry).toBeDefined();
    await act(async () => retry.click()); expect(get.mock.calls[1][1].page).toBe(3);
    const next = { ...base, syncStatus: completed, pagination: { ...base.pagination, currentPage: 3, from: 13, to: 16 } };
    window.history.replaceState({}, '', '/api-catalog?keyword=webhooks&domain=com&provider_key=adyen.com&sort=name_asc&page=3');
    await act(async () => { root.render(<Index {...next} />); get.mock.calls[1][2].onSuccess({ props: next }); get.mock.calls[1][2].onFinish(); });
    expect(visit.mock.calls[0][0]).toBe(window.location.pathname + window.location.search);
});
it('does not navigate from the import breakdown control, but allows a list background swipe', async () => {
    const completed = { id: 1, status: 'completed' as const, isRunning: false, isStale: false,
        result: { totalCount: 2, insertedCount: 1, updatedCount: 1, skippedCount: 0, inactiveCount: 0, failedCount: 0 },
        errorMessage: null, startedAt: null, finishedAt: null, createdAt: null, updatedAt: null };
    await act(async () => root.render(<Index {...base} syncStatus={completed} />));
    const control = Array.from(host.querySelectorAll('button')).find(b => b.textContent === '取り込み結果の内訳')!;
    expect(control).toBeDefined();
    function swipe(target: Element) {
        const start = new Event('touchstart', { bubbles: true });
        Object.defineProperty(start, 'touches', { value: [{ clientX: 200, clientY: 200 }] }); target.dispatchEvent(start);
        const end = new Event('touchend', { bubbles: true });
        Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 80, clientY: 200 }] }); target.dispatchEvent(end);
    }
    await act(async () => { control.click(); swipe(control); });
    expect(get).not.toHaveBeenCalled(); expect(post).not.toHaveBeenCalled(); expect(visit).not.toHaveBeenCalled();
    await act(async () => swipe(host.querySelector('main')!)); expect(get).toHaveBeenCalledTimes(1);
});

it('preserves failed search B against queued old props and retries B without showing old results', async () => {
    await input('transfer'); const options = get.mock.calls[0][2];
    await act(async () => { options.onError({}); options.onFinish(); });
    await act(async () => root.render(<Index {...base} pagination={{ ...base.pagination, totalItems: 99 }} />));
    expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('transfer');
    expect(host.textContent).not.toContain('検索結果 99件'); expect(host.querySelector('article')).toBeNull();
    const retry = Array.from(host.querySelectorAll('button')).find(b => b.textContent === '再試行')!;
    expect(retry).toBeDefined(); await act(async () => retry.click());
    expect(get.mock.calls[1][1]).toEqual(get.mock.calls[0][1]);
});
it('does not steal input focus when a page request is superseded by typing', async () => {
    await click('次のページ');
    const field = host.querySelector<HTMLInputElement>('input')!;
    await act(async () => field.focus()); await input('transfer');
    const next = { ...base, filters: { ...base.filters, keyword: 'transfer' }, pagination: { ...base.pagination, currentPage: 1, from: 1, to: 6 } };
    await act(async () => { root.render(<Index {...next} />); get.mock.calls[1][2].onSuccess({ props: next }); get.mock.calls[1][2].onFinish(); });
    expect(document.activeElement).toBe(field);
});
