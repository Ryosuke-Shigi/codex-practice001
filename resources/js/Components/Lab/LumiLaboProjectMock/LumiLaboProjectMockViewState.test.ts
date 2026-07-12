import { describe, expect, it } from 'vitest';

import {
    createLumiLaboMockProjectSession,
    addProjectId,
    applyLumiLaboMockProjectSaveToCurrentDetail,
    canCompleteLumiLaboMockProjectSave,
    removeProjectId,
    setLumiLaboMockProjectDroppedFileNames,
    updateLumiLaboMockProjectSession,
} from './LumiLaboProjectMockView';
import { lumiLaboProjectDetail } from './mockData';

describe('LumiLaboProjectMockView project-scoped state', () => {
    it('keeps a completed save and saved media changes scoped to its project', () => {
        const projectA = createLumiLaboMockProjectSession(lumiLaboProjectDetail);
        const projectB = createLumiLaboMockProjectSession({
            ...lumiLaboProjectDetail,
            id: 'mock-project-002',
            companyName: '南海リフォーム',
            contactName: '田中 花子',
        });
        const sessions = {
            [projectA.detail.id]: projectA,
            [projectB.detail.id]: projectB,
        };

        const savedProjectA = updateLumiLaboMockProjectSession(
            sessions,
            projectA.detail.id,
            (session) => ({
                detail: {
                    ...session.detail,
                    companyName: 'ルミラボ工務店 保存後',
                    savedPhotos: session.detail.savedPhotos.slice(1),
                    savedFiles: session.detail.savedFiles.slice(1),
                },
                draft: {
                    ...session.draft,
                    companyName: 'ルミラボ工務店 保存後',
                },
            }),
        );

        expect(savedProjectA[projectA.detail.id]?.detail.companyName).toBe(
            'ルミラボ工務店 保存後',
        );
        expect(savedProjectA[projectA.detail.id]?.detail.savedPhotos).toHaveLength(
            2,
        );
        expect(savedProjectA[projectA.detail.id]?.detail.savedFiles).toHaveLength(
            1,
        );
        expect(savedProjectA[projectB.detail.id]).toBe(projectB);
        expect(savedProjectA[projectB.detail.id]?.detail.companyName).toBe(
            '南海リフォーム',
        );
        expect(savedProjectA[projectB.detail.id]?.detail.savedPhotos).toHaveLength(
            3,
        );
        expect(savedProjectA[projectB.detail.id]?.detail.savedFiles).toHaveLength(
            2,
        );
    });

    it('completes project A only when project B is now open', () => {
        const projectA = lumiLaboProjectDetail;
        const projectB = {
            ...lumiLaboProjectDetail,
            id: 'mock-project-002',
            companyName: '南海リフォーム',
        };
        const savedProjectA = {
            ...projectA,
            companyName: 'ルミラボ工務店 保存後',
        };

        const savingProjectIds = addProjectId(new Set(), projectA.id);
        const visibleDetailAfterCompletion =
            applyLumiLaboMockProjectSaveToCurrentDetail(
                projectB,
                projectA.id,
                savedProjectA,
            );
        const savingProjectIdsAfterCompletion = removeProjectId(
            savingProjectIds,
            projectA.id,
        );
        const savedProjectIdsAfterCompletion = addProjectId(
            new Set(),
            projectA.id,
        );

        expect(visibleDetailAfterCompletion).toBe(projectB);
        expect(savingProjectIds).toContain(projectA.id);
        expect(savingProjectIds).not.toContain(projectB.id);
        expect(savingProjectIdsAfterCompletion).not.toContain(projectB.id);
        expect(savedProjectIdsAfterCompletion).toContain(projectA.id);
        expect(savedProjectIdsAfterCompletion).not.toContain(projectB.id);
    });

    it('does not complete a timer for a deleted project', () => {
        const deletedProjectIds = new Set(['mock-project-001']);

        expect(
            canCompleteLumiLaboMockProjectSave(
                'mock-project-001',
                deletedProjectIds,
            ),
        ).toBe(false);
    });
    it('keeps selected file names scoped to their project', () => {
        const selectedForProjectA = setLumiLaboMockProjectDroppedFileNames(
            {},
            'mock-project-001',
            ['案件A資料.pdf'],
        );
        const selectedForBothProjects = setLumiLaboMockProjectDroppedFileNames(
            selectedForProjectA,
            'mock-project-002',
            ['案件B写真.zip'],
        );

        expect(selectedForBothProjects['mock-project-001']).toEqual([
            '案件A資料.pdf',
        ]);
        expect(selectedForBothProjects['mock-project-002']).toEqual([
            '案件B写真.zip',
        ]);
    });
});
