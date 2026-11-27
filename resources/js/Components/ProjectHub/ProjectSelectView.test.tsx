// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Select from '@/Pages/Projects/Select';

import { getStageProjectReturnLink } from './projectNavigation';

const { routerVisit, pageUrl } = vi.hoisted(() => ({
    routerVisit: vi.fn(),
    pageUrl: { value: '/' },
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => (
        <a {...props}>{children}</a>
    ),
    router: { visit: routerVisit, get: vi.fn(), replace: vi.fn() },
    usePage: () => ({ url: pageUrl.value }),
}));

vi.mock('@/Components/Effects/AquaParticlesBackground', () => ({ default: () => null }));

const stageCases = [
    ['api-discovery-hub', 'API Discovery Hub', [
        ['PRODUCT', '/api-catalog'],
        ['MOCK', '/api-catalog/mock'],
        ['IDEA BOARD', '/lab/api-discovery-hub-idea-board'],
    ]],
    ['dance-shorts-radar', 'DanceShortsRadar', [
        ['PRODUCT', '/dance-shorts-radar'],
        ['MOCK', '/lab/dance-shorts-radar-mock'],
        ['IDEA BOARD', '/lab/dance-shorts-radar-idea-board'],
    ]],
    ['dance-shorts-analyzer', 'DanceShortsAnalyzer', [
        ['PRODUCT', '/dance-shorts-analyzer'],
        ['MOCK', '/lab/dance-shorts-analyzer-mock'],
        ['IDEA BOARD', '/lab/dance-shorts-analyzer-idea-board'],
    ]],
    ['japan-quake-wave-map', 'Japan Quake Wave Map', [
        ['PRODUCT', '/quakewave-preview/map'],
        ['MOCK', '/quakewave-preview'],
        ['IDEA BOARD', '/lab/quake-wave-map-idea-board'],
    ]],
    ['lumilab', 'LumiLab', [
        ['MOCK', '/lab/lumilab-project-mock'],
        ['IDEA BOARD', '/lab/lumilab-project-idea-board'],
    ]],
    ['construction-order', '工事発注管理', [
        ['MOCK', '/lab/construction-order-workflow-mock'],
        ['IDEA BOARD', '/lab/construction-order-workflow-idea-board'],
    ]],
    ['event-card-calendar', 'イベント・カードカレンダー', [
        ['IDEA BOARD', '/lab/event-card-calendar-idea-board'],
    ]],
] as const;

let container: HTMLDivElement;
let root: Root;

function render(url: string) {
    pageUrl.value = url;
    window.history.replaceState(null, '', url);
    act(() => root.render(<Select />));
}

function stageButtons() {
    return Array.from(container.querySelectorAll<HTMLButtonElement>('.project-stage-action'));
}

function listReturn() {
    return Array.from(container.querySelectorAll('a'))
        .find((link) => link.textContent?.trim() === '作品一覧へ');
}

describe('ProjectSelectView development stages', () => {
    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.stubGlobal('matchMedia', () => ({
            matches: true,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        }));
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        vi.clearAllMocks();
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        window.history.replaceState(null, '', '/');
        vi.unstubAllGlobals();
    });

    it.each(stageCases)('keeps the stage labels, routes and works-list return for %s', (id, name, stages) => {
        const stageUrl = '/projects?project=' + id + '&view=stages';
        render(stageUrl);

        expect(container.querySelector('.project-depth-select')?.getAttribute('aria-label')).toBe(name + ' の開発段階');
        expect(listReturn()?.getAttribute('href')).toBe('/portfolio/links-launcher?project=' + id);
        expect(getStageProjectReturnLink(id)).toMatchObject({ href: stageUrl, label: '戻る' });
        expect(container.querySelector('.project-sphere-icon')).not.toBeNull();

        const buttons = stageButtons();
        expect(buttons.map((button) => button.querySelector('strong')?.textContent))
            .toEqual(stages.map(([label]) => label));
        expect(document.activeElement).toBe(buttons[0]);
        for (const button of buttons) {
            act(() => button.click());
            const finish = routerVisit.mock.lastCall?.[1]?.onFinish;
            expect(finish).toBeTypeOf('function');
            act(() => finish());
        }
        expect(routerVisit.mock.calls.map(([href]) => href)).toEqual(stages.map(([, href]) => href));
    });

    it('blocks both another stage and the works-list return during a stage visit', () => {
        render('/projects?project=api-discovery-hub&view=stages');
        const [product, mock] = stageButtons();

        act(() => {
            product.click();
            mock.click();
        });
        expect(routerVisit.mock.calls.map(([href]) => href)).toEqual(['/api-catalog']);
        expect(stageButtons().every((button) => button.disabled)).toBe(true);
        expect(listReturn()?.getAttribute('aria-disabled')).toBe('true');

        const finish = routerVisit.mock.lastCall?.[1]?.onFinish;
        act(() => finish());
        expect(stageButtons().every((button) => !button.disabled)).toBe(true);
        expect(listReturn()?.getAttribute('aria-disabled')).toBeNull();
        expect(document.activeElement).toBe(product);
    });

    it('restores a different valid stage URL with focus on its first action', () => {
        render('/projects?project=api-discovery-hub&view=stages');
        render('/projects?project=event-card-calendar&view=stages');

        expect(stageButtons().map((button) => button.querySelector('strong')?.textContent)).toEqual(['IDEA BOARD']);
        expect(document.activeElement).toBe(stageButtons()[0]);
        expect(listReturn()?.getAttribute('href')).toBe('/portfolio/links-launcher?project=event-card-calendar');
    });
});
