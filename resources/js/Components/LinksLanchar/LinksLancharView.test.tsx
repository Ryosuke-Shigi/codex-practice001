// @vitest-environment jsdom

// @ts-expect-error Vitest runs in Node while the application tsconfig omits Node ambient types.
import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosHeaders } from 'axios';

import LinksLancharView from './LinksLancharView';
import type { LinksLancharPageProps } from './types';

type VisitOptionsFixture = {
    headers?: Record<string, string>;
    onStart?: (visit: { url: URL; method: 'get'; headers: Record<string, string> }) => void;
    onFinish?: () => void;
    onCancel?: () => void;
};

type InvalidResponseFixture = {
    config: { url: string; method: string; headers: AxiosHeaders };
    headers: AxiosHeaders;
    status: number;
};

type InvalidListener = (event: CustomEvent<{ response: InvalidResponseFixture }>) => boolean | void;

const inertia = vi.hoisted(() => ({
    visit: vi.fn<(url: string, options?: VisitOptionsFixture) => void>(),
    replace: vi.fn<(options: { url: string }) => void>(),
    remembered: new Map<string | undefined, unknown>(),
    invalidListeners: new Set<InvalidListener>(),
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    router: {
        visit: inertia.visit,
        replace: inertia.replace,
        remember: (value: unknown, key?: string) => inertia.remembered.set(key, value),
        restore: (key?: string) => inertia.remembered.get(key),
        on: (event: string, listener: InvalidListener) => {
            if (event !== 'invalid') {
                return () => undefined;
            }
            inertia.invalidListeners.add(listener);
            return () => { inertia.invalidListeners.delete(listener); };
        },
    },
    usePage: () => ({ url: window.location.pathname + window.location.search }),
}));

type VisibleLink = LinksLancharPageProps['linkList']['links'][number];

const firstKey = 'd65d315a-5898-4472-ab84-f110f1108138';
const secondKey = '167e7070-2ee9-4cb0-abb1-47e24ec65470';
const launcherKey = '839ef2e9-2997-4cc8-8612-3a2f42005163';
const launcherUrl = '/links-lanchars/' + launcherKey;
const linksLancharStyles = readFileSync('resources/js/Components/LinksLanchar/linksLanchar.css', 'utf8');

let host: HTMLDivElement;
let root: Root;

function makeLink(
    linkKey: string,
    title: string,
    destinationUrl: string | null,
    displayOverrides: Partial<VisibleLink['displayValues']> = {},
): VisibleLink {
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
            sphereShadowColor: 'rgba(74, 222, 128, 0.38)',
            iconImageSource: null,
            lucideIconName: 'Link',
            backgroundColor: '#12201c',
            backgroundImageSource: null,
            backgroundImagePosterSource: null,
            backgroundImageEntranceAnimationName: null,
            backgroundEffectName: null,
            accentColor: '#fbbf24',
            textColor: '#f7fee7',
            ...displayOverrides,
        },
    };
}

function render(links: readonly VisibleLink[], selectedLinkKey: string | null = null) {
    act(() =>
        root.render(
            <LinksLancharView
                linksLanchar={{
                    linksLancharKey: launcherKey,
                    title: null,
                    description: null,
                }}
                selectedLinkKey={selectedLinkKey}
                linkList={{ links }}
            />,
        ),
    );
}

function findButton(name: string): HTMLButtonElement | null {
    return Array.from(host.querySelectorAll('button')).find((button) => {
        if (button.closest('[aria-hidden="true"]') !== null) {
            return false;
        }
        const labelId = button.getAttribute('aria-labelledby');
        const referencedLabel = labelId === null
            ? null
            : document.getElementById(labelId)?.textContent;
        const label = referencedLabel ?? button.getAttribute('aria-label') ?? button.textContent;
        return label?.trim() === name;
    }) ?? null;
}

function getButton(name: string): HTMLButtonElement {
    const button = findButton(name);
    if (button === null) {
        throw new Error('ボタンが見つかりません: ' + name);
    }
    return button;
}

function click(button: HTMLButtonElement) {
    act(() => button.click());
}

function activateByKey(button: HTMLButtonElement, key: 'Enter' | ' ') {
    act(() => {
        button.focus();
        const keydown = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        const keyup = new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true });
        const canActivate = button.dispatchEvent(keydown);

        // jsdomはbuttonの既定clickを発行しないため、未キャンセルの既定動作だけを補う。
        if (key === 'Enter' && canActivate) {
            button.click();
        }
        const canActivateOnRelease = button.dispatchEvent(keyup);
        if (key === ' ' && canActivate && canActivateOnRelease) {
            button.click();
        }
    });
}

function lastSelectedUrl(): URL {
    const call = inertia.replace.mock.lastCall;
    if (call === undefined) {
        throw new Error('選択URLの置き換えが呼ばれていません。');
    }
    return new URL(call[0].url, window.location.origin);
}

function prefersReducedMotion(value: boolean) {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
        media: query,
        matches: query === '(prefers-reduced-motion: reduce)' && value,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
    })));
}

function hasRenderedAsset(url: string): boolean {
    const renderedImage = Array.from(host.querySelectorAll('img[src]'))
        .some((image) => image.getAttribute('src') === url);
    const styledBackground = Array.from(host.querySelectorAll<HTMLElement>('[style]'))
        .some((element) => element.style.cssText.includes(url));
    return renderedImage || styledBackground;
}

const htmlDestination = '/ordinary-document?tab=details#details';

type UnrelatedHtmlResponseFixture = {
    name: string;
    visitHeaders?: 'absent' | 'different';
    pathname?: string;
    method?: string;
    status?: number;
    contentType?: string;
};

const unrelatedHtmlResponses: UnrelatedHtmlResponseFixture[] = [
    { name: 'no visit identification', visitHeaders: 'absent' },
    { name: 'a different visit to the same URL', visitHeaders: 'different' },
    { name: 'a different request URL', pathname: '/another-document' },
    { name: 'a non-GET request', method: 'post' },
    { name: 'an HTTP error', status: 404 },
    { name: 'a JSON response', contentType: 'application/json' },
];

function startHtmlVisit() {
    // jsdomで実際のlocation.assignの結果を観測するため、同じ文書のフラグメントを使う。
    window.history.replaceState(null, '', '/ordinary-document?tab=details');
    render([makeLink(firstKey, '通常の文書へ進む', htmlDestination)]);
    click(getButton('通常の文書へ進む'));

    const visitCall = inertia.visit.mock.lastCall;
    if (visitCall === undefined) {
        throw new Error('保存URLへのInertia visitが呼ばれていません。');
    }
    const [destination, options] = visitCall;
    const url = new URL(destination, window.location.origin);
    const headers = options?.headers ?? {};
    act(() => options?.onStart?.({ url, method: 'get', headers }));

    const requestUrl = new URL(url);
    requestUrl.hash = '';
    return {
        destination,
        options,
        response: {
            config: { url: requestUrl.href, method: 'get', headers: new AxiosHeaders(headers) },
            headers: new AxiosHeaders({ 'content-type': 'text/html; charset=UTF-8' }),
            status: 200,
        },
    };
}

function dispatchInvalidResponse(response: InvalidResponseFixture) {
    const event = new CustomEvent('inertia:invalid', {
        cancelable: true,
        detail: { response },
    });
    act(() => {
        for (const listener of Array.from(inertia.invalidListeners)) {
            if (listener(event) === false) {
                event.preventDefault();
            }
        }
    });
    return event;
}

describe('LinksLancharView', () => {
    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        prefersReducedMotion(false);
        window.history.replaceState(null, '', launcherUrl);
        host = document.createElement('div');
        document.body.appendChild(host);
        root = createRoot(host);
        inertia.visit.mockReset();
        inertia.replace.mockReset();
        inertia.remembered.clear();
        inertia.invalidListeners.clear();
    });

    afterEach(() => {
        act(() => root.unmount());
        host.remove();
        window.history.replaceState(null, '', '/');
        vi.unstubAllGlobals();
    });

    it('shows the empty message when the launcher has no visible links', () => {
        render([]);

        expect(host.textContent).toContain('表示できるリンクはありません');
        expect(findButton('前のリンク')).toBeNull();
        expect(findButton('次のリンク')).toBeNull();
    });

    it('keeps a single link visible without arrows or navigation when its destination is unset', () => {
        render([makeLink(firstKey, '行き先なし', null)]);
        const button = getButton('行き先なし');

        expect(findButton('前のリンク')).toBeNull();
        expect(findButton('次のリンク')).toBeNull();

        click(button);
        activateByKey(button, 'Enter');
        activateByKey(button, ' ');

        expect(inertia.visit).not.toHaveBeenCalled();
        expect(inertia.replace).not.toHaveBeenCalled();
    });

    it.each([
        ['listed key', secondKey, '二番目'],
        ['unknown key', 'af3bbf77-61de-47b6-a175-939d490efe66', '最初'],
    ])('uses the expected initial selection for a %s', (_case, requestedKey, title) => {
        render([
            makeLink(firstKey, '最初', '/projects/logs'),
            makeLink(secondKey, '二番目', '/projects?project=dance-shorts-radar&view=stages'),
        ], requestedKey);

        expect(findButton(title)).not.toBeNull();
    });

    it('cycles the visible links by replacing the selection URL and retains selection focus', () => {
        render([
            makeLink(firstKey, '最初', '/projects/logs'),
            makeLink(secondKey, '二番目', '/projects?project=dance-shorts-radar&view=stages'),
        ], firstKey);
        const firstButton = getButton('最初');
        act(() => {
            firstButton.focus();
            firstButton.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            }));
        });

        expect(document.activeElement).toBe(getButton('二番目'));
        expect(lastSelectedUrl().pathname).toBe(launcherUrl);
        expect(lastSelectedUrl().searchParams.get('selectedLinkKey')).toBe(secondKey);
        expect(Array.from(host.querySelectorAll('[aria-live]'))
            .some((region) => region.textContent?.includes('二番目'))).toBe(true);

        click(getButton('次のリンク'));
        expect(findButton('最初')).not.toBeNull();
        expect(lastSelectedUrl().searchParams.get('selectedLinkKey')).toBe(firstKey);

        click(getButton('前のリンク'));
        expect(findButton('二番目')).not.toBeNull();
        expect(lastSelectedUrl().searchParams.get('selectedLinkKey')).toBe(secondKey);
        expect(inertia.visit).not.toHaveBeenCalled();
    });

    it.each(['前のリンク', '次のリンク'])('focuses the new selection after a pointer click on %s', (arrowName) => {
        render([
            makeLink(firstKey, '最初', '/projects/logs'),
            makeLink(secondKey, '二番目', '/projects?project=dance-shorts-radar&view=stages'),
        ], firstKey);
        const arrow = getButton(arrowName);

        act(() => {
            // ブラウザーのポインター操作と同様に、クリック前に矢印へフォーカスを移す。
            arrow.focus();
            arrow.click();
        });

        expect(lastSelectedUrl().searchParams.get('selectedLinkKey')).toBe(secondKey);
        expect(document.activeElement).toBe(getButton('二番目'));
    });

    it('visits the exact saved destination when clicked', () => {
        const destination = '/projects?project=api-discovery-hub&view=stages';
        render([makeLink(firstKey, '作品へ進む', destination)]);

        click(getButton('作品へ進む'));

        expect(inertia.visit).toHaveBeenCalledTimes(1);
        expect(inertia.visit.mock.lastCall?.[0]).toBe(destination);
    });

    it('opens the saved URL with its fragment when its Inertia visit receives ordinary HTML', () => {
        const visit = startHtmlVisit();
        expect(visit.destination).toBe(htmlDestination);

        const event = dispatchInvalidResponse(visit.response);

        expect(event.defaultPrevented).toBe(true);
        expect(window.location.hash).toBe('#details');
    });

    it.each(unrelatedHtmlResponses)('leaves an invalid response with $name to Inertia', ({
        visitHeaders,
        pathname,
        method,
        status,
        contentType,
    }) => {
        const { response } = startHtmlVisit();
        if (visitHeaders === 'absent') {
            response.config.headers.clear();
        }
        if (visitHeaders === 'different') {
            for (const name of Object.keys(response.config.headers.toJSON())) {
                response.config.headers.set(name, 'different-visit');
            }
        }
        if (pathname !== undefined) {
            const url = new URL(response.config.url);
            url.pathname = pathname;
            response.config.url = url.href;
        }
        if (method !== undefined) {
            response.config.method = method;
        }
        if (status !== undefined) {
            response.status = status;
        }
        if (contentType !== undefined) {
            response.headers.set('content-type', contentType);
        }

        const event = dispatchInvalidResponse(response);

        expect(event.defaultPrevented).toBe(false);
        expect(window.location.hash).toBe('');
    });

    it.each(['finish', 'cancel', 'unmount'] as const)('removes the document fallback on %s', (lifecycle) => {
        const { options, response } = startHtmlVisit();
        expect(inertia.invalidListeners.size).toBeGreaterThan(0);

        act(() => {
            switch (lifecycle) {
                case 'finish':
                    options?.onFinish?.();
                    break;
                case 'cancel':
                    options?.onCancel?.();
                    break;
                case 'unmount':
                    root.unmount();
                    break;
            }
        });
        const event = dispatchInvalidResponse(response);

        expect(inertia.invalidListeners.size).toBe(0);
        expect(event.defaultPrevented).toBe(false);
        expect(window.location.hash).toBe('');
    });

    it.each(['Enter', ' '] as const)('visits the focused link once on the %j key', (key) => {
        const destination = '/projects/logs';
        render([makeLink(firstKey, 'ログへ進む', destination)]);

        activateByKey(getButton('ログへ進む'), key);

        expect(inertia.visit).toHaveBeenCalledTimes(1);
        expect(inertia.visit.mock.lastCall?.[0]).toBe(destination);
    });

    it.each([false, true])('selects the supplied image variants when reduced motion is %s', (reduced) => {
        prefersReducedMotion(reduced);
        const selection = '/images/selection.gif';
        const selectionPoster = '/images/selection-still-v2.png';
        const background = '/images/background-v2.gif';
        const backgroundPoster = '/images/background-still-v1.png';
        render([makeLink(firstKey, '画像で選択', null, {
            selectionDisplayType: 'image',
            selectionImageSource: selection,
            selectionImagePosterSource: selectionPoster,
            sphereColor: null,
            sphereShadowColor: null,
            lucideIconName: null,
            backgroundImageSource: background,
            backgroundImagePosterSource: backgroundPoster,
        })]);

        const button = getButton('画像で選択');
        const image = button.querySelector('img');
        expect(image?.getAttribute('src')).toBe(reduced ? selectionPoster : selection);
        expect(button.querySelector('svg')).toBeNull();
        expect(hasRenderedAsset(reduced ? backgroundPoster : background)).toBe(true);
        expect(hasRenderedAsset(reduced ? background : backgroundPoster)).toBe(false);
    });

    it.each([
        { reduced: false, poster: null, expectedImage: '/images/neighbor.png', name: 'the primary PNG without a poster' },
        { reduced: false, poster: '/images/neighbor-poster.png', expectedImage: '/images/neighbor-poster.png', name: 'the poster when supplied' },
        { reduced: true, poster: null, expectedImage: null, name: 'a visible title when reduced motion has no poster' },
    ])('shows $name in the decorative neighbor preview', ({ reduced, poster, expectedImage }) => {
        const style = document.createElement('style');
        style.textContent = linksLancharStyles;
        document.head.append(style);

        try {
            expect(style.sheet?.cssRules.length ?? 0).toBeGreaterThan(0);
            prefersReducedMotion(reduced);
            const neighborTitle = 'となりの作品のプレビューで名前が長い場合にも見分けられるタイトルです';
            render([
                makeLink(firstKey, '選択中の作品', '/projects/logs'),
                makeLink(secondKey, neighborTitle, '/projects?project=dance-shorts-radar&view=stages', {
                    selectionDisplayType: 'image',
                    selectionImageSource: '/images/neighbor.png',
                    selectionImagePosterSource: poster,
                    sphereColor: null,
                    sphereShadowColor: null,
                    lucideIconName: null,
                }),
            ]);

            const preview = host.querySelector<HTMLElement>('.links-lanchar-neighbor--next');
            if (preview === null) {
                throw new Error('右側のプレビューが見つかりません。');
            }
            expect(preview.getAttribute('aria-hidden')).toBe('true');
            const image = preview.querySelector('img');
            if (expectedImage !== null) {
                expect(image?.getAttribute('src')).toBe(expectedImage);
                return;
            }

            expect(image).toBeNull();
            expect(preview.querySelector('svg')).toBeNull();
            const label = Array.from(preview.querySelectorAll<HTMLElement>('*'))
                .find((element) => element.textContent === neighborTitle && element.childElementCount === 0);
            if (label === undefined) {
                throw new Error('動きを抑えたプレビューの作品名が見つかりません。');
            }
            expect(window.getComputedStyle(preview).display).not.toBe('none');
            expect(window.getComputedStyle(label).display).not.toBe('none');
            expect(window.getComputedStyle(label).visibility).not.toBe('hidden');
        } finally {
            style.remove();
        }
    });
});
