// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useApiCatalogSync } from './useApiCatalogSync';
import type { ApiCatalogSyncStatus } from '../types';
const { post, get, reload } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), reload: vi.fn() }));
vi.mock('axios', () => ({ default: { post, get } }));
vi.mock('@inertiajs/react', () => ({ router: { reload } }));
const queued: ApiCatalogSyncStatus = { id: 9, status: 'queued', isRunning: true, isStale: false,
    result: { totalCount: 0, insertedCount: 0, updatedCount: 0, skippedCount: 0, inactiveCount: 0, failedCount: 0 },
    errorMessage: null, startedAt: null, finishedAt: null, createdAt: null, updatedAt: null };
let host: HTMLDivElement; let root: Root;
const onPagination = vi.fn();
function Harness({ initial = null }: { initial?: ApiCatalogSyncStatus | null }) {
    const sync = useApiCatalogSync({ initialSyncStatus: initial, getReturnUrl: () => '/api-catalog', onPaginationReloaded: onPagination });
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
    expect(get).toHaveBeenCalledTimes(1); expect(reload).toHaveBeenCalledTimes(1);
    expect(reload.mock.calls[0][0].only).toEqual(['filters', 'apiCatalogItems', 'pagination', 'syncStatus']);
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
