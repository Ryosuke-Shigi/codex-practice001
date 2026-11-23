// @vitest-environment jsdom

import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { observeLinksLauncherArrivals } from '@/Hooks/useLinksLauncherHistory';
import Select from '@/Pages/Projects/Select';

vi.mock('@/Components/Effects/AquaParticlesBackground', () => ({ default: () => null }));

let root: Root | undefined;
let host: HTMLDivElement | undefined;
let stopObserving: (() => void) | undefined;
let stopListeners: (() => void) | undefined;
let restoreHttpAdapter: (() => void) | undefined;
let fixture: Awaited<ReturnType<typeof boot>>;

function pageFixture(url: string) {
    return {
        component: 'Projects/Select', url, version: null, props: { errors: {} },
        clearHistory: false, encryptHistory: false, flash: {}, rememberedState: {},
    };
}

async function boot(url: string, reduced: boolean) {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const mediaListeners = new Set<(event: MediaQueryListEvent) => void>();
    const media = {
        matches: reduced,
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.add(listener),
        removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => mediaListeners.delete(listener),
    };
    vi.stubGlobal('matchMedia', vi.fn(() => media));
    window.history.replaceState(null, '', url);
    const replaceState = window.history.replaceState.bind(window.history);
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, next) =>
        replaceState(structuredClone(data), unused, next));
    const windowAdds = vi.spyOn(window, 'addEventListener');
    const documentAdds = vi.spyOn(document, 'addEventListener');
    stopListeners = () => {
        for (const [type, listener, options] of windowAdds.mock.calls) window.removeEventListener(type, listener, options);
        for (const [type, listener, options] of documentAdds.mock.calls) document.removeEventListener(type, listener, options);
    };
    const requests: string[] = [];
    const originalAdapter = axios.defaults.adapter;
    restoreHttpAdapter = () => { axios.defaults.adapter = originalAdapter; };
    // Client URL replacements must not be silently served by an HTTP fixture.
    axios.defaults.adapter = async (config) => {
        requests.push(String(config.url));
        throw new Error('Unexpected HTTP request during legacy in-place selection.');
    };
    host = document.createElement('div');
    host.id = 'project-select-inertia-integration';
    document.body.append(host);
    await act(async () => {
        await createInertiaApp({
            id: host!.id, page: pageFixture(url), resolve: () => Select, progress: false,
            setup({ el, App, props }) {
                stopObserving = observeLinksLauncherArrivals((page) => page.component === 'Projects/Select'
                    && new URL(page.url, window.location.origin).searchParams.get('view') === 'stages');
                root = createRoot(el);
                root.render(<App {...props} />);
            },
        });
    });
    await waitForRender(() => expect(sphere()?.disabled).toBe(false));
    return { requests, setReducedMotion(value: boolean) {
        media.matches = value;
        mediaListeners.forEach((listener) => listener({ matches: value } as MediaQueryListEvent));
    } };
}

async function waitForRender(assertion: () => void) {
    const deadline = Date.now() + 1000;
    while (true) {
        // Keep real transition/typing timers inside act while awaiting the rendered result.
        await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
        try {
            assertion();
            return;
        } catch (error) {
            if (Date.now() >= deadline) throw error;
        }
    }
}

function sphere() {
    return host?.querySelector<HTMLButtonElement>('button[aria-label="API Discovery Hub の開発段階を選択する"]');
}

beforeEach(async () => {
    fixture = await boot('/projects', false);
});

afterEach(() => {
    stopObserving?.();
    stopObserving = undefined;
    if (root) act(() => root?.unmount());
    root = undefined;
    host?.remove();
    host = undefined;
    stopListeners?.();
    stopListeners = undefined;
    restoreHttpAdapter?.();
    restoreHttpAdapter = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
});

it('keeps both returns through the real Projects Page in normal and reduced motion', async () => {
    const { requests, setReducedMotion } = fixture;
    for (const reduced of [false, true]) {
        await act(async () => { setReducedMotion(reduced); });
        expect(sphere()?.disabled).toBe(false);
        await act(async () => { sphere()?.click(); });
        await waitForRender(() => {
            expect(window.location.pathname + window.location.search).toBe('/projects?project=api-discovery-hub&view=stages');
            expect(host?.querySelector('a[aria-label="Portfolioへ戻る"]'), 'TOP return must survive the Inertia Page swap').not.toBeNull();
            const back = host?.querySelector<HTMLButtonElement>('button[aria-label="PROJECT選択へ戻る"]');
            expect(back, 'Legacy stage return must survive the Inertia Page swap').not.toBeNull();
            expect(back?.disabled).toBe(false);
            expect(document.activeElement).toBe(host?.querySelector('.project-stage-action'));
        });
        await act(async () => { host?.querySelector<HTMLButtonElement>('button[aria-label="PROJECT選択へ戻る"]')?.click(); });
        await waitForRender(() => {
            expect(window.location.pathname + window.location.search).toBe('/projects?project=api-discovery-hub');
            expect(sphere()?.disabled).toBe(false);
            expect(host?.querySelector('.project-depth-select')).toBeNull();
            expect(document.activeElement).toBe(sphere());
        });
        expect(requests).toEqual([]);
    }
});
