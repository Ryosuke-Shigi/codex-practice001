// @vitest-environment jsdom

import axios, { AxiosHeaders } from 'axios';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';

type Inertia = typeof import('@inertiajs/react');
type HistoryEntry = {
    page?: {
        url?: string;
        rememberedState?: Record<string, unknown>;
    };
};

const sourceUrl = '/lab/dance-shorts-radar-mock';
const stageUrl = '/projects?project=dance-shorts-radar&view=stages';
const sourceComponent = 'Lab/DanceShortsRadarMock';
const stageComponent = 'Projects/Select';

let root: Root | undefined;
let host: HTMLDivElement | undefined;
let stopObserving: (() => void) | undefined;
let stopAppListeners: (() => void) | undefined;
const originalAdapter = axios.defaults.adapter;
const ownedCleanups: Array<() => void> = [];

function pageFixture(component: string, url: string) {
    return {
        component,
        url,
        version: null,
        props: { errors: {} },
        clearHistory: false,
        encryptHistory: false,
        flash: {},
        rememberedState: {},
    };
}

function emulateNativeHistoryCloning() {
    const pushState = window.history.pushState.bind(window.history);
    const replaceState = window.history.replaceState.bind(window.history);
    // jsdomは引数を参照のまま保持するため、ブラウザーと同様に書き込み時点の値を複製する。
    vi.spyOn(window.history, 'pushState').mockImplementation((data, unused, url) =>
        pushState(structuredClone(data), unused, url));
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) =>
        replaceState(structuredClone(data), unused, url));
}

function isStageArrival(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'url' in value && value.url === stageUrl;
}

function readPersistedArrivalKey(): string | undefined {
    const entry = window.history.state as HistoryEntry | null;
    expect(entry?.page?.url).toBe(stageUrl);
    return Object.entries(entry?.page?.rememberedState ?? {})
        .find(([, value]) => isStageArrival(value))?.[0];
}

function waitForNavigate(router: Inertia['router'], url: string): Promise<void> {
    return new Promise((resolve) => {
        const stop = router.on('navigate', ({ detail: { page } }) => {
            if (page.url === url) {
                stop();
                resolve();
            }
        });
        ownedCleanups.push(stop);
    });
}

function trackAppListeners(): () => void {
    const windowAdds = vi.spyOn(window, 'addEventListener');
    const documentAdds = vi.spyOn(document, 'addEventListener');

    return () => {
        for (const [type, listener, options] of windowAdds.mock.calls) {
            window.removeEventListener(type, listener, options);
        }
        for (const [type, listener, options] of documentAdds.mock.calls) {
            document.removeEventListener(type, listener, options);
        }
        windowAdds.mockRestore();
        documentAdds.mockRestore();
    };
}

function stopApp() {
    stopObserving?.();
    stopObserving = undefined;
    if (root !== undefined) {
        act(() => root?.unmount());
        root = undefined;
    }
    host?.remove();
    host = undefined;
    stopAppListeners?.();
    stopAppListeners = undefined;
}

async function bootApp() {
    stopAppListeners = trackAppListeners();
    const { createInertiaApp, router } = await import('@inertiajs/react');
    const history = await import('./useLinksLancharHistory');

    function BackProbe() {
        const canGoBack = history.default();
        return <output>{canGoBack ? '戻れる' : '戻れない'}</output>;
    }

    host = document.createElement('div');
    host.id = 'links-lanchar-history-integration';
    document.body.append(host);
    const navigate = waitForNavigate(router, sourceUrl);
    await act(async () => {
        await createInertiaApp({
            id: 'links-lanchar-history-integration',
            page: pageFixture(sourceComponent, sourceUrl),
            resolve: () => BackProbe,
            progress: false,
            setup({ el, App, props }) {
                stopObserving = history.observeLinksLancharArrivals((page) =>
                    page.component === stageComponent
                    && new URL(page.url, window.location.origin).searchParams.get('view') === 'stages');
                root = createRoot(el);
                root.render(<App {...props} />);
            },
        });
    });
    await act(async () => { await navigate; });
    return router;
}

afterEach(() => {
    stopApp();
    ownedCleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    axios.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
    vi.resetModules();
});

it('persists the stage arrival in browser history after a completed Inertia response', async () => {
    vi.resetModules();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    emulateNativeHistoryCloning();
    window.history.replaceState(null, '', sourceUrl);

    const requests: string[] = [];
    axios.defaults.adapter = async (config) => {
        const expected = new URL(stageUrl, window.location.origin).href;
        if (config.method !== 'get' || config.url !== expected) {
            throw new Error('The fixture only serves the exact stage GET.');
        }
        requests.push(config.url);
        return {
            config,
            data: JSON.stringify(pageFixture(stageComponent, stageUrl)),
            headers: new AxiosHeaders({ 'x-inertia': 'true' }),
            status: 200,
            statusText: 'OK',
            request: { responseURL: expected },
        };
    };

    const router = await bootApp();
    const remember = vi.spyOn(router, 'remember');
    const visitEvents: string[] = [];
    for (const event of ['beforeUpdate', 'navigate', 'success', 'finish'] as const) {
        ownedCleanups.push(router.on(event, () => { visitEvents.push(event); }));
    }
    await act(async () => {
        await new Promise<void>((resolve) => router.visit(stageUrl, { onFinish: () => resolve() }));
    });
    await act(async () => { await new Promise<void>((resolve) => setTimeout(resolve, 0)); });

    expect(requests).toHaveLength(1);
    expect(visitEvents).toEqual(['beforeUpdate', 'navigate', 'success', 'finish']);
    expect(host?.textContent).toBe('戻れる');
    const arrivalKey = remember.mock.calls.find(([value]) => isStageArrival(value))?.[1];
    expect(arrivalKey, 'The stage arrival should be remembered through the installed router.').toBeDefined();
    expect(isStageArrival(router.restore(arrivalKey))).toBe(true);
    expect(readPersistedArrivalKey(), 'The stage arrival should be written into native history.').toBe(arrivalKey);
});
