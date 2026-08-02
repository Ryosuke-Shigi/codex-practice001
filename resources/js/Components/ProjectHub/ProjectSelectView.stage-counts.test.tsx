// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type StageKind = 'product' | 'prototype' | 'mock' | 'idea-board';

type StageFixture = {
    kind: StageKind;
    name: string;
    description: string;
    status: 'available';
    iconKey: 'lightbulb' | 'layout' | 'rocket';
    route: string;
};

const fixtureState = vi.hoisted(() => ({
    stages: [] as StageFixture[],
}));

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
        visit: vi.fn(),
        replace: vi.fn(),
    },
    usePage: () => ({ url: '/projects' }),
}));

vi.mock('./projectData', () => ({
    getAdjacentProjectIndex: () => 0,
    projects: [
        {
            get kind() {
                return fixtureState.stages.length === 0
                    ? 'dedicated'
                    : 'staged';
            },
            id: 'logs',
            name: 'Fixture Project',
            description: 'ProjectSelectViewのstage表示用fixtureです。',
            iconKey: 'rocket',
            theme: {
                background: '#0e1b2b',
                backgroundGlow: '#38bdf8',
                sphere: '#22d3ee',
                sphereShadow: 'rgba(34, 211, 238, 0.38)',
                accent: '#facc15',
                surface: 'rgba(15, 23, 42, 0.62)',
                text: '#eef6ff',
                muted: '#bae6fd',
            },
            stages: fixtureState.stages,
            action: {
                name: 'アプリログ',
                description: 'Application log fixture',
                route: '/projects/logs',
                iconKey: 'rocket',
            },
        },
    ],
    sortStagesForProjectSelect: (stages: StageFixture[]) => [...stages],
}));

vi.mock('./projectNavigation', () => ({
    buildProjectSelectHref: () => '/projects',
    parseProjectSelectUrl: () => ({
        state: { screen: 'project-select', projectId: null },
        canonicalHref: '/projects',
        shouldCanonicalize: false,
    }),
}));

vi.mock('./usePrefersReducedMotion', () => ({
    default: () => true,
}));

import ProjectSelectView from './ProjectSelectView';

const stageFixtures: Record<StageKind, StageFixture> = {
    product: {
        kind: 'product',
        name: 'PRODUCT',
        description: 'Product fixture',
        status: 'available',
        iconKey: 'rocket',
        route: '/fixture/product',
    },
    prototype: {
        kind: 'prototype',
        name: 'PROTOTYPE',
        description: 'Prototype fixture',
        status: 'available',
        iconKey: 'rocket',
        route: '/fixture/prototype',
    },
    mock: {
        kind: 'mock',
        name: 'MOCK',
        description: 'Mock fixture',
        status: 'available',
        iconKey: 'layout',
        route: '/fixture/mock',
    },
    'idea-board': {
        kind: 'idea-board',
        name: 'IDEA BOARD',
        description: 'Idea board fixture',
        status: 'available',
        iconKey: 'lightbulb',
        route: '/fixture/idea-board',
    },
};

let container: HTMLDivElement;
let root: Root;

const stageCountCases: Array<[string, StageKind[]]> = [
    ['one supplied stage', ['product']],
    ['two supplied stages', ['product', 'mock']],
    ['three supplied stages', ['product', 'prototype', 'mock']],
    [
        'four supplied stages',
        ['product', 'prototype', 'mock', 'idea-board'],
    ],
];

function setSuppliedStages(stageKinds: StageKind[]) {
    fixtureState.stages.splice(
        0,
        fixtureState.stages.length,
        ...stageKinds.map((stageKind) => stageFixtures[stageKind]),
    );
}

function renderStageSelection(stageKinds: StageKind[]) {
    setSuppliedStages(stageKinds);
    act(() => root.render(<ProjectSelectView />));
    act(() => selectedSphere().click());
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

describe('ProjectSelectView supplied stage grid', () => {
    beforeEach(() => {
        (
            globalThis as typeof globalThis & {
                IS_REACT_ACT_ENVIRONMENT: boolean;
            }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it.each(stageCountCases)(
        'renders only %s in its matching stage grid',
        (_, stageKinds) => {
            renderStageSelection([...stageKinds]);

            const grid = container.querySelector(
                `.project-stage-grid--${stageKinds.length}`,
            );

            if (grid === null) {
                throw new Error(
                    `${stageKinds.length}件用のstage gridが見つかりません。`,
                );
            }

            const renderedStageNames = Array.from(
                grid.querySelectorAll<HTMLButtonElement>('.project-stage-action'),
            ).map((button) => button.querySelector('strong')?.textContent);

            expect(renderedStageNames).toEqual(
                stageKinds.map((stageKind) => stageFixtures[stageKind].name),
            );

            if (!stageKinds.includes('prototype')) {
                expect(grid.textContent).not.toContain('PROTOTYPE');
            }
        },
    );

    it('keeps the logs DedicatedProjectAction separate from stage cards', () => {
        renderStageSelection([]);

        expect(
            container.querySelector('.project-dedicated-action'),
        ).not.toBeNull();
        expect(container.querySelector('.project-stage-action')).toBeNull();
    });
});
