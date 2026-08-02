// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routerVisit = vi.hoisted(() => vi.fn());
const routerReplace = vi.hoisted(() => vi.fn());
const prefersReducedMotion = vi.hoisted(() => ({ value: true }));
const pageUrl = vi.hoisted(() => ({ value: '/projects' }));

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title?: string }) =>
        title === undefined ? null : <title>{title}</title>,
    Link: ({
        children,
        href,
        ...props
    }: {
        children?: ReactNode;
        href: string;
        [key: string]: unknown;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: {
        visit: routerVisit,
        replace: routerReplace,
    },
    usePage: () => ({ url: pageUrl.value }),
}));

vi.mock('./usePrefersReducedMotion', () => ({
    default: () => prefersReducedMotion.value,
}));

import ProjectSelectView from './ProjectSelectView';

let container: HTMLDivElement;
let root: Root;

function render() {
    act(() => root.render(<ProjectSelectView />));
}

function selectedSphere(): HTMLButtonElement {
    const sphere = container.querySelector<HTMLButtonElement>(
        '.project-sphere-button',
    );

    if (sphere === null) {
        throw new Error('選択中のProject球体が見つかりません。');
    }

    return sphere;
}

function buttonWithText(text: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll('button')).find(
        (candidate) => candidate.textContent?.includes(text),
    );

    if (button === undefined) {
        throw new Error(`${text} を操作するbuttonが見つかりません。`);
    }

    return button;
}

function pressKey(key: string) {
    act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    });
}

function dispatchTouch(
    type: 'touchstart' | 'touchend',
    touches: Array<{ clientX: number; clientY: number }>,
    changedTouches: Array<{ clientX: number; clientY: number }>,
) {
    const event = new Event(type, { bubbles: true, cancelable: true });

    Object.defineProperty(event, 'touches', { value: touches });
    Object.defineProperty(event, 'changedTouches', { value: changedTouches });

    act(() => {
        window.dispatchEvent(event);
    });
}

describe('ProjectSelectView two-stage project navigation', () => {
    beforeEach(() => {
        (
            globalThis as typeof globalThis & {
                IS_REACT_ACT_ENVIRONMENT: boolean;
            }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        routerVisit.mockReset();
        routerReplace.mockReset();
        prefersReducedMotion.value = true;
        pageUrl.value = '/projects';
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.useRealTimers();
    });

    it('renders the exact Portfolio return contract', () => {
        render();

        const portfolioLink = container.querySelector<HTMLAnchorElement>(
            'a[href="/"]',
        );

        expect(portfolioLink?.textContent).toBe('戻る');
        expect(portfolioLink?.getAttribute('aria-label')).toBe('Portfolioへ戻る');
        expect(portfolioLink?.getAttribute('title')).toBe('Portfolioへ戻る');
    });

    it('renders the exact dedicated application logs action contract', () => {
        pageUrl.value = '/projects?project=logs';
        render();

        act(() => selectedSphere().click());

        const dedicatedAction = container.querySelector<HTMLButtonElement>(
            '.project-dedicated-action',
        );

        expect(dedicatedAction?.querySelector('strong')?.textContent).toBe(
            'アプリログを開く',
        );
        expect(dedicatedAction?.getAttribute('aria-label')).toBe(
            'アプリログを開く',
        );
        expect(dedicatedAction?.getAttribute('title')).toBe(
            'アプリログを開く',
        );
    });

    it('starts with only project selection and enters stage selection in the same page', () => {
        render();

        expect(container.textContent).toContain('API Discovery Hub');
        expect(container.textContent).not.toContain('PRODUCT');
        expect(container.textContent).not.toContain('MOCK');
        expect(container.textContent).not.toContain('IDEA BOARD');

        act(() => selectedSphere().click());

        expect(routerVisit).not.toHaveBeenCalled();
        expect(container.textContent).toContain('PRODUCT');
        expect(container.textContent).toContain('MOCK');
        expect(container.textContent).toContain('IDEA BOARD');
        expect(container.textContent).not.toContain('PROTOTYPE');
        expect(routerReplace).toHaveBeenCalledWith(
            { url: '/projects?project=api-discovery-hub&view=stages' },
        );
    });

    it('restores a valid selected project from a direct URL without expanding stages', () => {
        pageUrl.value = '/projects?project=dance-shorts-analyzer';

        render();

        expect(selectedSphere().getAttribute('aria-label')).toContain(
            'DanceShortsAnalyzer',
        );
        expect(container.querySelector('.project-stage-grid')).toBeNull();
        expect(routerReplace).not.toHaveBeenCalled();
    });

    it('restores stage selection from a direct URL and removes project switching controls from the DOM', () => {
        pageUrl.value =
            '/projects?project=dance-shorts-radar&view=stages';

        render();

        expect(selectedSphere().getAttribute('aria-label')).toContain(
            'DanceShortsRadar',
        );
        expect(container.querySelector('.project-stage-grid')).not.toBeNull();
        expect(container.querySelector('.project-select-arrow')).toBeNull();
        expect(container.querySelector('.project-side-bubble')).toBeNull();
        expect(buttonWithText('戻る')).toHaveProperty('disabled', false);
    });

    it('safely normalizes unknown, invalid, and logs stage URLs to initial project selection', () => {
        pageUrl.value = '/projects?project=unknown&view=stages';
        render();

        expect(selectedSphere().getAttribute('aria-label')).toContain(
            'API Discovery Hub',
        );
        expect(container.querySelector('.project-stage-grid')).toBeNull();
        expect(routerReplace).toHaveBeenCalledWith({ url: '/projects' });

        act(() => root.unmount());
        container.remove();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        routerReplace.mockReset();
        pageUrl.value = '/projects?project=logs&view=stages';

        render();

        expect(selectedSphere().getAttribute('aria-label')).toContain(
            'API Discovery Hub',
        );
        expect(container.querySelector('.project-stage-grid')).toBeNull();
        expect(routerReplace).toHaveBeenCalledWith({ url: '/projects' });
    });

    it('keeps project switching and keyboard selection within the two-stage screen', () => {
        render();

        pressKey('ArrowRight');

        expect(selectedSphere().getAttribute('aria-label')).toContain('DanceShortsRadar');

        pressKey('Enter');

        expect(routerVisit).not.toHaveBeenCalled();
        expect(container.textContent).toContain('PRODUCT');
        expect(container.textContent).toContain('MOCK');
        expect(container.textContent).toContain('IDEA BOARD');
        expect(container.textContent).not.toContain('PROTOTYPE');
    });

    it('switches projects on a left swipe but disables swiping during stage selection', () => {
        render();

        dispatchTouch('touchstart', [{ clientX: 240, clientY: 320 }], []);
        dispatchTouch('touchend', [], [{ clientX: 120, clientY: 320 }]);

        expect(selectedSphere().getAttribute('aria-label')).toContain('DanceShortsRadar');

        act(() => selectedSphere().click());
        expect(container.querySelector('.project-select-arrow')).toBeNull();
        expect(container.querySelector('.project-side-bubble')).toBeNull();
        dispatchTouch('touchstart', [{ clientX: 240, clientY: 320 }], []);
        dispatchTouch('touchend', [], [{ clientX: 120, clientY: 320 }]);

        expect(selectedSphere().getAttribute('aria-label')).toContain(
            'DanceShortsRadar',
        );
    });

    it('locks stage actions during normal-motion transitions and restores focus after returning', () => {
        prefersReducedMotion.value = false;
        vi.useFakeTimers();
        render();

        act(() => selectedSphere().click());

        expect(container.firstElementChild?.className).toContain(
            'project-select-page--project-expanding',
        );
        expect(buttonWithText('PRODUCT').disabled).toBe(true);
        expect(container.querySelector('.project-select-arrow')).toBeNull();
        expect(container.querySelector('.project-side-bubble')).toBeNull();

        act(() => vi.advanceTimersByTime(280));

        const firstStageAction = buttonWithText('PRODUCT');
        expect(container.firstElementChild?.className).toContain(
            'project-select-page--stage-select',
        );
        expect(firstStageAction.disabled).toBe(false);
        expect(document.activeElement).toBe(firstStageAction);

        const backButton = buttonWithText('戻る');
        expect(backButton.getAttribute('aria-label')).toBe('PROJECT選択へ戻る');
        expect(backButton.getAttribute('title')).toBe('PROJECT選択へ戻る');
        act(() => backButton.click());

        expect(container.firstElementChild?.className).toContain(
            'project-select-page--project-returning',
        );
        expect(firstStageAction.disabled).toBe(true);

        act(() => vi.advanceTimersByTime(280));

        expect(container.textContent).not.toContain('PRODUCT');
        expect(document.activeElement).toBe(selectedSphere());
    });

    it('visits every API Discovery Hub stage directly from stage selection', () => {
        render();

        act(() => selectedSphere().click());
        act(() => buttonWithText('PRODUCT').click());

        expect(routerVisit).toHaveBeenCalledTimes(1);
        expect(routerVisit.mock.calls[0]?.[0]).toBe('/api-catalog');

        const firstVisitOptions = routerVisit.mock.calls[0]?.[1];

        if (typeof firstVisitOptions?.onFinish !== 'function') {
            throw new Error('PRODUCT遷移のonFinish callbackが見つかりません。');
        }

        act(() => firstVisitOptions.onFinish());

        expect(buttonWithText('MOCK').disabled).toBe(false);
        act(() => buttonWithText('MOCK').click());

        expect(routerVisit).toHaveBeenCalledTimes(2);
        expect(routerVisit.mock.calls[1]?.[0]).toBe('/api-catalog/mock');
        expect(routerVisit.mock.calls.map(([href]) => href)).not.toContain(
            '/projects/api-discovery-hub',
        );
    });

    it('keeps Radar and Analyzer as separate spheres and visits all of their stages directly', () => {
        render();

        pressKey('ArrowRight');
        expect(selectedSphere().getAttribute('aria-label')).toContain(
            'DanceShortsRadar',
        );
        act(() => selectedSphere().click());

        ['PRODUCT', 'MOCK', 'IDEA BOARD'].forEach((stageName) => {
            act(() => buttonWithText(stageName).click());
            const visitOptions =
                routerVisit.mock.calls[routerVisit.mock.calls.length - 1]?.[1];

            if (typeof visitOptions?.onFinish !== 'function') {
                throw new Error(`${stageName} 遷移のonFinish callbackが見つかりません。`);
            }

            act(() => visitOptions.onFinish());
        });

        act(() => buttonWithText('戻る').click());
        pressKey('ArrowRight');
        expect(selectedSphere().getAttribute('aria-label')).toContain(
            'DanceShortsAnalyzer',
        );
        act(() => selectedSphere().click());

        ['PRODUCT', 'MOCK', 'IDEA BOARD'].forEach((stageName) => {
            act(() => buttonWithText(stageName).click());
            const visitOptions =
                routerVisit.mock.calls[routerVisit.mock.calls.length - 1]?.[1];

            if (typeof visitOptions?.onFinish !== 'function') {
                throw new Error(`${stageName} 遷移のonFinish callbackが見つかりません。`);
            }

            act(() => visitOptions.onFinish());
        });

        expect(routerVisit.mock.calls.map(([href]) => href)).toEqual([
            '/dance-shorts-radar',
            '/lab/dance-shorts-radar-mock',
            '/lab/dance-shorts-radar-idea-board',
            '/dance-shorts-analyzer',
            '/lab/dance-shorts-analyzer-mock',
            '/lab/dance-shorts-analyzer-idea-board',
        ]);
        expect(routerVisit.mock.calls.map(([href]) => href)).not.toContain(
            '/projects/dance-shorts',
        );
    });

    it('opens logs through its dedicated logs action without creating stage cards', () => {
        render();

        for (let index = 0; index < 7; index += 1) {
            pressKey('ArrowRight');
        }

        expect(selectedSphere().getAttribute('aria-label')).toContain('アプリログ');

        act(() => selectedSphere().click());

        expect(routerVisit).not.toHaveBeenCalled();
        act(() => buttonWithText('アプリログ').click());

        expect(routerVisit).toHaveBeenCalledTimes(1);
        expect(routerVisit.mock.calls[0]?.[0]).toBe('/projects/logs');
    });

    it('returns from stage selection to the same project and restores focus to its sphere', () => {
        render();
        pressKey('ArrowRight');
        act(() => selectedSphere().click());

        act(() => buttonWithText('戻る').click());

        expect(container.textContent).toContain('DanceShortsRadar');
        expect(container.textContent).not.toContain('PRODUCT');
        expect(document.activeElement).toBe(selectedSphere());
    });

    it('does not issue another visit when a different stage is activated while navigating', () => {
        render();
        act(() => selectedSphere().click());

        const mockStage = buttonWithText('MOCK');
        const productStage = buttonWithText('PRODUCT');
        act(() => {
            mockStage.click();
            productStage.click();
        });

        expect(routerVisit).toHaveBeenCalledTimes(1);
        expect(routerVisit.mock.calls[0]?.[0]).toBe('/api-catalog/mock');
    });

    it('synchronizes the selected project URL after returning from stage selection', () => {
        render();
        pressKey('ArrowRight');
        act(() => selectedSphere().click());
        routerReplace.mockReset();

        act(() => buttonWithText('戻る').click());

        expect(routerReplace).toHaveBeenCalledWith(
            { url: '/projects?project=dance-shorts-radar' },
        );
        expect(document.activeElement).toBe(selectedSphere());
    });
});
