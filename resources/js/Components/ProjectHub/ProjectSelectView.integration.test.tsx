// @vitest-environment jsdom

import type { Page } from '@inertiajs/core';
import axios, { AxiosHeaders } from 'axios';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import type { LinksLauncherLink, LinksLauncherPageProps } from '@/Components/LinksLauncher/types';

vi.mock('@/Components/Effects/AquaParticlesBackground', () => ({ default: () => null }));
vi.mock('@inertiajs/react', async (importOriginal) => {
    const installed = await importOriginal<typeof import('@inertiajs/react')>();
    return { ...installed, createInertiaApp: vi.fn(installed.createInertiaApp) };
});
vi.mock('react-dom/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-dom/client')>();
    return {
        ...actual,
        createRoot(...args: Parameters<typeof actual.createRoot>) {
            root = actual.createRoot(...args);
            return root;
        },
    };
});

const loadApp = import.meta.glob('../../app.tsx')['../../app.tsx'];
const portfolioUrl = '/portfolio/links-launcher';
const radarUrl = portfolioUrl + '?project=dance-shorts-radar';
const logsUrl = portfolioUrl + '?project=logs';
const radarStageUrl = '/projects?project=dance-shorts-radar&view=stages';
const duplicateProjectUrl = '/projects?project=api-discovery-hub&project=dance-shorts-radar';
const reorderedStageUrl = '/projects?view=stages&project=dance-shorts-radar';
const initialSelection = link(
    'fc17a8ad-71ee-4267-9b13-199de53588bd',
    'API Discovery Hub',
    '/projects?project=api-discovery-hub&view=stages',
);
const radar = link('85120ed9-0e99-4ebd-b718-79d2ec92afae', 'DanceShortsRadar', radarStageUrl);
const logs = link('00000000-0000-4000-8000-000000000001', 'アプリログ', '/projects/logs');

let root: Root | undefined;

function link(linkKey: string, title: string, destinationUrl: string): LinksLauncherLink {
    return {
        linkKey, destinationUrl,
        displayValues: {
            title, description: null, selectionDisplayType: 'sphere',
            selectionImageSource: null, selectionImagePosterSource: null, sphereColor: '#4ade80',
            sphereShadowColor: null, iconImageSource: null, lucideIconName: null,
            backgroundColor: '#12201c', backgroundImageSource: null, backgroundImagePosterSource: null,
            backgroundImageEntranceAnimationName: null, backgroundEffectName: null,
            accentColor: '#fbbf24', textColor: '#f7fee7',
        },
    };
}

function page(component: string, url: string, props: Page['props'] = { errors: {} }): Page {
    return {
        component, url, props, version: null, clearHistory: false, encryptHistory: false,
        flash: {}, rememberedState: {},
    };
}

function launcher(url: string, selectedLinkKey: string | null) {
    const props: LinksLauncherPageProps = {
        linksLauncher: {
            linksLauncherKey: 'a93e9333-f36b-4cb8-8b4d-9cbbb1a44973',
            title: '作品一覧',
            description: null,
        },
        selectedLinkKey,
        linkList: { links: [initialSelection, radar, logs] },
        navigation: { topUrl: '/' },
    };
    return page('LinksLauncher/Show', url, { ...props, errors: {} });
}

function legacyPage(url: string) {
    return page('Projects/Select', url, { errors: {} });
}

async function withApp(
    browserUrl: string,
    initialPage: Page,
    previousPages: Page[],
    check: (
        host: HTMLDivElement,
        requests: string[],
        router: typeof import('@inertiajs/react').router,
        reduceMotion: () => void,
    ) => Promise<void>,
) {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const motionListeners = new Set<(event: MediaQueryListEvent) => void>();
    const motion = {
        matches: false,
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => motionListeners.add(listener),
        removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => motionListeners.delete(listener),
    };
    vi.stubGlobal('matchMedia', () => motion);
    function reduceMotion() {
        motion.matches = true;
        motionListeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    }
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const pushState = window.history.pushState.bind(window.history);
    const replaceState = window.history.replaceState.bind(window.history);
    vi.spyOn(window.history, 'pushState').mockImplementation((data, unused, url) =>
        pushState(structuredClone(data), unused, url));
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) =>
        replaceState(structuredClone(data), unused, url));
    const [first, ...rest] = previousPages;
    window.history.replaceState({ page: first }, '', first.url);
    for (const previousPage of rest) {
        window.history.pushState({ page: previousPage }, '', previousPage.url);
    }
    window.history.pushState(null, '', browserUrl);

    const responses = new Map([
        [portfolioUrl, launcher(portfolioUrl, null)],
        [radarUrl, launcher(radarUrl, radar.linkKey)],
        [logsUrl, launcher(logsUrl, logs.linkKey)],
        ['/projects', legacyPage('/projects')],
        ['/projects?project=logs', legacyPage('/projects?project=logs')],
        ['/projects?project=dance-shorts-radar', legacyPage('/projects?project=dance-shorts-radar')],
        [radarStageUrl, legacyPage(radarStageUrl)],
        [duplicateProjectUrl, legacyPage(duplicateProjectUrl)],
        [reorderedStageUrl, legacyPage(reorderedStageUrl)],
    ]);
    const requests: string[] = [];
    const originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
        const url = new URL(String(config.url));
        const requested = url.pathname + url.search;
        const response = responses.get(requested);
        requests.push(requested);
        if (config.method !== 'get' || url.origin !== window.location.origin || !response) {
            throw new Error('Unexpected Inertia request: ' + config.method + ' ' + url.href);
        }
        return {
            config,
            data: JSON.stringify(response),
            headers: new AxiosHeaders({ 'x-inertia': 'true' }),
            status: 200,
            statusText: 'OK',
            request: { responseURL: url.href },
        };
    };

    const host = document.createElement('div');
    host.id = 'app';
    const pageScript = document.createElement('script');
    pageScript.type = 'application/json';
    pageScript.dataset.page = host.id;
    pageScript.textContent = JSON.stringify(initialPage);
    document.body.append(pageScript, host);
    const windowAdds = vi.spyOn(window, 'addEventListener');
    const documentAdds = vi.spyOn(document, 'addEventListener');

    try {
        const { createInertiaApp, router } = await import('@inertiajs/react');
        const boot = vi.mocked(createInertiaApp);
        await act(async () => {
            await loadApp();
            expect(boot).toHaveBeenCalledTimes(1);
            await boot.mock.results[0].value;
        });
        await check(host, requests, router, reduceMotion);
    } finally {
        await act(async () => {
            root?.unmount();
            await new Promise<number>((resolve) => window.requestAnimationFrame(resolve));
        });
        root = undefined;
        for (const [type, listener, options] of windowAdds.mock.calls) {
            window.removeEventListener(type, listener, options);
        }
        for (const [type, listener, options] of documentAdds.mock.calls) {
            document.removeEventListener(type, listener, options);
        }
        host.remove();
        pageScript.remove();
        axios.defaults.adapter = originalAdapter;
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        window.history.replaceState(null, '', '/');
    }
}

async function waitForRender(assertion: () => void) {
    const deadline = Date.now() + 1800;
    while (true) {
        await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
        try {
            assertion();
            return;
        } catch (error) {
            if (Date.now() >= deadline) throw error;
        }
    }
}

function path() {
    return window.location.pathname + window.location.search + window.location.hash;
}

async function expectLauncher(host: HTMLDivElement, url: string, selected: LinksLauncherLink) {
    await waitForRender(() => {
        expect(path()).toBe(url);
        expect(window.history.state?.page?.component).toBe('LinksLauncher/Show');
        expect(host.querySelector('h1')?.textContent).toBe('作品一覧');
        const center = host.querySelector<HTMLButtonElement>('.links-launcher-selection');
        expect(center?.getAttribute('aria-label')).toBe(selected.displayValues.title);
        expect(document.activeElement).toBe(center);
        expect(host.querySelector('a.links-launcher-top')?.getAttribute('href')).toBe('/');
        expect(host.querySelector('.project-stage-action')).toBeNull();
    });
}

async function expectStage(host: HTMLDivElement) {
    await waitForRender(() => {
        expect(path()).toBe(radarStageUrl);
        const firstStage = host.querySelector('.project-stage-action');
        expect(firstStage?.getAttribute('aria-label')).toEqual(expect.stringMatching(/^PRODUCT:/));
        expect(document.activeElement).toBe(firstStage);
    });
}

it('migrates old list entries in the real app and restores work selection and focus', async () => {
    const oldRadar = '/projects?project=dance-shorts-radar';
    const oldLogs = '/projects?project=logs';
    // 旧版の応答で重複queryが正規化済みでも、直開きでは実URLを判定する。
    await withApp(duplicateProjectUrl, legacyPage(oldRadar), [
        legacyPage(oldRadar + '#stages'),
        legacyPage(oldRadar),
    ], async (host, requests, router, reduceMotion) => {
        await expectLauncher(host, portfolioUrl, initialSelection);
        expect(requests).toEqual([portfolioUrl]);
        expect(host.querySelector('.links-launcher-back')).toBeNull();
        const initialHistoryLength = window.history.length;

        // 保存済み旧Pageとpropsを戻る操作で復元し、新一覧への乗り換えで履歴を増やさない。
        await act(async () => { window.history.back(); });
        await expectLauncher(host, radarUrl, radar);
        expect(host.querySelector('.links-launcher-back')).toBeNull();
        expect(window.history.length).toBe(initialHistoryLength);
        expect(requests).toEqual([portfolioUrl, radarUrl]);

        // hash付きの旧履歴は作品IDを捨て、既定の選択で新一覧を開く。
        await act(async () => { window.history.back(); });
        await expectLauncher(host, portfolioUrl, initialSelection);
        expect(requests).toEqual([portfolioUrl, radarUrl, portfolioUrl]);
        expect(window.history.length).toBe(initialHistoryLength);

        await act(async () => { window.history.forward(); });
        await expectLauncher(host, radarUrl, radar);
        expect(requests).toEqual([portfolioUrl, radarUrl, portfolioUrl]);

        for (const [source, target, selected] of [
            ['/projects', portfolioUrl, initialSelection],
            [oldLogs, logsUrl, logs],
            [duplicateProjectUrl, portfolioUrl, initialSelection],
            [reorderedStageUrl + '#stages', portfolioUrl, initialSelection],
            [oldRadar, radarUrl, radar],
        ] as const) {
            const requestCount = requests.length;
            await act(async () => { router.visit(source); });
            await expectLauncher(host, target, selected);
            expect(requests.slice(requestCount)).toEqual([source.split('#')[0], target]);
        }

        for (const reduced of [false, true]) {
            if (reduced) {
                await act(async () => { reduceMotion(); });
            }
            const requestCount = requests.length;
            const center = host.querySelector<HTMLButtonElement>('.links-launcher-selection');
            await act(async () => { center?.click(); });
            await expectStage(host);
            const listReturn = host.querySelector<HTMLAnchorElement>('a[href="' + radarUrl + '"]');
            expect(listReturn?.textContent?.trim()).toBe('作品一覧へ');
            await act(async () => { listReturn?.click(); });
            await expectLauncher(host, radarUrl, radar);
            expect(host.querySelector('.links-launcher-back')?.textContent?.trim()).toBe('戻る');
            expect(requests.slice(requestCount)).toEqual([radarStageUrl, radarUrl]);

            await act(async () => { window.history.back(); });
            await expectStage(host);
            await act(async () => { window.history.forward(); });
            await expectLauncher(host, radarUrl, radar);
            expect(requests.slice(requestCount)).toEqual([radarStageUrl, radarUrl]);
        }
    });
}, 18000);
