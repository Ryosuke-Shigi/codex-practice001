// @vitest-environment jsdom

import type { Page } from '@inertiajs/core';
import { act } from 'react';
import * as ReactDOM from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import type { LinksLauncherLink } from '@/Components/LinksLauncher/types';

vi.mock('react-dom/client', { spy: true });

const launcherUrl = '/portfolio/links-launcher';
const firstKey = '85120ed9-0e99-4ebd-b718-79d2ec92afae';
const selectedKey = 'fc17a8ad-71ee-4267-9b13-199de53588bd';
const savedUrl = launcherUrl + '?z=1&selectedLinkKey=' + selectedKey + '#section';
const responseUrl = launcherUrl + '?selectedLinkKey=' + selectedKey + '&z=1';
const sourceUrl = '/links-launchers/839ef2e9-2997-4cc8-8612-3a2f42005163';
const freshTitle = '現在公開されている作品一覧';
const savedTitle = '保存済みの作品一覧';
const loadApp = import.meta.glob('../app.tsx')['../app.tsx'];

const visibleLink: LinksLauncherLink = {
    linkKey: selectedKey,
    destinationUrl: '/projects?project=api-discovery-hub&view=stages',
    displayValues: {
        title: 'API Discovery Hub',
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

const freshPage: Page = {
    component: 'LinksLauncher/Show',
    url: responseUrl,
    version: 'current-build-manifest',
    clearHistory: false,
    encryptHistory: false,
    props: {
        errors: {},
        linksLauncher: {
            linksLauncherKey: 'a93e9333-f36b-4cb8-8b4d-9cbbb1a44973',
            title: freshTitle,
            description: null,
        },
        selectedLinkKey: selectedKey,
        linkList: {
            links: [
                {
                    ...visibleLink,
                    linkKey: firstKey,
                    destinationUrl: '/projects?project=dance-shorts-radar&view=stages',
                    displayValues: { ...visibleLink.displayValues, title: 'DanceShortsRadar' },
                },
                visibleLink,
            ],
        },
        navigation: { topUrl: '/' },
    },
    flash: {},
    rememberedState: {},
};

it('restores a marked launcher entry when a reload returns the same query in a different order', async () => {
    const nativeReplace = window.history.replaceState.bind(window.history);
    const nativePush = window.history.pushState.bind(window.history);
    const getEntries = Object.getOwnPropertyDescriptor(window.performance, 'getEntriesByType');
    Object.defineProperty(window.performance, 'getEntriesByType', {
        configurable: true,
        value: (entryType: string) => entryType === 'navigation' ? [{ type: 'reload' }] : [],
    });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) =>
        nativeReplace(structuredClone(data), unused, url));
    const pushes = vi.spyOn(window.history, 'pushState').mockImplementation((data, unused, url) =>
        nativePush(structuredClone(data), unused, url));

    window.history.replaceState(null, '', sourceUrl);
    window.history.pushState({
        page: {
            ...freshPage,
            url: savedUrl,
            props: {
                ...freshPage.props,
                linksLauncher: {
                    linksLauncherKey: 'a93e9333-f36b-4cb8-8b4d-9cbbb1a44973',
                    title: savedTitle,
                    description: null,
                },
                selectedLinkKey: firstKey,
            },
            rememberedState: { 'LinksLauncher:arrival': { url: savedUrl, sourceUrl } },
        },
    }, '', savedUrl);
    const entryCount = window.history.length;
    const pushCount = pushes.mock.calls.length;

    const host = document.createElement('div');
    host.id = 'app';
    host.dataset.page = JSON.stringify(freshPage);
    document.body.append(host);
    const windowAdds = vi.spyOn(window, 'addEventListener');
    const documentAdds = vi.spyOn(document, 'addEventListener');
    let stopNavigate: (() => void) | undefined;

    try {
        const { router } = await import('@inertiajs/react');
        let navigated = false;
        stopNavigate = router.on('navigate', ({ detail: { page } }) => {
            navigated ||= page.component === freshPage.component;
        });
        await act(async () => { await loadApp(); });
        const deadline = Date.now() + 5000;
        while (!navigated && Date.now() < deadline) {
            await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
        }
        expect(navigated, 'The reloaded app initialized with the fresh Inertia response').toBe(true);
        await act(async () => {
            await new Promise<number>((resolve) => window.requestAnimationFrame(resolve));
        });

        expect(host.querySelector('h1')?.textContent).toBe(freshTitle);
        const selected = host.querySelector('button[aria-label="API Discovery Hub"]');
        expect(selected).toBeInstanceOf(HTMLButtonElement);
        expect(document.activeElement).toBe(selected);
        expect(Array.from(host.querySelectorAll('a')).filter((a) => a.textContent?.trim() === 'TOPへ')).toHaveLength(1);
        expect.soft(Array.from(host.querySelectorAll('button')).some((button) => button.textContent?.trim() === '戻る'))
            .toBe(true);
        expect.soft(window.location.pathname + window.location.search + window.location.hash).toBe(savedUrl);
        expect.soft(window.history.state?.page).toMatchObject({
            url: savedUrl,
            rememberedState: { 'LinksLauncher:arrival': { url: savedUrl, sourceUrl } },
        });
        expect.soft(pushes).toHaveBeenCalledTimes(pushCount);
        expect.soft(window.history.length).toBe(entryCount);
    } finally {
        stopNavigate?.();
        const root = vi.mocked(ReactDOM.createRoot).mock.results[0]?.value;
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
        if (getEntries) {
            Object.defineProperty(window.performance, 'getEntriesByType', getEntries);
        } else {
            Reflect.deleteProperty(window.performance, 'getEntriesByType');
        }
        host.remove();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        window.history.replaceState(null, '', '/');
    }
}, 15000);
