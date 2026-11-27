// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Select from '@/Pages/Projects/Select';

vi.mock('@/Components/Effects/AquaParticlesBackground', () => ({ default: () => null }));

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
    usePage: () => ({ url: '/projects?project=api-discovery-hub&view=stages' }),
}));

vi.mock('./projectData', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./projectData')>();
    const project = actual.projects.find((candidate) => candidate.id === 'api-discovery-hub');
    if (project?.kind !== 'staged') {
        throw new Error('段階表示用の作品定義が見つかりません。');
    }
    const fixtureProject = { ...project, stages: fixtureState.stages };
    return {
        ...actual,
        getProjectById: (id: string) => id === fixtureProject.id ? fixtureProject : null,
    };
});

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
    act(() => root.render(<Select />));
}

describe('ProjectSelectView supplied stage grid', () => {
    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
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
});
