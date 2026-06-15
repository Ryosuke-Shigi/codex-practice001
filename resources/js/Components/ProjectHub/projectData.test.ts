import { describe, expect, it } from 'vitest';

import { projects, sortStagesForProjectHub } from './projectData';

describe('ProjectHub static project data', () => {
    it('keeps the existing portfolio project entries without a fake portfolio project', () => {
        expect(projects.map((project) => project.id)).toEqual([
            'api-discovery-hub',
            'dance-shorts',
            'japan-quake-wave-map',
            'construction-order',
        ]);
    });

    it('does not show prototype stages when no prototype exists', () => {
        expect(
            projects.flatMap((project) =>
                project.stages.map((stage) => stage.kind),
            ),
        ).not.toContain('prototype');
    });

    it('orders Project Hub stages from product to idea board', () => {
        const danceShorts = projects.find(
            (project) => project.id === 'dance-shorts',
        );

        expect(danceShorts).toBeDefined();
        expect(
            sortStagesForProjectHub(danceShorts?.stages ?? []).map(
                (stage) => stage.kind,
            ),
        ).toEqual(['product', 'mock', 'idea-board']);
    });

    it('keeps current Project Hub routes without legacy Lab selection URLs', () => {
        const routes = projects.flatMap((project) =>
            project.stages.flatMap((stage) => [
                stage.route,
                ...(stage.modules?.map((module) => module.route) ?? []),
            ]),
        ).filter((route): route is string => route !== undefined);

        expect(routes).toContain('/lab/construction-order-workflow-idea-board');
        expect(routes).toContain('/lab/construction-order-workflow-mock');
        expect(routes).not.toContain('/lab');
        expect(routes).not.toContain('/lab/construction-order-new-mock');
        expect(routes).not.toContain('/lab/construction-order-workflow-pp');
        expect(routes).not.toContain('/lab/api-discovery-hub-pp');
        expect(routes).not.toContain('/lab/quake-wave-map-pp');
        expect(routes.some((route) => route.includes('category='))).toBe(false);
    });
});
