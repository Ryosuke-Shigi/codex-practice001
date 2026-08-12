import { describe, expect, it } from 'vitest';

import {
    createLumiLabProjectDetail,
    lumiLabGlobalTabs,
    lumiLabProjectActionTabs,
    lumiLabProjectBackAccessibleLabel,
    lumiLabProjectBackLabel,
    lumiLabProjectDeleteActionLabel,
    lumiLabProjectDeleteConfirmMessage,
    lumiLabProjectDeleteConfirmNoLabel,
    lumiLabProjectDeleteConfirmYesLabel,
    lumiLabProjectDetailBackLabel,
    lumiLabProjectDetailBackAccessibleLabel,
    lumiLabProjectDetailEditingLabel,
    lumiLabProjectDetailSaveLabel,
    lumiLabProjectDetailSavingLabel,
    lumiLabProjectDetail,
    lumiLabProjectDetailSavedMessage,
    lumiLabProjectItem,
    lumiLabProjectRegisterPanel,
    lumiLabProjectTabs,
    lumiLabProjectTopBackAccessibleLabel,
    lumiLabTopReturnAccessibleLabel,
    lumiLabTopReturnLabel,
} from './mockData';

function collectMockText(): string {
    return [
        ...lumiLabGlobalTabs.map((tab) => tab.label),
        ...lumiLabProjectTabs.map((tab) => tab.label),
        lumiLabProjectItem.label,
        lumiLabTopReturnLabel,
        lumiLabProjectRegisterPanel.title,
        ...lumiLabProjectRegisterPanel.fields.map((field) => field.label),
        lumiLabProjectBackLabel,
        lumiLabProjectDetailBackLabel,
        lumiLabProjectDetail.companyName,
        lumiLabProjectDetail.contactName,
        lumiLabProjectDetail.address,
        lumiLabProjectDetail.memo,
        lumiLabProjectDetail.registeredDate,
        ...lumiLabProjectDetail.savedPhotos.map((photo) => photo.alt),
        ...lumiLabProjectDetail.savedFiles.map((file) => file.fileName),
        lumiLabProjectDeleteActionLabel,
        lumiLabProjectDeleteConfirmMessage,
        lumiLabProjectDeleteConfirmYesLabel,
        lumiLabProjectDeleteConfirmNoLabel,
        lumiLabProjectDetailSavedMessage,
        lumiLabProjectDetailSaveLabel,
        lumiLabProjectDetailSavingLabel,
        lumiLabProjectDetailEditingLabel,
        'LumiLab',
        'Start',
    ].join('\n');
}

describe('LumiLabProjectMock data', () => {
    it('TOP and selection use only the global file tags', () => {
        expect(lumiLabGlobalTabs.map((tab) => tab.label)).toEqual([
            'TOP',
            '選択',
        ]);
        expect(lumiLabGlobalTabs.map((tab) => tab.label)).not.toContain('案件');
    });

    it('project UI uses only the project file tags', () => {
        expect(lumiLabProjectTabs.map((tab) => tab.id)).toEqual([
            'top',
            'register',
            'list',
        ]);
        expect(lumiLabProjectTabs.map((tab) => tab.label)).toEqual([
            'TOP',
            '登録',
            '一覧',
        ]);
        expect(lumiLabProjectTabs.map((tab) => tab.label)).not.toContain('選択');
        expect(lumiLabProjectTabs.map((tab) => tab.label)).not.toContain('戻る');
        expect(lumiLabProjectTabs.map((tab) => tab.label)).not.toContain('詳細');
        expect(lumiLabProjectTabs.map((tab) => tab.id)).not.toContain('detail');
        expect(lumiLabProjectActionTabs.map((tab) => tab.label)).toEqual([
            '登録',
            '一覧',
        ]);
        expect(lumiLabProjectActionTabs.map((tab) => tab.label)).not.toContain('TOP');
        expect(lumiLabProjectActionTabs.map((tab) => tab.label)).not.toContain('戻る');
        expect(lumiLabProjectActionTabs.map((tab) => tab.label)).not.toContain('詳細');
        expect(lumiLabProjectBackLabel).toBe('戻る');
        expect(lumiLabProjectDetailBackLabel).toBe('戻る');
        expect(lumiLabTopReturnLabel).toBe('戻る');
        expect(lumiLabTopReturnAccessibleLabel).toBe('TOPへ戻る');
        expect(lumiLabProjectBackAccessibleLabel).toBe('案件選択へ戻る');
        expect(lumiLabProjectTopBackAccessibleLabel).toBe('案件TOPへ戻る');
        expect(lumiLabProjectDetailBackAccessibleLabel).toBe('案件一覧へ戻る');
    });

    it('defines only the register mock input fields', () => {
        expect(lumiLabProjectRegisterPanel.fields.map((field) => field.label)).toEqual([
            '会社名',
            '担当者名',
            '住所',
            'メモ',
        ]);
        expect(lumiLabProjectRegisterPanel.fields.map((field) => field.id)).toEqual([
            'companyName',
            'contactName',
            'address',
            'memo',
        ]);
        expect(lumiLabProjectRegisterPanel.fields[0].requirementLabel).toBe('必須');
        expect(lumiLabProjectRegisterPanel.fields[1].requirementLabel).toBe('任意');
    });

    it('creates a selected project detail with the shared saved photo and file fixture', () => {
        const selectedProjectDetail = createLumiLabProjectDetail({
            id: 'mock-project-020',
            companyName: '高槻木工',
            contactName: '清水 恒一',
            address: '大阪府高槻市芥川町 2-16-4',
            memo: '収納改修の図面を確認。',
            registeredDate: '2026/06/20',
        }, {
            companyName: '高槻木工 改訂',
            contactName: '清水 恒一',
            address: '大阪府高槻市芥川町 2-16-4',
            memo: '保存済みのメモ',
        });

        expect(selectedProjectDetail.id).toBe('mock-project-020');
        expect(selectedProjectDetail.companyName).toBe('高槻木工 改訂');
        expect(selectedProjectDetail.memo).toBe('保存済みのメモ');
        expect(selectedProjectDetail.registeredDate).toBe('2026/06/20');
        expect(selectedProjectDetail.savedPhotos).toBe(
            lumiLabProjectDetail.savedPhotos,
        );
        expect(selectedProjectDetail.savedFiles).toBe(
            lumiLabProjectDetail.savedFiles,
        );
    });

    it('defines a single project detail mock with saved preview data', () => {
        expect(lumiLabProjectDetail.companyName).toBe('ルミラボ工務店');
        expect(lumiLabProjectDetail.contactName).toBe('山田 太郎');
        expect(lumiLabProjectDetail.address).toBe('大阪府岸和田市上町 1-2-3');
        expect(lumiLabProjectDetail.registeredDate).toBe('2026/07/07');
        expect(lumiLabProjectDetail.savedPhotos).toHaveLength(3);
        expect(lumiLabProjectDetail.savedFiles.map((file) => file.fileName)).toEqual([
            '現場確認資料.pdf',
            '現場参考メモ.xlsx',
        ]);
        expect(lumiLabProjectDeleteActionLabel).toBe('案件を削除する');
        expect(lumiLabProjectDeleteConfirmMessage).toBe('この案件を削除しますか？');
        expect(lumiLabProjectDeleteConfirmYesLabel).toBe('はい');
        expect(lumiLabProjectDeleteConfirmNoLabel).toBe('いいえ');
        expect(lumiLabProjectDetailSavedMessage).toBe('保存しました');
        expect(lumiLabProjectDetailSaveLabel).toBe('保存する');
        expect(lumiLabProjectDetailSavingLabel).toBe('保存中です');
        expect(lumiLabProjectDetailEditingLabel).toBe('編集中');
    });

    it('keeps forbidden register mock concepts out of the fixed data', () => {
        const text = collectMockText();

        expect(text).not.toContain('ステータス');
        expect(text).not.toContain('案件名');
        expect(text).not.toContain('郵便番号');
        expect(text).not.toContain('都道府県');
        expect(text).not.toContain('市区町村');
    });

    it('keeps the fixed visible text thin', () => {
        const text = collectMockText();

        expect(text).toContain('LumiLab');
        expect(text).toContain('Start');
        expect(text).toContain('案件');
        expect(text).toContain('戻る');
        expect(text).not.toContain('TOPへ戻る');
        expect(text).not.toContain('案件一覧へ戻る');
        expect(text).not.toContain('選択へ戻る');
        expect(text).not.toContain('詳細を見る');
        expect(text).not.toContain('YES');
        expect(text).not.toContain('NO');
        expect(lumiLabTopReturnLabel).toBe(lumiLabProjectBackLabel);
        expect(text).not.toContain('案件を選択');
        expect(text).not.toContain('案件選択');
        expect(text).not.toContain('合計');
        expect(text).not.toContain('進行中');
        expect(text).not.toContain('完了');
        expect(text).not.toContain('IDEA BOARD');
        expect(text).not.toContain('工程');
        expect(text).not.toContain('見積');
        expect(text).not.toContain('元調');
        expect(text).not.toContain('請求');
        expect(text).not.toContain('発注');
        expect(text).not.toContain('カレンダー');
        expect(text).not.toContain('Google Maps API');
        expect(text).not.toContain('Geocoding');
        expect(text).not.toContain('Embed');
    });
});
