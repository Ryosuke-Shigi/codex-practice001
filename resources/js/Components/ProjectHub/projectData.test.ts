import { describe, expect, it } from 'vitest';

import { projects, sortStagesForProjectHub } from './projectData';

describe('ProjectHub static project data', () => {
    it('keeps the existing portfolio project entries without a fake portfolio project', () => {
        expect(projects.map((project) => project.id)).toEqual([
            'api-discovery-hub',
            'dance-shorts',
            'japan-quake-wave-map',
            'lumilabo',
            'construction-order',
            'event-card-calendar',
            'logs',
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

    it('keeps LumiLabo as an upper project with a project system idea board', () => {
        const lumiLabo = projects.find((project) => project.id === 'lumilabo');

        expect(lumiLabo).toBeDefined();
        expect(lumiLabo?.name).toBe('LumiLabo');
        expect(lumiLabo?.description).toContain('上位プロダクト');
        expect(lumiLabo?.description).toContain('案件システム');
        expect(lumiLabo?.theme.background).toBe('#111827');
        expect(lumiLabo?.theme.sphere).toBe('#facc15');
        expect(lumiLabo?.theme.text).toBe('#fffbea');

        const ideaBoardStage = lumiLabo?.stages.find(
            (stage) => stage.kind === 'idea-board',
        );

        expect(ideaBoardStage?.description).toContain('案件作成');
        expect(ideaBoardStage?.description).toContain('登録項目');
        expect(ideaBoardStage?.modules?.map((module) => module.name)).toEqual([
            '案件システム',
        ]);
        expect(ideaBoardStage?.modules?.[0].route).toBe(
            '/lab/lumilabo-project-idea-board',
        );
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
        expect(routes).toContain('/lab/event-card-calendar-idea-board');
        expect(routes).toContain('/lab/lumilabo-project-idea-board');
        expect(routes).not.toContain('/lab');
        expect(routes).not.toContain('/lab/construction-order-new-mock');
        expect(routes).not.toContain('/lab/construction-order-workflow-pp');
        expect(routes).not.toContain('/lab/api-discovery-hub-pp');
        expect(routes).not.toContain('/lab/quake-wave-map-pp');
        expect(routes.some((route) => route.includes('category='))).toBe(false);
    });

    it('keeps coding-only EventDeck wording out of Project Hub copy', () => {
        const eventProject = projects.find(
            (project) => project.id === 'event-card-calendar',
        );

        expect(eventProject).toBeDefined();

        const projectText = [
            eventProject?.name,
            eventProject?.description,
            ...(eventProject?.stages.flatMap((stage) => [
                stage.name,
                stage.description,
                ...(stage.modules?.flatMap((module) => [
                    module.name,
                    module.description,
                ]) ?? []),
            ]) ?? []),
        ]
            .filter((text): text is string => text !== undefined)
            .join('\n');

        const eventDeckLabel = ['EventDeck', 'イベントデッキ'].join(' / ');

        expect(projectText).not.toContain(eventDeckLabel);
    });
});
