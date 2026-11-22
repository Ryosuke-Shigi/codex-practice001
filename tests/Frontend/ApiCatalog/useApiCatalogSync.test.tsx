// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useApiCatalogSync } from '@/Pages/ApiCatalog/hooks/useApiCatalogSync';
import type { ApiCatalogSyncStatus } from '@/Pages/ApiCatalog/types';
const { post, get, visit } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), visit: vi.fn() }));
vi.mock('axios', () => ({ default: { post, get } }));
vi.mock('@inertiajs/react', () => ({ router: { visit } }));
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
    vi.useFakeTimers(); vi.clearAllMocks(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
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
