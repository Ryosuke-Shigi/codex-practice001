import { describe, expect, it } from 'vitest';

import { lumiLaboProjectDetail } from './mockData';
import {
    applyLumiLaboMockProjectSaveToCurrentDetail,
    canCompleteLumiLaboMockProjectSave,
    completeLumiLaboMockProjectSave,
    createLumiLaboMockProjectSession,
    getLumiLaboMockProjectCompanyNameValidationError,
    prepareLumiLaboMockProjectSave,
    setLumiLaboMockProjectCompanyNameValidationError,
    setLumiLaboMockProjectDroppedFileNames,
    updateLumiLaboMockProjectSession,
} from './LumiLaboProjectMockView';
import type { LumiLaboMockProjectDetailDraft } from './types';

const projectBDetail = {
    ...lumiLaboProjectDetail,
    id: 'mock-project-002',
    companyName: '南海リフォーム',
    contactName: '田中 花子',
};

function createSavedDraft(
    overrides: Partial<LumiLaboMockProjectDetailDraft> = {},
): LumiLaboMockProjectDetailDraft {
    return {
        companyName: lumiLaboProjectDetail.companyName,
        contactName: lumiLaboProjectDetail.contactName,
        address: lumiLaboProjectDetail.address,
        memo: lumiLaboProjectDetail.memo,
        ...overrides,
    };
}

describe('LumiLaboProjectMockView project-scoped state', () => {
    it('preserves draft and media changes made after a save began', () => {
        const savedDraft = createSavedDraft({
            companyName: '保存開始時の会社名',
        });
        const sessionAfterAdditionalChanges = {
            detail: {
                ...lumiLaboProjectDetail,
                savedPhotos: lumiLaboProjectDetail.savedPhotos.slice(1),
                savedFiles: lumiLaboProjectDetail.savedFiles.slice(1),
            },
            draft: createSavedDraft({
                companyName: '保存開始後の会社名',
                memo: '保存開始後のメモ',
            }),
        };

        const completed = completeLumiLaboMockProjectSave(
            sessionAfterAdditionalChanges,
            savedDraft,
        );

        expect(completed.session.detail.companyName).toBe(
            '保存開始時の会社名',
        );
        expect(completed.session.detail.savedPhotos).toHaveLength(2);
        expect(completed.session.detail.savedFiles).toHaveLength(1);
        expect(completed.session.draft.companyName).toBe(
            '保存開始後の会社名',
        );
        expect(completed.session.draft.memo).toBe('保存開始後のメモ');
        expect(completed.hasUnsavedChanges).toBe(true);
    });

    it('completes only the saving project after another project is opened', () => {
        const projectA = createLumiLaboMockProjectSession(
            lumiLaboProjectDetail,
        );
        const projectB = createLumiLaboMockProjectSession(projectBDetail);
        const sessions = {
            [projectA.detail.id]: projectA,
            [projectB.detail.id]: projectB,
        };
        const savedDraft = createSavedDraft({
            companyName: '案件A保存後',
        });

        const visibleDetail = applyLumiLaboMockProjectSaveToCurrentDetail(
            projectB.detail,
            projectA.detail.id,
            savedDraft,
        );
        const completedSessions = updateLumiLaboMockProjectSession(
            sessions,
            projectA.detail.id,
            (session) =>
                completeLumiLaboMockProjectSave(session, savedDraft).session,
        );

        expect(visibleDetail).toBe(projectB.detail);
        expect(completedSessions[projectA.detail.id]?.detail.companyName).toBe(
            '案件A保存後',
        );
        expect(completedSessions[projectB.detail.id]).toBe(projectB);
    });

    it('does not complete or restore a project deleted while saving', () => {
        const projectId = lumiLaboProjectDetail.id;
        const deletedProjectIds = new Set([projectId]);
        const savedDraft = createSavedDraft({ companyName: '復活させない' });
        const completion = canCompleteLumiLaboMockProjectSave(
            projectId,
            deletedProjectIds,
        )
            ? applyLumiLaboMockProjectSaveToCurrentDetail(
                  null,
                  projectId,
                  savedDraft,
              )
            : null;

        expect(
            canCompleteLumiLaboMockProjectSave(projectId, deletedProjectIds),
        ).toBe(false);
        expect(completion).toBeNull();
    });

    it('keeps sessions and selected file names separated by project', () => {
        const projectA = createLumiLaboMockProjectSession(
            lumiLaboProjectDetail,
        );
        const projectB = createLumiLaboMockProjectSession(projectBDetail);
        const sessions = {
            [projectA.detail.id]: projectA,
            [projectB.detail.id]: projectB,
        };
        const updatedSessions = updateLumiLaboMockProjectSession(
            sessions,
            projectA.detail.id,
            (session) => ({
                ...session,
                draft: {
                    ...session.draft,
                    memo: '案件Aだけのメモ',
                },
            }),
        );
        const projectAFiles = setLumiLaboMockProjectDroppedFileNames(
            {},
            projectA.detail.id,
            ['案件A資料.pdf'],
        );
        const projectFiles = setLumiLaboMockProjectDroppedFileNames(
            projectAFiles,
            projectB.detail.id,
            ['案件B写真.zip'],
        );

        expect(updatedSessions[projectA.detail.id]?.draft.memo).toBe(
            '案件Aだけのメモ',
        );
        expect(updatedSessions[projectB.detail.id]).toBe(projectB);
        expect(projectFiles).toEqual({
            [projectA.detail.id]: ['案件A資料.pdf'],
            [projectB.detail.id]: ['案件B写真.zip'],
        });
    });

    it('compares the latest draft with the saved snapshot', () => {
        const savedDraft = createSavedDraft({ companyName: '保存対象' });
        const matchingSession = {
            detail: lumiLaboProjectDetail,
            draft: savedDraft,
        };
        const changedSession = {
            ...matchingSession,
            draft: {
                ...savedDraft,
                memo: '保存開始後の変更',
            },
        };

        expect(
            completeLumiLaboMockProjectSave(matchingSession, savedDraft)
                .hasUnsavedChanges,
        ).toBe(false);
        expect(
            completeLumiLaboMockProjectSave(changedSession, savedDraft)
                .hasUnsavedChanges,
        ).toBe(true);
    });

    it('keeps company-name validation errors scoped to each project', () => {
        const projectAErrors =
            setLumiLaboMockProjectCompanyNameValidationError(
                {},
                lumiLaboProjectDetail.id,
                '会社名を入力してください',
            );
        const projectErrors = setLumiLaboMockProjectCompanyNameValidationError(
            projectAErrors,
            projectBDetail.id,
            '会社名を入力してください',
        );
        const clearedProjectA =
            setLumiLaboMockProjectCompanyNameValidationError(
                projectErrors,
                lumiLaboProjectDetail.id,
                null,
            );

        expect(projectErrors).toEqual({
            [lumiLaboProjectDetail.id]: '会社名を入力してください',
            [projectBDetail.id]: '会社名を入力してください',
        });
        expect(clearedProjectA).toEqual({
            [projectBDetail.id]: '会社名を入力してください',
        });
        expect(getLumiLaboMockProjectCompanyNameValidationError('　')).toBe(
            '会社名を入力してください',
        );
        expect(prepareLumiLaboMockProjectSave(createSavedDraft())).toEqual({
            isValid: true,
            savedDraft: createSavedDraft(),
        });
    });
});
