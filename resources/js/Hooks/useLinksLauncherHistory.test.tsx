// @vitest-environment jsdom

import type { Page } from '@inertiajs/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useLinksLauncherHistory, {
    observeLinksLauncherArrivals,
    prepareLinksLauncherHistoryReload,
} from './useLinksLauncherHistory';

const inertia = vi.hoisted(() => ({
    remembered: new Map<string, unknown>(),
}));

vi.mock('@inertiajs/react', () => ({
    router: {
        remember: (value: unknown, key: string) => inertia.remembered.set(key, value),
        restore: (key: string) => inertia.remembered.get(key),
        on: (event: string, listener: EventListener) => {
            const eventType = 'inertia:' + event;
            document.addEventListener(eventType, listener);
            return () => document.removeEventListener(eventType, listener);
        },
    },
    usePage: () => ({ url: window.location.pathname + window.location.search }),
}));

const targetPage = { component: 'Fixture/Target', url: '/fixture/target?selection=one' };
const otherPage = { component: 'Fixture/Other', url: '/fixture/other' };

let host: HTMLDivElement;
let root: Root;
let stopObserving: () => void;

function BackProbe() {
    const canGoBack = useLinksLauncherHistory();
    return <output>{canGoBack ? '戻れる' : '戻れない'}</output>;
}

function dispatch(event: string, detail: Record<string, unknown>) {
    act(() => document.dispatchEvent(new CustomEvent('inertia:' + event, { detail })));
}

function navigate(page: typeof targetPage, actualUrl = page.url) {
    window.history.pushState(null, '', actualUrl);
    dispatch('navigate', { page });
}

describe('LinksLauncher history arrival observation', () => {
    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        inertia.remembered.clear();
        window.history.replaceState(null, '', '/fixture/source');
        host = document.createElement('div');
        document.body.appendChild(host);
        root = createRoot(host);
        stopObserving = observeLinksLauncherArrivals((page) => page.component === targetPage.component);
        act(() => root.render(<BackProbe />));
    });

    afterEach(() => {
        stopObserving();
        act(() => root.unmount());
        host.remove();
        window.history.replaceState(null, '', '/');
        vi.unstubAllGlobals();
    });

    it('enables back after the matching page update arrives, even without a visit start', () => {
        dispatch('beforeUpdate', { page: targetPage });
        expect(host.textContent).toBe('戻れない');

        navigate(targetPage);
        dispatch('success', { page: targetPage });

        expect(host.textContent).toBe('戻れる');
    });

    it('ignores a navigate event without a preceding page update', () => {
        navigate(targetPage);

        expect(host.textContent).toBe('戻れない');
    });

    it('does not treat a prefetch start as an arrival', () => {
        dispatch('start', { visit: { url: new URL(targetPage.url, window.location.origin), prefetch: true } });
        navigate(targetPage);

        expect(host.textContent).toBe('戻れない');
    });

    it('keeps a pending arrival when an unrelated page reports success', () => {
        dispatch('beforeUpdate', { page: targetPage });
        dispatch('success', { page: otherPage });

        navigate(targetPage);
        dispatch('success', { page: targetPage });

        expect(host.textContent).toBe('戻れる');
    });

    it('requires navigate to carry the same page object as the update', () => {
        dispatch('beforeUpdate', { page: targetPage });

        navigate({ ...targetPage });
        dispatch('success', { page: targetPage });

        expect(host.textContent).toBe('戻れない');
    });

    it('requires the browser URL to match the arriving page', () => {
        dispatch('beforeUpdate', { page: targetPage });

        navigate(targetPage, '/fixture/target?selection=two');
        dispatch('success', { page: targetPage });

        expect(host.textContent).toBe('戻れない');
    });

    it.each(['replacement success', 'error', 'non-target update', 'dispose'] as const)(
        'clears a pending arrival after %s',
        (outcome) => {
            dispatch('beforeUpdate', { page: targetPage });

            switch (outcome) {
                case 'replacement success':
                    dispatch('success', { page: targetPage });
                    break;
                case 'error':
                    dispatch('error', { errors: {} });
                    break;
                case 'non-target update':
                    dispatch('beforeUpdate', { page: otherPage });
                    break;
                case 'dispose':
                    stopObserving();
                    break;
            }
            navigate(targetPage);
            dispatch('success', { page: targetPage });

            expect(host.textContent).toBe('戻れない');
        },
    );
});

describe('LinksLauncher reload arrival boundary', () => {
    const path = '/portfolio/links-launcher';
    const browserUrl = path + '?z=%20&tag=one&tag=two#section';
    const normalizedResponse = path + '?tag=one&tag=two&z=+';
    const arrivalKey = 'LinksLauncher:arrival';
    let originalGetEntries: PropertyDescriptor | undefined;

    beforeEach(() => {
        originalGetEntries = Object.getOwnPropertyDescriptor(window.performance, 'getEntriesByType');
        Object.defineProperty(window.performance, 'getEntriesByType', {
            configurable: true,
            value: () => [{ type: 'reload' }],
        });
    });

    afterEach(() => {
        if (originalGetEntries) {
            Object.defineProperty(window.performance, 'getEntriesByType', originalGetEntries);
        } else {
            Reflect.deleteProperty(window.performance, 'getEntriesByType');
        }
        inertia.remembered.clear();
        window.history.replaceState(null, '', '/');
    });

    it.each([
        ['another launcher', '/links-launchers/00000000-0000-4000-8000-000000000001?tag=one&tag=two&z=+', browserUrl],
        ['a different selection value', path + '?tag=one&tag=three&z=+', browserUrl],
        ['a different order of values for the same key', path + '?tag=two&tag=one&z=+', browserUrl],
        ['a different count of values for the same key', path + '?tag=one&z=+', browserUrl],
        ['a different explicit fragment', normalizedResponse + '#different', browserUrl],
        ['a mark matching only the normalized URL', normalizedResponse, normalizedResponse + '#section'],
    ])('keeps the fresh response and drops the arrival for %s', (_, responseUrl, markedUrl) => {
        const initialPage: Page = {
            component: 'LinksLauncher/Show',
            url: responseUrl,
            version: 'current-build',
            clearHistory: false,
            encryptHistory: false,
            props: { errors: {} },
            flash: {},
            rememberedState: {},
        };
        const mark = { url: markedUrl, sourceUrl: '/another-screen' };
        window.history.replaceState({
            page: { ...initialPage, url: browserUrl, rememberedState: { [arrivalKey]: mark } },
        }, '', browserUrl);
        inertia.remembered.set(arrivalKey, mark);

        const prepared = prepareLinksLauncherHistoryReload(initialPage);

        // Inertia clears remembered state before its first navigate on reload.
        inertia.remembered.clear();
        window.history.replaceState({ page: prepared }, '', prepared.url);
        document.dispatchEvent(new CustomEvent('inertia:navigate', { detail: { page: prepared } }));

        expect(prepared.url).toBe(responseUrl);
        expect(inertia.remembered.has(arrivalKey)).toBe(false);
    });
});
