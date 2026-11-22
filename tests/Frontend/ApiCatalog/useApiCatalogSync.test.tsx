// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useApiCatalogSync } from '@/Pages/ApiCatalog/hooks/useApiCatalogSync';
import type { ApiCatalogSyncStatus } from '@/Pages/ApiCatalog/types';
const { post, get, visit } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), visit: vi.fn() }));
vi.mock('axios', () => ({ default: { post, get } }));
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
const onPagination = vi.fn();
const getReturnUrl = () => window.location.pathname + window.location.search;
function Harness({ initial = null, pending = false }: { initial?: ApiCatalogSyncStatus | null; pending?: boolean }) {
    const sync = useApiCatalogSync({ initialSyncStatus: initial, getReturnUrl, onPaginationReloaded: onPagination, isSearchPending: pending });
    return <><button onClick={sync.startPoolSync} disabled={sync.isSyncButtonDisabled}>sync</button><p>{sync.syncMessage}</p></>;
}
beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks(); listeners.clear(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
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
    expect(get).toHaveBeenCalledTimes(1); expect(visit).toHaveBeenCalledTimes(1);
    expect(visit.mock.calls[0][1].only).toEqual(['filters', 'apiCatalogItems', 'pagination', 'syncStatus']);
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

it('defers import refresh during search and cancels old refresh before using the latest confirmed URL', async () => {
    const cancel = vi.fn();
    visit.mockImplementation((_url, options) => options.onCancelToken({ cancel }));
    window.history.replaceState({}, '', '/api-catalog?keyword=A');
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(visit).toHaveBeenCalledTimes(1);
    expect(visit.mock.calls[0][0]).toBe('/api-catalog?keyword=A');
    expect(visit.mock.calls[0][1].async).toBe(false);
    const old = visit.mock.calls[0][1];
    await act(async () => root.render(<Harness initial={queued} pending />));
    expect(cancel).toHaveBeenCalledTimes(1);
    await act(async () => old.onSuccess({ props: { pagination: { currentPage: 1, totalPages: 1, totalItems: 99, perPage: 6, from: 1, to: 6 } } }));
    expect(onPagination).not.toHaveBeenCalled();
    window.history.replaceState({}, '', '/api-catalog?keyword=B&sort=name_asc');
    await act(async () => root.render(<Harness initial={queued} />));
    expect(visit).toHaveBeenCalledTimes(2);
    expect(visit.mock.calls[1][0]).toBe('/api-catalog?keyword=B&sort=name_asc');
});
it('does not refresh the old URL when completion arrives during an unconfirmed search', async () => {
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} pending />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(visit).not.toHaveBeenCalled();
    window.history.replaceState({}, '', '/api-catalog?keyword=latest');
    await act(async () => root.render(<Harness initial={queued} />));
    expect(visit.mock.calls[0][0]).toBe('/api-catalog?keyword=latest');
});

it('cancels an active import refresh on departure and ignores its late success', async () => {
    const cancel = vi.fn();
    visit.mockImplementation((_url, options) => options.onCancelToken({ cancel }));
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    const options = visit.mock.calls[0][1];
    await act(async () => root.render(<div>left</div>));
    expect(cancel).toHaveBeenCalledTimes(1);
    await act(async () => options.onSuccess({ props: { pagination: { currentPage: 1, totalPages: 1, totalItems: 8, perPage: 6, from: 1, to: 6 } } }));
    expect(onPagination).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(5000)); expect(visit).toHaveBeenCalledTimes(1);
});

it('does not let an old completion consume a newer import refresh generation', async () => {
    visit.mockImplementation((_url, options) => options.onCancelToken({ cancel: vi.fn() }));
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    const old = visit.mock.calls[0][1];
    const nextQueued = { ...queued, id: 10 };
    get.mockResolvedValueOnce({ data: { syncStatus: { ...nextQueued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={nextQueued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(visit).toHaveBeenCalledTimes(2);
    const pagination = { currentPage: 1, totalPages: 1, totalItems: 4, perPage: 6, from: 1, to: 4 };
    await act(async () => old.onSuccess({ props: { pagination } }));
    expect(onPagination).not.toHaveBeenCalled();
    await act(async () => visit.mock.calls[1][1].onSuccess({ props: { pagination } }));
    expect(onPagination).toHaveBeenCalledExactlyOnceWith(pagination);
});

it('does not interrupt a pending detail visit when import completes, and discards refresh after departure', async () => {
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    const detail = { url: new URL('/api-catalog/example', window.location.origin), async: false, prefetch: false };
    await act(async () => listeners.get('start')?.({ detail: { visit: detail } }));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(visit).not.toHaveBeenCalled();
    window.history.replaceState({}, '', '/api-catalog/example');
    await act(async () => listeners.get('finish')?.({ detail: { visit: detail } }));
    expect(visit).not.toHaveBeenCalled();
});
it('waits for all outgoing visits and resumes only if cancellation leaves the list visible', async () => {
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    const first = { url: new URL('/api-catalog/first', window.location.origin), async: false, prefetch: false };
    const second = { url: new URL('/projects', window.location.origin), async: false, prefetch: false };
    await act(async () => { listeners.get('start')?.({ detail: { visit: first } }); listeners.get('start')?.({ detail: { visit: second } }); });
    await act(async () => vi.advanceTimersByTimeAsync(2500)); expect(visit).not.toHaveBeenCalled();
    await act(async () => listeners.get('finish')?.({ detail: { visit: first } })); expect(visit).not.toHaveBeenCalled();
    await act(async () => listeners.get('finish')?.({ detail: { visit: second } })); expect(visit).toHaveBeenCalledTimes(1);
    expect(visit.mock.calls[0][0]).toBe('/api-catalog');
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
    const cancel = vi.fn(); visit.mockImplementation((_url, options) => options.onCancelToken({ cancel }));
    get.mockResolvedValueOnce({ data: { syncStatus: { ...queued, status: 'completed', isRunning: false } } });
    await act(async () => root.render(<Harness initial={queued} />));
    await act(async () => vi.advanceTimersByTimeAsync(2500)); expect(visit).toHaveBeenCalledTimes(1);
    const prefetch = { url: new URL('/api-catalog/prefetch', window.location.origin), async: true, prefetch: true };
    await act(async () => listeners.get('start')?.({ detail: { visit: prefetch } })); expect(cancel).not.toHaveBeenCalled();
    const detail = { url: new URL('/api-catalog/detail', window.location.origin), async: false, prefetch: false };
    await act(async () => listeners.get('start')?.({ detail: { visit: detail } })); expect(cancel).toHaveBeenCalled();
    window.history.replaceState({}, '', '/api-catalog/detail');
    await act(async () => listeners.get('finish')?.({ detail: { visit: detail } })); expect(visit).toHaveBeenCalledTimes(1);
});
