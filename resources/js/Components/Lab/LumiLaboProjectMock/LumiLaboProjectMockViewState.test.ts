import { describe, expect, it } from 'vitest';

import {
    createLumiLaboMockProjectSession,
    completeLumiLaboMockProjectSave,
    addProjectId,
    applyLumiLaboMockProjectSaveToCurrentDetail,
    applyLumiLaboMockProjectSaveToSession,
    canCompleteLumiLaboMockProjectSave,
    createLumiLaboMockInitialDeletedProjectIds,
    createProjectOverrideRecord,
    removeProjectId,
    setLumiLaboMockProjectDroppedFileNames,
    updateLumiLaboMockProjectSession,
} from './LumiLaboProjectMockView';
import { createLumiLaboProjectListRequestData } from './LumiLaboProjectListPanel';
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
        const savedProjectADraft = {
            companyName: 'ルミラボ工務店 保存後',
            contactName: projectA.contactName,
            address: projectA.address,
            memo: projectA.memo,
        };

        const savingProjectIds = addProjectId(new Set(), projectA.id);
        const visibleDetailAfterCompletion =
            applyLumiLaboMockProjectSaveToCurrentDetail(
                projectB,
                projectA.id,
                savedProjectADraft,
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

    it('preserves draft and media changes made after a save began', () => {
        const sessionAfterChanges = {
            detail: {
                ...lumiLaboProjectDetail,
                savedPhotos: lumiLaboProjectDetail.savedPhotos.slice(1),
                savedFiles: lumiLaboProjectDetail.savedFiles.slice(1),
            },
            draft: {
                companyName: '保存開始後の会社名',
                contactName: lumiLaboProjectDetail.contactName,
                address: lumiLaboProjectDetail.address,
                memo: '保存開始後のメモ',
            },
        };
        const savedDraft = {
            companyName: 'ルミラボ工務店 保存後',
            contactName: lumiLaboProjectDetail.contactName,
            address: lumiLaboProjectDetail.address,
            memo: lumiLaboProjectDetail.memo,
        };
        const completedSession = applyLumiLaboMockProjectSaveToSession(
            sessionAfterChanges,
            savedDraft,
        );

        expect(completedSession.detail.companyName).toBe(
            'ルミラボ工務店 保存後',
        );
        expect(completedSession.detail.savedPhotos).toHaveLength(2);
        expect(completedSession.detail.savedFiles).toHaveLength(1);
        expect(completedSession.draft.companyName).toBe('保存開始後の会社名');
        expect(completedSession.draft.memo).toBe('保存開始後のメモ');

        const completedSave = completeLumiLaboMockProjectSave(
            sessionAfterChanges,
            savedDraft,
        );

        expect(completedSave.hasUnsavedChanges).toBe(true);
        expect(completedSave.session.detail.companyName).toBe(
            'ルミラボ工務店 保存後',
        );
        expect(completedSave.session.draft.companyName).toBe(
            '保存開始後の会社名',
        );
    });

    it('marks a save as complete only when the latest draft matches its saved snapshot', () => {
        const savedDraft = {
            companyName: 'ルミラボ工務店 保存後',
            contactName: lumiLaboProjectDetail.contactName,
            address: lumiLaboProjectDetail.address,
            memo: lumiLaboProjectDetail.memo,
        };
        const session = {
            detail: lumiLaboProjectDetail,
            draft: savedDraft,
        };

        expect(
            completeLumiLaboMockProjectSave(session, savedDraft)
                .hasUnsavedChanges,
        ).toBe(false);
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

    it('creates initial query state as project-keyed records and request data without hook call ordering', () => {
        const deletedProjectIds = createLumiLaboMockInitialDeletedProjectIds([
            'mock-project-003',
            'mock-project-007',
        ]);
        const projectOverrides = createProjectOverrideRecord([
            {
                id: 'mock-project-001',
                companyName: '初期会社A',
                contactName: '',
                address: '大阪府岸和田市',
                memo: '',
            },
            {
                id: 'mock-project-002',
                companyName: '初期会社B',
                contactName: '田中 花子',
                address: '',
                memo: '初期メモB',
            },
        ]);

        expect(deletedProjectIds).toEqual(
            new Set(['mock-project-003', 'mock-project-007']),
        );
        expect(projectOverrides).toEqual({
            'mock-project-001': {
                companyName: '初期会社A',
                contactName: '',
                address: '大阪府岸和田市',
                memo: '',
            },
            'mock-project-002': {
                companyName: '初期会社B',
                contactName: '田中 花子',
                address: '',
                memo: '初期メモB',
            },
        });
        expect(
            createLumiLaboProjectListRequestData(
                {
                    keyword: '',
                    sort: 'registered_desc',
                    page: 1,
                    perPage: 5,
                },
                Array.from(deletedProjectIds),
                projectOverrides,
            ),
        ).toMatchObject({
            deleted_ids: ['mock-project-003', 'mock-project-007'],
            overrides: [
                {
                    id: 'mock-project-001',
                    company_name: '初期会社A',
                },
                {
                    id: 'mock-project-002',
                    company_name: '初期会社B',
                },
            ],
        });
    });

    it('creates empty query state when the route has no initial override props', () => {
        expect(createLumiLaboMockInitialDeletedProjectIds([])).toEqual(new Set());
        expect(createProjectOverrideRecord([])).toEqual({});
    });
});
