// @vitest-environment jsdom

import axios, { AxiosHeaders } from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';

import type { LinksLauncherLink } from '@/Components/LinksLauncher/types';

vi.mock('@/Components/Effects/AquaParticlesBackground', () => ({ default: () => null }));

type Inertia = typeof import('@inertiajs/react');

const sourceUrl = '/fixture/source';
const stageUrl = '/projects?project=dance-shorts-radar&view=stages';
const sourceComponent = 'Fixture/Source';
const stageComponent = 'Projects/Select';
const launcherKey = '839ef2e9-2997-4cc8-8612-3a2f42005163';
const selectedKey = '167e7070-2ee9-4cb0-abb1-47e24ec65470';
const selectionQuery = '?selectedLinkKey=' + selectedKey;
const legacyUrl = '/links-lanchars/' + launcherKey + selectionQuery;
const canonicalUrl = '/links-launchers/' + launcherKey + selectionQuery;
const legacyHistoryKey = 'LinksLanchar:arrival';
const launcherPages = import.meta.glob('../Pages/{LinksLanchar,LinksLauncher,Projects}/*.tsx');

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
    const history = await import('./useLinksLauncherHistory');

    host = document.createElement('div');
    host.id = 'links-launcher-history-integration';
    document.body.append(host);
    const navigate = waitForNavigate(router, sourceUrl);
    await act(async () => {
        await createInertiaApp({
            id: 'links-launcher-history-integration',
            page: pageFixture(sourceComponent, sourceUrl),
            resolve: (name) => name !== sourceComponent
                ? resolvePageComponent('../Pages/' + name + '.tsx', launcherPages)
                : () => null,
            progress: false,
            setup({ el, App, props }) {
                stopObserving = history.observeLinksLauncherArrivals((page) =>
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
});

function prepareHistory() {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    emulateNativeHistoryCloning();
    window.history.replaceState(null, '', sourceUrl);
}

function serveStageResponse() {
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
    return requests;
}

function openCachedPage(
    router: Inertia['router'],
    page: ReturnType<typeof pageFixture>,
    visibleUrl: string,
) {
    const state = { page };
    const navigate = waitForNavigate(router, page.url);
    return act(async () => {
        // The browser moves its URL before delivering the saved Inertia entry.
        window.history.replaceState(state, '', visibleUrl);
        window.dispatchEvent(new PopStateEvent('popstate', { state }));
        await navigate;
    });
}

function cachedLauncher(markerUrl: string | null) {
    const selectedLink: LinksLauncherLink = {
        linkKey: selectedKey,
        destinationUrl: stageUrl,
        displayValues: {
            title: 'Dance Shorts Radar',
            description: null,
            selectionDisplayType: 'sphere',
            selectionImageSource: null,
            selectionImagePosterSource: null,
            sphereColor: '#4ade80',
            sphereShadowColor: null,
            iconImageSource: null,
            lucideIconName: null,
            backgroundColor: '#12201c',
            backgroundImageSource: null,
            backgroundImagePosterSource: null,
            backgroundImageEntranceAnimationName: null,
            backgroundEffectName: null,
            accentColor: '#fbbf24',
            textColor: '#f7fee7',
        },
    };
    return {
        ...pageFixture('LinksLanchar/Show', legacyUrl),
        props: {
            errors: {},
            navigation: { topUrl: '/' },
            linksLanchar: { linksLancharKey: launcherKey, title: '作品一覧', description: null },
            selectedLinkKey: selectedKey,
            linkList: {
                links: [
                    {
                        ...selectedLink,
                        linkKey: 'd65d315a-5898-4472-ab84-f110f1108138',
                        displayValues: { ...selectedLink.displayValues, title: '別の作品' },
                    },
                    selectedLink,
                ],
            },
        },
        rememberedState: markerUrl === null ? {} : { [legacyHistoryKey]: { url: markerUrl } },
    };
}

async function bootCachedPageTest() {
    prepareHistory();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: true,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
    })));
    const requests = serveStageResponse();
    return { router: await bootApp(), requests };
}

function launcherBack() {
    return Array.from(host?.querySelectorAll('button') ?? []).find((button) => button.textContent === '戻る');
}

function radarSelection() {
    return host?.querySelector<HTMLButtonElement>('button[aria-label="Dance Shorts Radar"]');
}

it('restores only matching pre-rename Inertia history and renders the saved unavailable page', async () => {
    const { router, requests } = await bootCachedPageTest();
    const pushCount = vi.mocked(window.history.pushState).mock.calls.length;
    await openCachedPage(router, cachedLauncher(legacyUrl), canonicalUrl);

    expect(host?.querySelector('h1')?.textContent).toBe('作品一覧');
    expect(launcherBack()).toBeDefined();
    expect(document.activeElement).toBe(radarSelection());
    expect(window.location.pathname + window.location.search).toBe(canonicalUrl);
    expect(window.history.pushState).toHaveBeenCalledTimes(pushCount);

    const arrived = waitForNavigate(router, stageUrl);
    await act(async () => {
        radarSelection()?.click();
        await arrived;
    });
    const stageBack = host?.querySelector<HTMLButtonElement>('button[aria-label="前の画面へ戻る"]');
    expect(stageBack).not.toBeNull();
    expect(document.activeElement).toBe(host?.querySelector('.project-stage-action'));
    expect(window.history.pushState).toHaveBeenCalledTimes(pushCount + 1);

    const returned = waitForNavigate(router, canonicalUrl);
    await act(async () => {
        stageBack?.click();
        await returned;
    });
    expect(window.location.pathname + window.location.search).toBe(canonicalUrl);
    expect(launcherBack()).toBeDefined();
    expect(document.activeElement).toBe(radarSelection());
    expect(window.history.pushState).toHaveBeenCalledTimes(pushCount + 1);
    expect(requests).toEqual([new URL(stageUrl, window.location.origin).href]);

    const invalidMarkers = [
        ['no marker', null],
        ['a different launcher UUID', '/links-lanchars/00000000-0000-4000-8000-000000000001' + selectionQuery],
        ['a different query', legacyUrl + '&project=different'],
        ['a different hash', legacyUrl + '#different'],
        ['a different origin', 'https://another.example' + legacyUrl],
    ] as const;
    for (const [label, markerUrl] of invalidMarkers) {
        await openCachedPage(router, cachedLauncher(markerUrl), canonicalUrl);
        expect.soft(radarSelection(), label).toBeInstanceOf(HTMLButtonElement);
        expect.soft(launcherBack(), label).toBeUndefined();
        expect.soft(requests, label).toEqual([new URL(stageUrl, window.location.origin).href]);
    }

    const page = pageFixture('LinksLanchar/Unavailable', legacyUrl);
    await openCachedPage(router, page, legacyUrl);
    expect(host?.querySelector('h1')?.textContent).toBe('現在 非公開');
    expect(radarSelection()).toBeNull();
    expect(requests).toEqual([new URL(stageUrl, window.location.origin).href]);
});
