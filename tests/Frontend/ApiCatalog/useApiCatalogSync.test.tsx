// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useApiCatalogSync } from '@/Pages/ApiCatalog/hooks/useApiCatalogSync';
import type { ApiCatalogSyncStatus } from '@/Pages/ApiCatalog/types';
const { post, get, visit, refresh } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), visit: vi.fn(), refresh: vi.fn() }));
vi.mock('axios', () => ({ default: { post, get: (url: string, ...args: unknown[]) => (url === '/api-catalog/sync/status' ? get(url, ...args) : refresh(url, ...args)) } }));
const { listeners, on } = vi.hoisted(() => {
    const listeners = new Map<string, (event: { detail: { visit: object } }) => void>();
    return { listeners, on: vi.fn((name: string, callback: (event: { detail: { visit: object } }) => void) => {
        listeners.set(name, callback); return () => { listeners.delete(name); };
    }) };
});
vi.mock('@inertiajs/react', () => ({ router: { visit, on } }));
const queued: ApiCatalogSyncStatus = { id: 9, status: 'queued', isRunning: true, isStale: false,
    result: { totalCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, inactiveCount: 0, failedCount: 0 },
    errorMessage: null, startedAt: null, finishedAt: null, createdAt: null, updatedAt: null };
let host: HTMLDivElement; let root: Root;
const onCatalog = vi.fn();
const pagination = { currentPage: 1, totalPages: 1, totalItems: 4, perPage: 6, from: 1, to: 4 };
const refreshed = { headers: { 'x-inertia': 'true' }, data: { component: 'ApiCatalog/Index', version: 'test-v1', props: {
    filters: { keyword: null, providerKey: null, domain: null, sortKey: 'updated_desc' },
    pagination, apiCatalogItems: [], syncStatus: null,
} } };
const getReturnUrl = () => window.location.pathname + window.location.search;
function Harness({ initial = null, pending = false }: { initial?: ApiCatalogSyncStatus | null; pending?: boolean }) {
    const sync = useApiCatalogSync({ initialSyncStatus: initial, getReturnUrl, onCatalogReloaded: onCatalog, pageComponent: 'ApiCatalog/Index', pageVersion: 'test-v1', isSearchPending: pending });
    return <><button onClick={sync.startPoolSync} disabled={sync.isSyncButtonDisabled}>sync</button><p>{sync.syncMessage}</p></>;
}
beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks(); onCatalog.mockReset(); onCatalog.mockReturnValue(true); get.mockReset(); post.mockReset(); refresh.mockReset(); refresh.mockImplementation(() => new Promise(() => {})); listeners.clear(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    window.history.replaceState({}, '', '/api-catalog');
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
it('shows starting then queued, disables repeated starts, polls and reloads only on completion', async () => {
    let accept!: (value: unknown) => void;
    post.mockImplementation(() => new Promise(resolve => { accept = resolve; }));
    await act(async () => root.render(<Harness />));
    await act(async () => host.querySelector('button')!.click());
    expect(host.textContent).toContain('開始しています'); expect(host.querySelector('button')!.disabled).toBe(true);
    await act(async () => host.querySelector('button')!.click()); expect(post).toHaveBeenCalledTimes(1);
    await act(async () => accept({ data: { syncStatus: queued } }));
    expect(host.textContent).toContain('処理開始を待っています');
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(get).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh.mock.calls[0][1].headers['X-Inertia-Partial-Data']).toBe('filters,apiCatalogItems,pagination,syncStatus'); expect(visit).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(5000)); expect(get).toHaveBeenCalledTimes(1);
});
it('reports polling failure and removes the timer on departure', async () => {
    get.mockRejectedValue(new Error('offline'));
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(host.textContent).toContain('同期状態の取得に失敗');
    await act(async () => root.render(<div>left</div>));
    await act(async () => vi.advanceTimersByTimeAsync(5000)); expect(get).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
});

it('defers refresh during search and aborts old HTTP responses before applying the latest URL', async () => {
    let releaseOld!: (value: unknown) => void;
    refresh.mockImplementationOnce(() => new Promise(resolve => { releaseOld = resolve; }));
    window.history.replaceState({}, '', '/api-catalog?keyword=A');
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    const signal = refresh.mock.calls[0][1].signal;
    expect(refresh.mock.calls[0][0]).toBe('/api-catalog?keyword=A');
    await act(async () => root.render(<Harness initial={queued} pending />));
    expect(signal.aborted).toBe(true);
    await act(async () => releaseOld(refreshed));
    expect(onCatalog).not.toHaveBeenCalled();
    window.history.replaceState({}, '', '/api-catalog?keyword=B&sort=name_asc');
    refresh.mockResolvedValueOnce(refreshed);
    await act(async () => root.render(<Harness initial={queued} />));
    expect(refresh.mock.calls[1][0]).toBe('/api-catalog?keyword=B&sort=name_asc');
    expect(onCatalog).toHaveBeenCalledExactlyOnceWith([], pagination);
    expect(visit).not.toHaveBeenCalled();
});
it('does not refresh an unconfirmed search URL', async () => {
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} pending />));
    await act(async () => vi.advanceTimersByTimeAsync(2500)); expect(refresh).not.toHaveBeenCalled();
    window.history.replaceState({}, '', '/api-catalog?keyword=latest');
    await act(async () => root.render(<Harness initial={queued} />));
    expect(refresh.mock.calls[0][0]).toBe('/api-catalog?keyword=latest');
});
it('never applies a received refresh or revisits the list after history restores a different screen', async () => {
    let releaseReceived!: (value: unknown) => void;
    refresh.mockImplementationOnce(() => new Promise(resolve => { releaseReceived = resolve; }));
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    // HTTP受信済みデータを、適用するPromise callbackより前で保留します。
    const received = structuredClone(refreshed);
    window.history.replaceState({ page: { component: 'ApiCatalog/Show' } }, '', '/api-catalog/example');
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    await act(async () => releaseReceived(received));
    expect(window.location.pathname).toBe('/api-catalog/example');
    expect(window.history.state.page.component).toBe('ApiCatalog/Show');
    expect(onCatalog).not.toHaveBeenCalled(); expect(visit).not.toHaveBeenCalled();
});
it('ignores received refreshes after unmount and after leaving then returning to the same URL', async () => {
    let release!: (value: unknown) => void;
    refresh.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    const signal = refresh.mock.calls[0][1].signal;
    window.history.replaceState({}, '', '/api-catalog/example');
    await act(async () => listeners.get('navigate')?.({ detail: { page: { url: '/api-catalog/example' } } } as never));
    window.history.replaceState({}, '', '/api-catalog');
    await act(async () => release(refreshed));
    expect(signal.aborted).toBe(true); expect(onCatalog).not.toHaveBeenCalled();
    await act(async () => root.render(<div>left</div>));
    expect(visit).not.toHaveBeenCalled();
});
it('does not let an old received response consume the next import generation', async () => {
    let releaseOld!: (value: unknown) => void;
    refresh.mockImplementationOnce(() => new Promise(resolve => { releaseOld = resolve; })).mockResolvedValueOnce(refreshed);
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    const nextQueued = { ...queued, id: 10 };
    get.mockResolvedValueOnce({ data: { syncStatus: { ...nextQueued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={nextQueued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    await act(async () => releaseOld(refreshed));
    expect(onCatalog).toHaveBeenCalledExactlyOnceWith([], pagination);
});
it('checks the Inertia component and version and reports an invalid partial response without navigating', async () => {
    refresh.mockResolvedValueOnce({ ...refreshed, data: { ...refreshed.data, version: 'other' } });
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(onCatalog).not.toHaveBeenCalled(); expect(host.textContent).toContain('カタログ表示の更新に失敗');
    const headers = refresh.mock.calls[0][1].headers;
    expect(headers['X-Inertia']).toBe('true'); expect(headers['X-Inertia-Version']).toBe('test-v1');
    expect(headers['X-Inertia-Partial-Component']).toBe('ApiCatalog/Index'); expect(visit).not.toHaveBeenCalled();
});

it.each([
    ['null item', { apiCatalogItems: [null] }],
    ['object title', { apiCatalogItems: [{ id: 1, title: {} }] }],
    ['null note', { apiCatalogItems: [{ id: 1, apiKey: 'example', title: 'Example', description: '', providerKey: 'example.com', serviceKey: null, preferredVersion: null, openapiVersion: null, isActive: true, notes: [null] }] }],
    ['invalid note body', { apiCatalogItems: [{ id: 1, apiKey: 'example', title: 'Example', description: '', providerKey: 'example.com', serviceKey: null, preferredVersion: null, openapiVersion: null, isActive: true, notes: [{ id: 1, body: {}, title: null, createdAt: null, updatedAt: null }] }] }],
    ['invalid status', { syncStatus: { ...queued, isRunning: 'yes' } }],
    ['invalid result', { syncStatus: { ...queued, result: { ...queued.result, totalCount: {} } } }],
    ['missing status', { syncStatus: undefined }],
])('rejects %s before applying any refreshed data', async (_name, invalidProps) => {
    refresh.mockResolvedValueOnce({ ...refreshed, data: { ...refreshed.data, props: { ...refreshed.data.props, ...invalidProps } } });
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(onCatalog).not.toHaveBeenCalled(); expect(host.textContent).toContain('カタログ表示の更新に失敗');
    expect(window.location.pathname).toBe('/api-catalog'); expect(visit).not.toHaveBeenCalled();
});

it('retains a completion refresh rejected by a newer search until that search is confirmed', async () => {
    onCatalog.mockReturnValueOnce(false);
    refresh.mockResolvedValue(refreshed);
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(onCatalog).toHaveBeenCalledTimes(1);
    await act(async () => root.render(<Harness initial={queued} pending />));
    window.history.replaceState({}, '', '/api-catalog?keyword=new');
    await act(async () => root.render(<Harness initial={queued} />));
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(refresh.mock.calls[1][0]).toBe('/api-catalog?keyword=new'); expect(onCatalog).toHaveBeenCalledTimes(2);
});

it('does not interrupt a pending detail visit when import completes, and discards refresh after departure', async () => {
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    const detail = { url: new URL('/api-catalog/example', window.location.origin), async: false, prefetch: false };
    await act(async () => listeners.get('start')?.({ detail: { visit: detail } }));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(refresh).not.toHaveBeenCalled();
    window.history.replaceState({}, '', '/api-catalog/example');
    await act(async () => listeners.get('finish')?.({ detail: { visit: detail } }));
    expect(refresh).not.toHaveBeenCalled();
});
it('waits for all outgoing visits and resumes only if cancellation leaves the list visible', async () => {
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    const first = { url: new URL('/api-catalog/first', window.location.origin), async: false, prefetch: false };
    const second = { url: new URL('/projects', window.location.origin), async: false, prefetch: false };
    await act(async () => { listeners.get('start')?.({ detail: { visit: first } }); listeners.get('start')?.({ detail: { visit: second } }); });
    await act(async () => vi.advanceTimersByTimeAsync(2500)); expect(refresh).not.toHaveBeenCalled();
    await act(async () => listeners.get('finish')?.({ detail: { visit: first } })); expect(refresh).not.toHaveBeenCalled();
    await act(async () => listeners.get('finish')?.({ detail: { visit: second } })); expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh.mock.calls[0][0]).toBe('/api-catalog');
});
it('keeps newly accepted sync B polling when sync A or null props arrive late', async () => {
    const completedA = { ...queued, status: 'completed' as const, isRunning: false };
    const queuedB = { ...queued, id: 10 };
    post.mockResolvedValueOnce({ data: { syncStatus: queuedB } });
    get.mockResolvedValue({ data: { syncStatus: queuedB } });
    await act(async () => root.render(<Harness initial={completedA} />));
    await act(async () => host.querySelector('button')!.click());
    await act(async () => root.render(<Harness initial={{ ...completedA }} />));
    expect(host.querySelector('button')!.disabled).toBe(true);
    await act(async () => root.render(<Harness initial={null} />));
    expect(host.querySelector('button')!.disabled).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(get.mock.calls[0][1].params.sync_id).toBe(10);
    expect(host.textContent).toContain('処理開始を待っています');
});
it('does not restore an old completed status after a current POST returns untracked null', async () => {
    const completedA = { ...queued, status: 'completed' as const, isRunning: false };
    post.mockResolvedValueOnce({ data: { syncStatus: null } });
    await act(async () => root.render(<Harness initial={completedA} />));
    await act(async () => host.querySelector('button')!.click());
    expect(host.textContent).not.toContain('完了しました');
    await act(async () => root.render(<Harness initial={{ ...completedA }} />));
    expect(host.textContent).not.toContain('完了しました');
    expect(host.querySelector('button')!.disabled).toBe(false);
});
it('ignores an older phase for the same sync ID', async () => {
    const running = { ...queued, status: 'running' as const, updatedAt: '2026-11-22T04:00:02Z' };
    await act(async () => root.render(<Harness initial={running} />));
    await act(async () => root.render(<Harness initial={{ ...queued, updatedAt: '2026-11-22T04:00:01Z' }} />));
    expect(host.textContent).toContain('同期中です');
});

it('accepts a fresh running update after stale without accepting an old running snapshot', async () => {
    const stale = { ...queued, status: 'running' as const, isRunning: false, isStale: true, updatedAt: '2026-11-22T04:00:01Z' };
    await act(async () => root.render(<Harness initial={stale} />));
    await act(async () => root.render(<Harness initial={{ ...stale, isRunning: true, isStale: false }} />));
    expect(host.textContent).toContain('一定時間更新されませんでした');
    await act(async () => root.render(<Harness initial={{ ...stale, isRunning: true, isStale: false, updatedAt: '2026-11-22T04:00:02Z' }} />));
    expect(host.textContent).toContain('同期中です'); expect(host.querySelector('button')!.disabled).toBe(true);
});

it('cancels its active refresh when detail starts and ignores prefetch lifecycle events', async () => {
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500)); expect(refresh).toHaveBeenCalledTimes(1);
    const prefetch = { url: new URL('/api-catalog/prefetch', window.location.origin), async: true, prefetch: true };
    await act(async () => listeners.get('start')?.({ detail: { visit: prefetch } })); expect(refresh.mock.calls[0][1].signal.aborted).toBe(false);
    const detail = { url: new URL('/api-catalog/detail', window.location.origin), async: false, prefetch: false };
    await act(async () => listeners.get('start')?.({ detail: { visit: detail } })); expect(refresh.mock.calls[0][1].signal.aborted).toBe(true);
    window.history.replaceState({}, '', '/api-catalog/detail');
    await act(async () => listeners.get('finish')?.({ detail: { visit: detail } })); expect(refresh).toHaveBeenCalledTimes(1);
});
