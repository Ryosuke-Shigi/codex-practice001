// @vitest-environment jsdom

import type { Page } from '@inertiajs/core';
import { createInertiaApp, router } from '@inertiajs/react';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { act } from 'react';
import * as ReactDOM from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import type { LinksLauncherLink } from '@/Components/LinksLauncher/types';

vi.mock('@/Components/Effects/AquaParticlesBackground', () => ({ default: () => null }));
vi.mock('react-dom/client', { spy: true });
vi.mock('@inertiajs/react', async (importOriginal) => {
    const installed = await importOriginal<typeof import('@inertiajs/react')>();
    return { ...installed, createInertiaApp: vi.fn(installed.createInertiaApp) };
});

const previousVersion = 'old-build-manifest';
const currentVersion = 'current-build-manifest';
const stageUrl = '/projects?project=dance-shorts-radar&view=stages';
const launcherKey = '839ef2e9-2997-4cc8-8612-3a2f42005163';
const selectedKey = '167e7070-2ee9-4cb0-abb1-47e24ec65470';
const query = '?selectedLinkKey=' + selectedKey;
const oldUrl = '/links-lanchars/' + launcherKey + query;
const canonicalPath = '/links-launchers/' + launcherKey;
const newUrl = canonicalPath + query;
const unsortedQuery = '?z=1&selectedLinkKey=' + selectedKey;
const oldUrlWithUnsortedQuery = '/links-lanchars/' + launcherKey + unsortedQuery;
const newUrlWithUnsortedQuery = canonicalPath + unsortedQuery;
const oldUrlWithFragment = oldUrlWithUnsortedQuery + '#section';
const newUrlWithFragment = newUrlWithUnsortedQuery + '#section';
const sortedResponseUrl = newUrl + '&z=1';
const oldTitle = '改名前の保存済み作品';
const freshTitle = '現在公開されている作品';
const stagePage = { component: 'Projects/Select', url: stageUrl, version: currentVersion, props: { errors: {} } };
const loadApp = import.meta.glob('../app.tsx')['../app.tsx'];

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

const launcherProps = {
    errors: {},
    navigation: { topUrl: '/' },
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
};

type StaleEntry = {
    page: Pick<Page, 'component' | 'url' | 'version' | 'props' | 'rememberedState'>;
};

function staleEntry(marker: string | null, url = oldUrl): StaleEntry {
    return {
        page: {
            component: 'LinksLanchar/Show',
            url,
            version: previousVersion,
            props: {
                ...launcherProps,
                linksLanchar: { linksLancharKey: launcherKey, title: oldTitle, description: null },
            },
            rememberedState: marker === null ? {} : { 'LinksLanchar:arrival': { url: marker } },
        },
    };
}

function staleCanonicalEntry(sourceUrl: string): StaleEntry {
    return {
        page: {
            ...currentPage(true, newUrl),
            version: previousVersion,
            props: {
                ...launcherProps,
                linksLauncher: { linksLauncherKey: launcherKey, title: oldTitle, description: null },
            },
            rememberedState: { 'LinksLauncher:arrival': { url: newUrl, sourceUrl } },
        },
    };
}

function currentPage(isPublic: boolean, url: string) {
    return {
        component: isPublic ? 'LinksLauncher/Show' : 'LinksLauncher/Unavailable',
        url,
        version: currentVersion,
        props: isPublic ? {
            ...launcherProps,
            linksLauncher: { linksLauncherKey: launcherKey, title: freshTitle, description: null },
        } : { errors: {} },
    };
}

function waitForFinishedRequest(run: () => void) {
    return act(async () => {
        await new Promise<void>((resolve) => {
            const stop = router.on('finish', () => {
                stop();
                resolve();
            });
            run();
        });
    });
}

it('keeps matching arrival when stale history is replaced by the current public response', async () => {
    const host = document.createElement('div');
    host.id = 'app';
    host.dataset.page = JSON.stringify(stagePage);
    document.body.append(host);

    const originalAdapter = axios.defaults.adapter;
    const requests: Array<{ url: string | undefined; method: string | undefined; version: unknown; inertia: unknown }> = [];
    let isPublic = true;
    axios.defaults.adapter = async (config) => {
        requests.push({
            url: config.url,
            method: config.method,
            version: config.headers.get('X-Inertia-Version'),
            inertia: config.headers.get('X-Inertia'),
        });
        // As with a same-origin 302 followed by XHR, Inertia receives the terminal
        // canonical response. The legacy redirect itself is covered by the PHP test.
        // Laravel serializes the Inertia Page URL with sorted query keys and no fragment.
        const requestedPath = new URL(String(config.url), window.location.origin);
        const receivesSortedQuery = [oldUrlWithUnsortedQuery, newUrlWithUnsortedQuery]
            .includes(requestedPath.pathname + requestedPath.search);
        const serverPageUrl = receivesSortedQuery ? sortedResponseUrl : newUrl;
        const response = {
            config,
            data: JSON.stringify(currentPage(isPublic, serverPageUrl)),
            headers: new AxiosHeaders({ 'x-inertia': 'true' }),
            status: isPublic ? 200 : 404,
            statusText: isPublic ? 'OK' : 'Not Found',
            request: { responseURL: new URL(
                receivesSortedQuery ? newUrlWithUnsortedQuery : newUrl,
                window.location.origin,
            ).href },
        };
        if (!isPublic) {
            throw new AxiosError('Request failed with status code 404', AxiosError.ERR_BAD_REQUEST, config, response.request, response);
        }
        return response;
    };

    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: true,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
    })));
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const pushState = window.history.pushState.bind(window.history);
    const replaceState = window.history.replaceState.bind(window.history);
    const pushes = vi.spyOn(window.history, 'pushState').mockImplementation((data, unused, url) =>
        pushState(structuredClone(data), unused, url));
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) =>
        replaceState(structuredClone(data), unused, url));
    const createRoot = vi.mocked(ReactDOM.createRoot);
    const windowAdds = vi.spyOn(window, 'addEventListener');
    const documentAdds = vi.spyOn(document, 'addEventListener');

    let staleContentMounted = false;
    const observer = new MutationObserver((records) => {
        staleContentMounted ||= records.some((record) => [...record.addedNodes, ...record.removedNodes]
            .some((node) => node.textContent?.includes(oldTitle)));
    });
    observer.observe(host, { childList: true, subtree: true });

    const backButton = () => Array.from(host.querySelectorAll('button')).find((button) => button.textContent === '戻る');
    const selection = () => host.querySelector('button[aria-label="Dance Shorts Radar"]');
    const replayEntry = (state: StaleEntry) => waitForFinishedRequest(() => {
        window.history.replaceState(state, '', state.page.url);
        window.dispatchEvent(new PopStateEvent('popstate', { state }));
    });
    const replayStaleEntry = (marker: string | null, url = oldUrl) => replayEntry(staleEntry(marker, url));

    try {
        window.history.replaceState(staleEntry(oldUrl), '', oldUrl);
        window.history.pushState({ page: stagePage }, '', stageUrl);
        await act(async () => {
            await loadApp();
            expect(createInertiaApp).toHaveBeenCalledTimes(1);
            await vi.mocked(createInertiaApp).mock.results[0].value;
        });
        expect(host.querySelector('.project-stage-action')).not.toBeNull();
        const pushCount = pushes.mock.calls.length;
        const entryCount = window.history.length;
        await waitForFinishedRequest(() => window.history.back());

        expect(host.querySelector('h1')?.textContent).toBe(freshTitle);
        expect(window.location.pathname + window.location.search).toBe(newUrl);
        expect(window.history.state.page).toMatchObject({
            component: 'LinksLauncher/Show',
            version: currentVersion,
            url: newUrl,
        });
        expect(selection()).toBeInstanceOf(HTMLButtonElement);
        expect(document.activeElement).toBe(selection());
        expect.soft(backButton(), 'Back should survive refresh of the marked history entry').toBeDefined();
        expect(pushes).toHaveBeenCalledTimes(pushCount);
        expect(window.history.length).toBe(entryCount);

        for (const [label, marker] of [
            ['no marker', null],
            ['another UUID', '/links-lanchars/00000000-0000-4000-8000-000000000001' + query],
            ['another query', oldUrl + '&project=another'],
            ['another hash', oldUrl + '#another'],
            ['another origin', 'https://another.example' + oldUrl],
        ] as const) {
            await replayStaleEntry(marker);
            expect(host.querySelector('h1')?.textContent, label).toBe(freshTitle);
            expect.soft(backButton(), label).toBeUndefined();
        }

        isPublic = false;
        await replayStaleEntry(oldUrl);
        expect(host.querySelector('h1')?.textContent).toBe('現在 非公開');
        expect(selection()).toBeNull();
        expect(backButton()).toBeUndefined();

        isPublic = true;
        await replayStaleEntry(oldUrlWithFragment, oldUrlWithFragment);
        expect(host.querySelector('h1')?.textContent).toBe(freshTitle);
        expect(selection()).toBeInstanceOf(HTMLButtonElement);
        expect(document.activeElement).toBe(selection());
        const { pathname, search, hash } = window.location;
        expect.soft(pathname + search + hash, 'Preserve the original query order and fragment').toBe(newUrlWithFragment);
        expect.soft(window.history.state.page).toMatchObject({
            component: 'LinksLauncher/Show',
            version: currentVersion,
            url: newUrlWithFragment,
        });
        expect.soft(backButton(), 'Back should survive a normalized response URL').toBeDefined();

        const otherLauncher = '/links-launchers/00000000-0000-4000-8000-000000000001';
        for (const [sourceUrl, showsBack] of [[otherLauncher, true], ['/', false]] as const) {
            await replayEntry(staleCanonicalEntry(sourceUrl));
            expect(host.querySelector('h1')?.textContent).toBe(freshTitle);
            expect(document.activeElement).toBe(selection());
            expect.soft(Boolean(backButton()), `Back visibility after updating an entry from ${sourceUrl}`).toBe(showsBack);
            expect.soft(window.history.state.page.rememberedState?.['LinksLauncher:arrival'])
                .toMatchObject({ url: newUrl, sourceUrl });
        }

        // Inertia preserves state when the viewed and refreshed components match.
        // A marker for the sorted response never belonged to this unsorted history entry.
        await replayEntry({
            page: {
                ...staleCanonicalEntry(otherLauncher).page,
                url: newUrlWithUnsortedQuery,
                rememberedState: {
                    'LinksLauncher:arrival': { url: sortedResponseUrl, sourceUrl: otherLauncher },
                    'LinksLanchar:arrival': { url: sortedResponseUrl },
                    'Fixture:remembered': { value: 'keep' },
                },
            },
        });
        expect(host.querySelector('h1')?.textContent).toBe(freshTitle);
        expect.soft(backButton(), 'The sorted response must not activate a mismatched saved mark').toBeUndefined();
        const persisted = window.history.state.page.rememberedState;
        expect.soft(persisted).not.toHaveProperty('LinksLauncher:arrival');
        expect.soft(persisted).not.toHaveProperty('LinksLanchar:arrival');
        expect.soft(persisted?.['Fixture:remembered']).toEqual({ value: 'keep' });

        isPublic = false;
        await replayEntry(staleCanonicalEntry(otherLauncher));
        expect(host.querySelector('h1')?.textContent).toBe('現在 非公開');
        expect(backButton()).toBeUndefined();

        expect(staleContentMounted).toBe(false);
        expect(requests).toEqual([
            ...Array.from({ length: 7 }, () => oldUrl),
            oldUrlWithUnsortedQuery, newUrl, newUrl, newUrlWithUnsortedQuery, newUrl,
        ].map((url) => ({
            url: new URL(url, window.location.origin).href,
            method: 'get',
            version: currentVersion,
            inertia: 'true',
        })));
        expect(pushes).toHaveBeenCalledTimes(pushCount);
        expect(window.history.length).toBe(entryCount);
    } finally {
        observer.disconnect();
        const root = createRoot.mock.results[0]?.value;
        await act(async () => {
            root?.unmount();
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
}, 15000);
