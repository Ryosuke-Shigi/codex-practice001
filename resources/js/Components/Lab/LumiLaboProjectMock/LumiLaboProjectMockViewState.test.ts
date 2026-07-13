import { describe, expect, it } from 'vitest';

import {
    createLumiLaboMockProjectSession,
    completeLumiLaboMockProjectSave,
    addProjectId,
    applyLumiLaboMockProjectSaveToCurrentDetail,
    applyLumiLaboMockProjectSaveToSession,
    canCompleteLumiLaboMockProjectSave,
    createLumiLaboMockInitialDeletedProjectIds,
    createLumiLaboProjectListRefreshState,
    createProjectOverrideRecord,
    getLumiLaboMockProjectCompanyNameValidationError,
    prepareLumiLaboMockProjectSave,
    reduceLumiLaboProjectListRefreshState,
    removeProjectId,
    setLumiLaboMockProjectCompanyNameValidationError,
    setLumiLaboMockProjectDroppedFileNames,
    updateLumiLaboMockProjectSession,
} from './LumiLaboProjectMockView';
import {
    createLumiLaboProjectListRequestData,
    getNextLumiLaboProjectListRefreshRevision,
} from './LumiLaboProjectListPanel';
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

    it('rejects empty and whitespace-only company names before a save snapshot is created', () => {
        for (const companyName of [
            '',
            '   ',
            '　',
            '\t',
            '\n',
            ' \t\n　\n ',
        ]) {
            const preparation = prepareLumiLaboMockProjectSave({
                companyName,
                contactName: lumiLaboProjectDetail.contactName,
                address: lumiLaboProjectDetail.address,
                memo: lumiLaboProjectDetail.memo,
            });

            expect(
                getLumiLaboMockProjectCompanyNameValidationError(companyName),
            ).toBe('会社名を入力してください');
            expect(preparation).toEqual({
                isValid: false,
                validationError: '会社名を入力してください',
            });
            expect(preparation).not.toHaveProperty('savedDraft');
        }
    });

    it('preserves a valid company name exactly when preparing a save', () => {
        const preparation = prepareLumiLaboMockProjectSave({
            companyName: '  有効な会社名  ',
            contactName: '',
            address: '',
            memo: '',
        });

        expect(preparation).toEqual({
            isValid: true,
            savedDraft: {
                companyName: '  有効な会社名  ',
                contactName: '',
                address: '',
                memo: '',
            },
        });
    });

    it('keeps company name validation errors scoped to the invalid project and clears only that error after valid input or deletion', () => {
        const projectAError =
            setLumiLaboMockProjectCompanyNameValidationError(
                {},
                'mock-project-001',
                '会社名を入力してください',
            );
        const projectErrors = setLumiLaboMockProjectCompanyNameValidationError(
            projectAError,
            'mock-project-002',
            '会社名を入力してください',
        );
        const validProjectA =
            setLumiLaboMockProjectCompanyNameValidationError(
                projectErrors,
                'mock-project-001',
                null,
            );
        const deletedProjectB =
            setLumiLaboMockProjectCompanyNameValidationError(
                validProjectA,
                'mock-project-002',
                null,
            );

        expect(projectErrors).toEqual({
            'mock-project-001': '会社名を入力してください',
            'mock-project-002': '会社名を入力してください',
        });
        expect(validProjectA).toEqual({
            'mock-project-002': '会社名を入力してください',
        });
        expect(deletedProjectB).toEqual({});
    });

    it('keeps a blank edit unsaved after an earlier valid save completes', () => {
        const savedDraft = {
            companyName: '保存開始時の会社名',
            contactName: lumiLaboProjectDetail.contactName,
            address: lumiLaboProjectDetail.address,
            memo: lumiLaboProjectDetail.memo,
        };
        const sessionWithLatestBlankDraft = {
            detail: lumiLaboProjectDetail,
            draft: {
                ...savedDraft,
                companyName: '　',
            },
        };
        const completedSave = completeLumiLaboMockProjectSave(
            sessionWithLatestBlankDraft,
            savedDraft,
        );

        expect(completedSave.session.detail.companyName).toBe('保存開始時の会社名');
        expect(completedSave.session.draft.companyName).toBe('　');
        expect(completedSave.hasUnsavedChanges).toBe(true);
        expect(
            prepareLumiLaboMockProjectSave(completedSave.session.draft),
        ).toEqual({
            isValid: false,
            validationError: '会社名を入力してください',
        });
    });

    it('keeps refresh lifecycle state in the parent scope across a successful panel remount', () => {
        let parentRefreshState = reduceLumiLaboProjectListRefreshState(
            createLumiLaboProjectListRefreshState(),
            { type: 'request' },
        );
        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'start', revision: 1 },
        );
        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'success', revision: 1 },
        );

        expect(parentRefreshState).toMatchObject({
            requestedRevision: 1,
            activeRevision: null,
            successfulRevision: 1,
            failedRefresh: null,
        });
        expect(
            getNextLumiLaboProjectListRefreshRevision(
                parentRefreshState.requestedRevision,
                parentRefreshState.successfulRevision,
                parentRefreshState.activeRevision,
                parentRefreshState.activeNormalRequestId,
                parentRefreshState.failedRefresh?.revision ?? null,
            ),
        ).toBeNull();
    });

    it('does not duplicate an active refresh and retains a failed retry request after remounting', () => {
        const requestData = createLumiLaboProjectListRequestData(
            {
                keyword: '岸和田',
                sort: 'registered_asc',
                page: 2,
                perPage: 5,
            },
            ['mock-project-001'],
        );
        let parentRefreshState = reduceLumiLaboProjectListRefreshState(
            createLumiLaboProjectListRefreshState(),
            { type: 'request' },
        );
        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'start', revision: 1 },
        );

        expect(
            getNextLumiLaboProjectListRefreshRevision(
                parentRefreshState.requestedRevision,
                parentRefreshState.successfulRevision,
                parentRefreshState.activeRevision,
                parentRefreshState.activeNormalRequestId,
                parentRefreshState.failedRefresh?.revision ?? null,
            ),
        ).toBeNull();

        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'failure', revision: 1, requestData },
        );

        expect(parentRefreshState.activeRevision).toBeNull();
        expect(parentRefreshState.failedRefresh).toEqual({
            revision: 1,
            requestData,
        });
        expect(
            getNextLumiLaboProjectListRefreshRevision(
                parentRefreshState.requestedRevision,
                parentRefreshState.successfulRevision,
                parentRefreshState.activeRevision,
                parentRefreshState.activeNormalRequestId,
                parentRefreshState.failedRefresh?.revision ?? null,
            ),
        ).toBeNull();

        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'start', revision: 1 },
        );

        expect(parentRefreshState.activeRevision).toBe(1);
        expect(parentRefreshState.failedRefresh).toBeNull();
    });

    it('starts the latest pending revision only after the earlier refresh resolves', () => {
        let parentRefreshState = reduceLumiLaboProjectListRefreshState(
            createLumiLaboProjectListRefreshState(),
            { type: 'request' },
        );
        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'start', revision: 1 },
        );
        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'request' },
        );
        parentRefreshState = reduceLumiLaboProjectListRefreshState(
            parentRefreshState,
            { type: 'success', revision: 1 },
        );

        expect(parentRefreshState.successfulRevision).toBe(1);
        expect(parentRefreshState.requestedRevision).toBe(2);
        expect(
            getNextLumiLaboProjectListRefreshRevision(
                parentRefreshState.requestedRevision,
                parentRefreshState.successfulRevision,
                parentRefreshState.activeRevision,
                parentRefreshState.activeNormalRequestId,
                parentRefreshState.failedRefresh?.revision ?? null,
            ),
        ).toBe(2);

        const latestSuccess = reduceLumiLaboProjectListRefreshState(
            {
                ...parentRefreshState,
                activeRevision: 2,
                successfulRevision: 2,
            },
            { type: 'success', revision: 1 },
        );

        expect(latestSuccess.successfulRevision).toBe(2);
        expect(latestSuccess.activeRevision).toBe(2);
        expect(
            getNextLumiLaboProjectListRefreshRevision(0, 0, null, null, null),
        ).toBeNull();
    });

    it('does not start another revision while a matching revision is already active', () => {
        const activeState = {
            ...createLumiLaboProjectListRefreshState(),
            requestedRevision: 1,
            activeRevision: 1,
        };

        expect(
            reduceLumiLaboProjectListRefreshState(activeState, {
                type: 'start',
                revision: 1,
            }),
        ).toBe(activeState);
    });
});
