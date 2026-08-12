import { describe, expect, it } from 'vitest';

import { lumiLabProjectDetail } from './mockData';
import {
    applyLumiLabMockProjectSaveToCurrentDetail,
    canCompleteLumiLabMockProjectSave,
    completeLumiLabMockProjectSave,
    createLumiLabMockProjectSession,
    getLumiLabMockProjectCompanyNameValidationError,
    prepareLumiLabMockProjectSave,
    setLumiLabMockProjectCompanyNameValidationError,
    setLumiLabMockProjectDroppedFileNames,
    updateLumiLabMockProjectSession,
} from './LumiLabProjectMockView';
import type { LumiLabMockProjectDetailDraft } from './types';

const projectBDetail = {
    ...lumiLabProjectDetail,
    id: 'mock-project-002',
    companyName: '南海リフォーム',
    contactName: '田中 花子',
};

function createSavedDraft(
    overrides: Partial<LumiLabMockProjectDetailDraft> = {},
): LumiLabMockProjectDetailDraft {
    return {
        companyName: lumiLabProjectDetail.companyName,
        contactName: lumiLabProjectDetail.contactName,
        address: lumiLabProjectDetail.address,
        memo: lumiLabProjectDetail.memo,
        ...overrides,
    };
}

describe('LumiLabProjectMockView project-scoped state', () => {
    it('preserves draft and media changes made after a save began', () => {
        const savedDraft = createSavedDraft({
            companyName: '保存開始時の会社名',
        });
        const sessionAfterAdditionalChanges = {
            detail: {
                ...lumiLabProjectDetail,
                savedPhotos: lumiLabProjectDetail.savedPhotos.slice(1),
                savedFiles: lumiLabProjectDetail.savedFiles.slice(1),
            },
            draft: createSavedDraft({
                companyName: '保存開始後の会社名',
                memo: '保存開始後のメモ',
            }),
        };

        const completed = completeLumiLabMockProjectSave(
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
        const projectA = createLumiLabMockProjectSession(
            lumiLabProjectDetail,
        );
        const projectB = createLumiLabMockProjectSession(projectBDetail);
        const sessions = {
            [projectA.detail.id]: projectA,
            [projectB.detail.id]: projectB,
        };
        const savedDraft = createSavedDraft({
            companyName: '案件A保存後',
        });

        const visibleDetail = applyLumiLabMockProjectSaveToCurrentDetail(
            projectB.detail,
            projectA.detail.id,
            savedDraft,
        );
        const completedSessions = updateLumiLabMockProjectSession(
            sessions,
            projectA.detail.id,
            (session) =>
                completeLumiLabMockProjectSave(session, savedDraft).session,
        );

        expect(visibleDetail).toBe(projectB.detail);
        expect(completedSessions[projectA.detail.id]?.detail.companyName).toBe(
            '案件A保存後',
        );
        expect(completedSessions[projectB.detail.id]).toBe(projectB);
    });

    it('does not complete or restore a project deleted while saving', () => {
        const projectId = lumiLabProjectDetail.id;
        const deletedProjectIds = new Set([projectId]);
        const savedDraft = createSavedDraft({ companyName: '復活させない' });
        const completion = canCompleteLumiLabMockProjectSave(
            projectId,
            deletedProjectIds,
        )
            ? applyLumiLabMockProjectSaveToCurrentDetail(
                  null,
                  projectId,
                  savedDraft,
              )
            : null;

        expect(
            canCompleteLumiLabMockProjectSave(projectId, deletedProjectIds),
        ).toBe(false);
        expect(completion).toBeNull();
    });

    it('keeps sessions and selected file names separated by project', () => {
        const projectA = createLumiLabMockProjectSession(
            lumiLabProjectDetail,
        );
        const projectB = createLumiLabMockProjectSession(projectBDetail);
        const sessions = {
            [projectA.detail.id]: projectA,
            [projectB.detail.id]: projectB,
        };
        const updatedSessions = updateLumiLabMockProjectSession(
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
        const projectAFiles = setLumiLabMockProjectDroppedFileNames(
            {},
            projectA.detail.id,
            ['案件A資料.pdf'],
        );
        const projectFiles = setLumiLabMockProjectDroppedFileNames(
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
            detail: lumiLabProjectDetail,
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
            completeLumiLabMockProjectSave(matchingSession, savedDraft)
                .hasUnsavedChanges,
        ).toBe(false);
        expect(
            completeLumiLabMockProjectSave(changedSession, savedDraft)
                .hasUnsavedChanges,
        ).toBe(true);
    });

    it('keeps company-name validation errors scoped to each project', () => {
        const projectAErrors =
            setLumiLabMockProjectCompanyNameValidationError(
                {},
                lumiLabProjectDetail.id,
                '会社名を入力してください',
            );
        const projectErrors = setLumiLabMockProjectCompanyNameValidationError(
            projectAErrors,
            projectBDetail.id,
            '会社名を入力してください',
        );
        const clearedProjectA =
            setLumiLabMockProjectCompanyNameValidationError(
                projectErrors,
                lumiLabProjectDetail.id,
                null,
            );

        expect(projectErrors).toEqual({
            [lumiLabProjectDetail.id]: '会社名を入力してください',
            [projectBDetail.id]: '会社名を入力してください',
        });
        expect(clearedProjectA).toEqual({
            [projectBDetail.id]: '会社名を入力してください',
        });
        expect(getLumiLabMockProjectCompanyNameValidationError('　')).toBe(
            '会社名を入力してください',
        );
        expect(prepareLumiLabMockProjectSave(createSavedDraft())).toEqual({
            isValid: true,
            savedDraft: createSavedDraft(),
        });
    });
});
