// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ApiCatalogIndexProps } from './types';
const { get, post, reload } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), reload: vi.fn() }));
vi.mock('@inertiajs/react', () => ({
    Head: () => null, router: { get, reload },
    Link: ({ children, ...props }: { children: ReactNode; href: string }) => <a {...props}>{children}</a>,
}));
vi.mock('axios', () => ({ default: { post, get: vi.fn() } }));
vi.mock('@/Layouts/PublicLayout', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
import Index from './Index';
let host: HTMLDivElement; let root: Root;
const base: ApiCatalogIndexProps = {
    filters: { keyword: 'webhooks', providerKey: 'adyen.com', domain: 'com', sortKey: 'name_asc' },
    providers: ['adyen.com', 'example.org'], domains: ['com', 'org'], syncStatus: null,
    pagination: { currentPage: 2, totalPages: 3, totalItems: 16, perPage: 6, from: 7, to: 12 },
    apiCatalogItems: [{ id: 1, apiKey: 'adyen.com:webhooks', title: 'Payment webhooks', description: 'Receive payment events.',
        providerKey: 'adyen.com', serviceKey: 'payments', preferredVersion: 'v1', openapiVersion: '3.1.0', isActive: true }],
};
beforeEach(async () => {
    vi.clearAllMocks(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    window.history.replaceState({}, '', '/api-catalog?keyword=webhooks&provider_key=adyen.com&domain=com&sort=name_asc&page=2');
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    await act(async () => root.render(<Index {...base} />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
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
