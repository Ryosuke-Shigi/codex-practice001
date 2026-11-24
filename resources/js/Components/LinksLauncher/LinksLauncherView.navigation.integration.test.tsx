// @vitest-environment jsdom

import type { Page } from '@inertiajs/core';
import { createInertiaApp, router } from '@inertiajs/react';
import axios, { AxiosHeaders } from 'axios';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import type { LinksLauncherLink, LinksLauncherPageProps } from './types';
import { observeLinksLauncherArrivals } from '@/Hooks/useLinksLauncherHistory';
import type { ApiCatalogIndexProps } from '@/Pages/ApiCatalog/types';

vi.mock('@/Components/Effects/AquaParticlesBackground', () => ({ default: () => null }));
vi.mock('@/Components/Effects/EffectPatternSelector', () => ({ default: () => null }));
vi.mock('@/Components/Effects/EffectLayer', () => ({
    default: () => null,
    defaultEffectName: 'water',
    effectLabels: { water: 'Water' },
    readPreferredEffectName: () => 'water',
    resolveEffectName: (name: string) => name,
    storePreferredEffectName: () => undefined,
}));

const pages = import.meta.glob('../../Pages/{Welcome,Projects/Select,LinksLauncher/Show,ApiCatalog/Index,ApiCatalog/MockIndex,Lab/ApiDiscoveryHubPp}.tsx');
const portfolioUrl = '/portfolio/links-launcher';
const portfolioKey = 'a93e9333-f36b-4cb8-8b4d-9cbbb1a44973';
const apiKey = 'fc17a8ad-71ee-4267-9b13-199de53588bd';
const nestedLinkKey = '00000000-0000-4000-8000-000000000001';
const nestedLauncherKey = '00000000-0000-4000-8000-000000000002';
const nestedReturnKey = '00000000-0000-4000-8000-000000000003';
const selectedNestedUrl = portfolioUrl + '?selectedLinkKey=' + nestedLinkKey;
const nestedUrl = '/links-launchers/' + nestedLauncherKey;
const stageUrl = '/projects?project=api-discovery-hub&view=stages';
const listReturnUrl = portfolioUrl + '?project=api-discovery-hub';

const stages = [
    { label: 'MOCK', url: '/api-catalog/mock', component: 'ApiCatalog/MockIndex' },
    { label: 'IDEA BOARD', url: '/lab/api-discovery-hub-idea-board', component: 'Lab/ApiDiscoveryHubPp' },
    { label: 'PRODUCT', url: '/api-catalog', component: 'ApiCatalog/Index' },
];

function page(url: string, component: string, props: Page['props'] = { errors: {} }): Page {
    return {
        component, url, props, version: null,
        clearHistory: false, encryptHistory: false, flash: {}, rememberedState: {},
    };
}

function link(linkKey: string, title: string, destinationUrl: string): LinksLauncherLink {
    return {
        linkKey,
        destinationUrl,
        displayValues: {
            title,
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
}

function launcher(url: string, id: string, title: string, links: LinksLauncherLink[], selectedLinkKey: string) {
    const props: LinksLauncherPageProps = {
        linksLauncher: { linksLauncherKey: id, title, description: null },
        selectedLinkKey,
        linkList: { links },
        navigation: { topUrl: '/' },
    };
    return page(url, 'LinksLauncher/Show', { ...props, errors: {} });
}

const apiCatalogProps: ApiCatalogIndexProps = {
    filters: { keyword: null, providerKey: null, domain: null, sortKey: 'updated_desc' },
    providers: [],
    domains: [],
    apiCatalogItems: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0, perPage: 20, from: null, to: null },
    syncStatus: null,
};

async function waitForRender(assertion: () => void) {
    const deadline = Date.now() + 3000;
    while (true) {
        await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
        try {
            assertion();
            return;
        } catch (error) {
            if (Date.now() >= deadline) throw error;
        }
    }
}

it('separates same-URL launcher entries and returns from each API Discovery Hub stage to the selected work', async () => {
    const host = document.createElement('div');
    host.id = 'portfolio-return-integration';
    document.body.append(host);
    const originalAdapter = axios.defaults.adapter;
    const requests: string[] = [];
    const portfolioLinks = [
        link(apiKey, 'API Discovery Hub', stageUrl),
        link(nestedLinkKey, '次の一覧を開く', nestedUrl),
    ];
    const responses = new Map([
        [portfolioUrl, launcher(portfolioUrl, portfolioKey, '作品一覧', portfolioLinks, apiKey)],
        [selectedNestedUrl, launcher(selectedNestedUrl, portfolioKey, '作品一覧', portfolioLinks, nestedLinkKey)],
        [nestedUrl, launcher(nestedUrl, nestedLauncherKey, '別の一覧', [
            link(nestedReturnKey, '元の一覧を開く', selectedNestedUrl),
        ], nestedReturnKey)],
        [stageUrl, page(stageUrl, 'Projects/Select')],
        [listReturnUrl, launcher(listReturnUrl, portfolioKey, '作品一覧', portfolioLinks, apiKey)],
        ...stages.map(({ url, component }) => [url, page(url, component,
            component === 'ApiCatalog/Index' ? { ...apiCatalogProps, errors: {} } : undefined,
        )] as const),
    ]);

    axios.defaults.adapter = async (config) => {
        const requested = new URL(String(config.url));
        const localUrl = requested.pathname + requested.search;
        const response = responses.get(localUrl);
        if (config.method !== 'get' || requested.origin !== window.location.origin || !response) {
            throw new Error('Unexpected request: ' + config.method + ' ' + config.url);
        }
        requests.push(localUrl);
        return {
            config,
            data: JSON.stringify(response),
            headers: new AxiosHeaders({ 'x-inertia': 'true' }),
            status: 200,
            statusText: 'OK',
            request: { responseURL: requested.href },
        };
    };

    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    let reduced = false;
    vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: reduced,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
    })));
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const pushState = window.history.pushState.bind(window.history);
    const replaceState = window.history.replaceState.bind(window.history);
    vi.spyOn(window.history, 'pushState').mockImplementation((data, unused, url) =>
        pushState(structuredClone(data), unused, url));
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) =>
        replaceState(structuredClone(data), unused, url));
    const windowAdds = vi.spyOn(window, 'addEventListener');
    const documentAdds = vi.spyOn(document, 'addEventListener');
    window.history.replaceState(null, '', '/');

    let root: Root | undefined;
    let stopObserving: (() => void) | undefined;
    let initialized = false;
    const stopInitial = router.on('navigate', ({ detail: { page } }) => {
        if (page.url === '/') initialized = true;
    });
    function button(label: string) {
        return Array.from(host.querySelectorAll('button')).find((candidate) =>
            (candidate.getAttribute('aria-label') ?? candidate.textContent?.trim()) === label);
    }
    function anchor(label: string) {
        return Array.from(host.querySelectorAll('a')).find((candidate) =>
            candidate.textContent?.trim() === label);
    }
    async function click(target: HTMLElement | undefined) {
        expect(target).toBeDefined();
        await act(async () => { target?.click(); });
    }
    async function waitForInertia(
        trigger: () => void,
        subscribe: (done: () => void) => () => void,
        url: string,
    ) {
        await act(async () => {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    stop();
                    reject(new Error('Inertia did not settle for ' + url));
                }, 5000);
                const stop = subscribe(() => {
                    stop();
                    clearTimeout(timeout);
                    resolve();
                });
                trigger();
            });
        });
    }
    async function clickVisit(target: HTMLElement | undefined, url: string) {
        expect(target).toBeDefined();
        await waitForInertia(() => target?.click(), (done) => router.on('finish', ({ detail: { visit } }) => {
            if (visit.url.pathname + visit.url.search === url) done();
        }), url);
    }
    async function restore(trigger: () => void, url: string) {
        await waitForInertia(trigger, (done) => router.on('navigate', ({ detail: { page } }) => {
            if (page.url === url) done();
        }), url);
    }
    function expectUrl(url: string) {
        expect(window.location.pathname + window.location.search).toBe(url);
    }
    async function expectLauncher(url: string, selection: string, showsBack: boolean) {
        await waitForRender(() => {
            expectUrl(url);
            expect(button(selection)).toBeInstanceOf(HTMLButtonElement);
            expect(document.activeElement).toBe(button(selection));
        });
        expect(Array.from(host.querySelectorAll('a')).filter((a) => a.textContent?.trim() === 'TOPへ')).toHaveLength(1);
        expect.soft(Boolean(button('戻る')), 'History Back on ' + url).toBe(showsBack);
    }

    try {
        await act(async () => {
            await createInertiaApp({
                id: host.id,
                page: page('/', 'Welcome'),
                progress: false,
                resolve: (name) => pages['../../Pages/' + name + '.tsx'](),
                setup({ el, App, props }) {
                    stopObserving = observeLinksLauncherArrivals(({ component }) => component === 'LinksLauncher/Show');
                    root = createRoot(el);
                    root.render(<App {...props} />);
                },
            });
        });
        await waitForRender(() => {
            expect(initialized).toBe(true);
            expect(anchor('START')).toBeInstanceOf(HTMLAnchorElement);
        });

        await clickVisit(anchor('START'), portfolioUrl);
        await expectLauncher(portfolioUrl, 'API Discovery Hub', false);
        const afterStart = window.history.length;
        await click(button('次のリンク'));
        await expectLauncher(selectedNestedUrl, '次の一覧を開く', false);
        expect(window.history.length).toBe(afterStart);

        await clickVisit(button('次の一覧を開く'), nestedUrl);
        await expectLauncher(nestedUrl, '元の一覧を開く', true);
        await clickVisit(button('元の一覧を開く'), selectedNestedUrl);
        await expectLauncher(selectedNestedUrl, '次の一覧を開く', true);
        const afterNested = window.history.length;
        expect(afterNested).toBe(afterStart + 2);

        expect(button('戻る')).toBeDefined();
        await restore(() => button('戻る')?.click(), nestedUrl);
        await expectLauncher(nestedUrl, '元の一覧を開く', true);
        expect(button('戻る')).toBeDefined();
        await restore(() => button('戻る')?.click(), selectedNestedUrl);
        await expectLauncher(selectedNestedUrl, '次の一覧を開く', false);
        await restore(() => window.history.forward(), nestedUrl);
        await expectLauncher(nestedUrl, '元の一覧を開く', true);
        await restore(() => window.history.forward(), selectedNestedUrl);
        await expectLauncher(selectedNestedUrl, '次の一覧を開く', true);
        expect(window.history.length).toBe(afterNested);
        expect(requests).toEqual([portfolioUrl, nestedUrl, selectedNestedUrl]);

        await click(button('前のリンク'));
        await expectLauncher(portfolioUrl + '?selectedLinkKey=' + apiKey, 'API Discovery Hub', true);

        for (const value of [false, true]) {
            reduced = value;
            for (const { label, url } of stages) {
                await clickVisit(button('API Discovery Hub'), stageUrl);
                await waitForRender(() => {
                    expectUrl(stageUrl);
                    expect(document.activeElement).toBe(host.querySelector('.project-stage-action'));
                });
                const stageButton = Array.from(host.querySelectorAll('button')).find((candidate) =>
                    candidate.getAttribute('aria-label')?.startsWith(label + ':'));
                await clickVisit(stageButton, url);
                const returnToStages = () => Array.from(host.querySelectorAll('a')).find((candidate) =>
                    candidate.getAttribute('aria-label') === 'API Discovery Hubの開発段階へ戻る');
                await waitForRender(() => {
                    expectUrl(url);
                    expect(returnToStages()?.getAttribute('href')).toBe(stageUrl);
                });
                await clickVisit(returnToStages(), stageUrl);
                await waitForRender(() => {
                    expectUrl(stageUrl);
                    expect(document.activeElement).toBe(host.querySelector('.project-stage-action'));
                });
                expect(anchor('作品一覧へ')?.getAttribute('href')).toBe(listReturnUrl);
                await clickVisit(anchor('作品一覧へ'), listReturnUrl);
                await expectLauncher(listReturnUrl, 'API Discovery Hub', true);
            }
        }

        expect(requests).toEqual([
            portfolioUrl, nestedUrl, selectedNestedUrl,
            ...[false, true].flatMap(() => stages.flatMap(({ url }) => [stageUrl, url, stageUrl, listReturnUrl])),
        ]);
    } finally {
        stopInitial();
        stopObserving?.();
        await act(async () => {
            root?.unmount();
            // A restored history entry schedules scroll restoration for the next frame.
            await new Promise<number>((resolve) => window.requestAnimationFrame(resolve));
        });
        for (const [type, listener, options] of windowAdds.mock.calls) {
            window.removeEventListener(type, listener, options);
        }
        for (const [type, listener, options] of documentAdds.mock.calls) {
            document.removeEventListener(type, listener, options);
        }
        host.remove();
        axios.defaults.adapter = originalAdapter;
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        window.history.replaceState(null, '', '/');
    }
}, 20000);
