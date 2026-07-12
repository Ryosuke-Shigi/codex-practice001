import { describe, expect, it } from 'vitest';

import {
    lumiLaboGlobalTabs,
    lumiLaboProjectActionTabs,
    lumiLaboProjectBackLabel,
    lumiLaboProjectDeleteActionLabel,
    lumiLaboProjectDeleteConfirmMessage,
    lumiLaboProjectDeleteConfirmNoLabel,
    lumiLaboProjectDeleteConfirmYesLabel,
    lumiLaboProjectDetailBackLabel,
    lumiLaboProjectDetailEditingLabel,
    lumiLaboProjectDetailSaveLabel,
    lumiLaboProjectDetailSavingLabel,
    lumiLaboProjectDetail,
    lumiLaboProjectDetailSavedMessage,
    lumiLaboProjectItem,
    lumiLaboProjectRegisterPanel,
    lumiLaboProjectTabs,
    lumiLaboTopReturnLabel,
} from './mockData';

function collectMockText(): string {
    return [
        ...lumiLaboGlobalTabs.map((tab) => tab.label),
        ...lumiLaboProjectTabs.map((tab) => tab.label),
        lumiLaboProjectItem.label,
        lumiLaboTopReturnLabel,
        lumiLaboProjectRegisterPanel.title,
        ...lumiLaboProjectRegisterPanel.fields.map((field) => field.label),
        lumiLaboProjectBackLabel,
        lumiLaboProjectDetailBackLabel,
        lumiLaboProjectDetail.companyName,
        lumiLaboProjectDetail.contactName,
        lumiLaboProjectDetail.address,
        lumiLaboProjectDetail.memo,
        lumiLaboProjectDetail.registeredDate,
        ...lumiLaboProjectDetail.savedPhotos.map((photo) => photo.alt),
        ...lumiLaboProjectDetail.savedFiles.map((file) => file.fileName),
        lumiLaboProjectDeleteActionLabel,
        lumiLaboProjectDeleteConfirmMessage,
        lumiLaboProjectDeleteConfirmYesLabel,
        lumiLaboProjectDeleteConfirmNoLabel,
        lumiLaboProjectDetailSavedMessage,
        lumiLaboProjectDetailSaveLabel,
        lumiLaboProjectDetailSavingLabel,
        lumiLaboProjectDetailEditingLabel,
        'LumiLabo',
        'Start',
    ].join('\n');
}

describe('LumiLaboProjectMock data', () => {
    it('TOP and selection use only the global file tags', () => {
        expect(lumiLaboGlobalTabs.map((tab) => tab.label)).toEqual([
            'TOP',
            '選択',
        ]);
        expect(lumiLaboGlobalTabs.map((tab) => tab.label)).not.toContain('案件');
    });

    it('project UI uses only the project file tags', () => {
        expect(lumiLaboProjectTabs.map((tab) => tab.id)).toEqual([
            'top',
            'register',
            'list',
        ]);
        expect(lumiLaboProjectTabs.map((tab) => tab.label)).toEqual([
            'TOP',
            '登録',
            '一覧',
        ]);
        expect(lumiLaboProjectTabs.map((tab) => tab.label)).not.toContain('選択');
        expect(lumiLaboProjectTabs.map((tab) => tab.label)).not.toContain('戻る');
        expect(lumiLaboProjectTabs.map((tab) => tab.label)).not.toContain('詳細');
        expect(lumiLaboProjectTabs.map((tab) => tab.id)).not.toContain('detail');
        expect(lumiLaboProjectActionTabs.map((tab) => tab.label)).toEqual([
            '登録',
            '一覧',
        ]);
        expect(lumiLaboProjectActionTabs.map((tab) => tab.label)).not.toContain('TOP');
        expect(lumiLaboProjectActionTabs.map((tab) => tab.label)).not.toContain('戻る');
        expect(lumiLaboProjectActionTabs.map((tab) => tab.label)).not.toContain('詳細');
        expect(lumiLaboProjectBackLabel).toBe('戻る');
        expect(lumiLaboProjectDetailBackLabel).toBe('案件一覧へ戻る');
    });

    it('defines only the register mock input fields', () => {
        expect(lumiLaboProjectRegisterPanel.fields.map((field) => field.label)).toEqual([
            '会社名',
            '担当者名',
            '住所',
            'メモ',
        ]);
        expect(lumiLaboProjectRegisterPanel.fields.map((field) => field.id)).toEqual([
            'companyName',
            'contactName',
            'address',
            'memo',
        ]);
        expect(lumiLaboProjectRegisterPanel.fields[0].requirementLabel).toBe('必須');
        expect(lumiLaboProjectRegisterPanel.fields[1].requirementLabel).toBe('任意');
    });

    it('defines a single project detail mock with saved preview data', () => {
        expect(lumiLaboProjectDetail.companyName).toBe('ルミラボ工務店');
        expect(lumiLaboProjectDetail.contactName).toBe('山田 太郎');
        expect(lumiLaboProjectDetail.address).toBe('大阪府岸和田市上町 1-2-3');
        expect(lumiLaboProjectDetail.registeredDate).toBe('2026/07/07');
        expect(lumiLaboProjectDetail.savedPhotos).toHaveLength(3);
        expect(lumiLaboProjectDetail.savedFiles.map((file) => file.fileName)).toEqual([
            '現場確認資料.pdf',
            '現場参考メモ.xlsx',
        ]);
        expect(lumiLaboProjectDeleteActionLabel).toBe('案件を削除する');
        expect(lumiLaboProjectDeleteConfirmMessage).toBe('この案件を削除しますか？');
        expect(lumiLaboProjectDeleteConfirmYesLabel).toBe('はい');
        expect(lumiLaboProjectDeleteConfirmNoLabel).toBe('いいえ');
        expect(lumiLaboProjectDetailSavedMessage).toBe('保存しました');
        expect(lumiLaboProjectDetailSaveLabel).toBe('保存する');
        expect(lumiLaboProjectDetailSavingLabel).toBe('保存中です');
        expect(lumiLaboProjectDetailEditingLabel).toBe('編集中');
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

        expect(text).toContain('LumiLabo');
        expect(text).toContain('Start');
        expect(text).toContain('案件');
        expect(text).toContain('TOPへ戻る');
        expect(text).toContain('戻る');
        expect(text).toContain('案件一覧へ戻る');
        expect(text).not.toContain('選択へ戻る');
        expect(text).not.toContain('詳細を見る');
        expect(text).not.toContain('YES');
        expect(text).not.toContain('NO');
        expect(lumiLaboTopReturnLabel).not.toBe(lumiLaboProjectBackLabel);
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
