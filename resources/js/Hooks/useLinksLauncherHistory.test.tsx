// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useLinksLauncherHistory, { observeLinksLauncherArrivals } from './useLinksLauncherHistory';

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
