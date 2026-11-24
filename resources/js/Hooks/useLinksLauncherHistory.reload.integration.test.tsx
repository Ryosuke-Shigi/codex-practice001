// @vitest-environment jsdom

import type { Page } from '@inertiajs/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

const selectedUrl = '/portfolio/links-launcher?selectedLinkKey=fc17a8ad-71ee-4267-9b13-199de53588bd';
const publicPage: Page = {
    component: 'LinksLauncher/Show',
    url: selectedUrl,
    version: null,
    clearHistory: false,
    encryptHistory: false,
    props: {
        errors: {},
        linksLauncher: {
            linksLauncherKey: 'a93e9333-f36b-4cb8-8b4d-9cbbb1a44973',
            title: '作品一覧',
            description: null,
        },
        selectedLinkKey: null,
        linkList: { links: [] },
        navigation: { topUrl: '/' },
    },
    flash: {},
    rememberedState: {},
};

it('keeps the TOP source in the replaced selection entry after a real Inertia reload initialization', async () => {
    const nativeReplace = window.history.replaceState.bind(window.history);
    const getEntries = Object.getOwnPropertyDescriptor(window.performance, 'getEntriesByType');
    Object.defineProperty(window.performance, 'getEntriesByType', {
        configurable: true,
        value: (entryType: string) => entryType === 'navigation' ? [{ type: 'reload' }] : [],
    });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) =>
        nativeReplace(structuredClone(data), unused, url));
    window.history.replaceState({
        page: {
            ...publicPage,
            rememberedState: { 'LinksLauncher:arrival': { url: selectedUrl, sourceUrl: '/' } },
        },
    }, '', selectedUrl);

    const host = document.createElement('div');
    host.id = 'links-launcher-reload-integration';
    document.body.append(host);
    const windowAdds = vi.spyOn(window, 'addEventListener');
    const documentAdds = vi.spyOn(document, 'addEventListener');
    const entryCount = window.history.length;
    let root: Root | undefined;

    try {
        const { createInertiaApp } = await import('@inertiajs/react');
        const { prepareLinksLauncherHistoryReload } = await import('./useLinksLauncherHistory');
        const { default: Show } = await import('@/Pages/LinksLauncher/Show');
        await act(async () => {
            await createInertiaApp({
                id: host.id,
                page: publicPage,
                progress: false,
                resolve: () => Show,
                setup({ el, App, props }) {
                    const initialPage = prepareLinksLauncherHistoryReload(props.initialPage);
                    root = createRoot(el);
                    root.render(<App {...props} initialPage={initialPage} />);
                },
            });
        });
        await vi.waitFor(async () => {
            await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
            expect(window.history.state?.page?.rememberedState).toHaveProperty('LinksLauncher:arrival');
        });

        expect(host.querySelector('h1')?.textContent).toBe('作品一覧');
        expect(Array.from(host.querySelectorAll('a')).filter((a) => a.textContent?.trim() === 'TOPへ')).toHaveLength(1);
        expect.soft(Array.from(host.querySelectorAll('button')).some((button) => button.textContent?.trim() === '戻る')).toBe(false);
        expect(window.history.state.page.rememberedState['LinksLauncher:arrival'])
            .toMatchObject({ url: selectedUrl, sourceUrl: '/' });
        expect(window.history.length).toBe(entryCount);
    } finally {
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
