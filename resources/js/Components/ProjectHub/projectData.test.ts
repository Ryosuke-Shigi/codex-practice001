import { describe, expect, it } from 'vitest';

import { projects, sortStagesForProjectHub } from './projectData';

describe('ProjectHub static project data', () => {
    it('keeps the existing portfolio project entries without a fake portfolio project', () => {
        expect(projects.map((project) => project.id)).toEqual([
            'api-discovery-hub',
            'dance-shorts',
            'japan-quake-wave-map',
            'construction-order',
            'spec-flow-trainer',
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
});
