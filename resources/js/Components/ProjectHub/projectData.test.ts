import { describe, expect, it } from 'vitest';

import {
    getProjectStageSelectHref,
    projects,
    sortStagesForProjectSelect,
    type Stage,
    type StageKind,
} from './projectData';

const normalProjectStageRoutes = {
    'api-discovery-hub': {
        product: '/api-catalog',
        mock: '/api-catalog/mock',
        'idea-board': '/lab/api-discovery-hub-idea-board',
    },
    'dance-shorts-radar': {
        product: '/dance-shorts-radar',
        mock: '/lab/dance-shorts-radar-mock',
        'idea-board': '/lab/dance-shorts-radar-idea-board',
    },
    'dance-shorts-analyzer': {
        product: '/dance-shorts-analyzer',
        mock: '/lab/dance-shorts-analyzer-mock',
        'idea-board': '/lab/dance-shorts-analyzer-idea-board',
    },
    'japan-quake-wave-map': {
        product: '/quakewave-preview/map',
        mock: '/quakewave-preview',
        'idea-board': '/lab/quake-wave-map-idea-board',
    },
    lumilabo: {
        mock: '/lab/lumilabo-project-mock',
        'idea-board': '/lab/lumilabo-project-idea-board',
    },
    'construction-order': {
        mock: '/lab/construction-order-workflow-mock',
        'idea-board': '/lab/construction-order-workflow-idea-board',
    },
    'event-card-calendar': {
        'idea-board': '/lab/event-card-calendar-idea-board',
    },
} as const;

describe('Project selection data contract', () => {
    it('keeps the eight project entries and never recreates a combined DanceShorts project', () => {
        expect(projects.map((project) => project.id)).toEqual([
            'api-discovery-hub',
            'dance-shorts-radar',
            'dance-shorts-analyzer',
            'japan-quake-wave-map',
            'lumilabo',
            'construction-order',
            'event-card-calendar',
            'logs',
        ]);
        expect(projects.map((project) => project.id)).not.toContain('dance-shorts');
    });

    it('exposes only existing direct stages for every normal project, without modules or prototype', () => {
        const normalProjects = projects.filter((project) => project.id !== 'logs');

        expect(normalProjects).toHaveLength(7);
        expect(
            normalProjects.flatMap((project) =>
                project.stages.map((stage) => stage.kind),
            ),
        ).not.toContain('prototype');

        normalProjects.forEach((project) => {
            const expectedRoutes = normalProjectStageRoutes[project.id];

            expect(expectedRoutes).toBeDefined();
            expect(project.stages.every((stage) => stage.route !== undefined)).toBe(true);
            expect(project.stages.every((stage) => !('modules' in stage))).toBe(true);
            expect(
                Object.fromEntries(
                    project.stages.map((stage) => [stage.kind, stage.route]),
                ),
            ).toEqual(expectedRoutes);
        });
    });

    it('keeps Radar and Analyzer visually and semantically separate', () => {
        const radar = projects.find(
            (project) => project.id === 'dance-shorts-radar',
        );
        const analyzer = projects.find(
            (project) => project.id === 'dance-shorts-analyzer',
        );

        expect(radar?.name).toBe('DanceShortsRadar');
        expect(analyzer?.name).toBe('DanceShortsAnalyzer');
        expect(radar?.iconKey).not.toBe(analyzer?.iconKey);
        expect(radar?.theme).not.toEqual(analyzer?.theme);
        expect(radar?.description).not.toBe(analyzer?.description);
        expect(radar?.stages.map((stage) => stage.route)).not.toEqual(
            analyzer?.stages.map((stage) => stage.route),
        );
    });

    it('keeps logs as the only dedicated action without fictional stages', () => {
        const logs = projects.find((project) => project.id === 'logs');

        expect(logs?.stages).toEqual([]);
        expect(getProjectStageSelectHref('logs')).toBe('/projects');
    });

    it.each(Object.keys(normalProjectStageRoutes))(
        'builds a reload-safe stage selection URL for %s',
        (projectId) => {
            expect(getProjectStageSelectHref(projectId)).toBe(
                `/projects?project=${projectId}&view=stages`,
            );
        },
    );

    it('preserves supplied stage order without inventing missing stage kinds', () => {
        const stageByKind = new Map<StageKind, Stage>([
            ['product', stageFixture('product')],
            ['prototype', stageFixture('prototype')],
            ['mock', stageFixture('mock')],
            ['idea-board', stageFixture('idea-board')],
        ]);

        expect(
            sortStagesForProjectSelect(
                (['idea-board', 'product', 'mock'] satisfies StageKind[]).map(
                    (kind) => stageByKind.get(kind)!,
                ),
            ).map((stage) => stage.kind),
        ).toEqual(['product', 'mock', 'idea-board']);
    });
});

function stageFixture(kind: StageKind): Stage {
    return {
        kind,
        name: kind.toUpperCase(),
        description: `${kind} stage fixture`,
        status: 'available',
        iconKey: 'rocket',
        route: `/fixture/${kind}`,
    };
}
