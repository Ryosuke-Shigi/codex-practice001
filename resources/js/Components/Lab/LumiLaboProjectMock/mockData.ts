import type {
    LumiLaboMockGlobalTabId,
    LumiLaboMockProjectDetail,
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectItem,
    LumiLaboMockProjectListItem,
    LumiLaboMockProjectRegisterPanel,
    LumiLaboMockProjectTabId,
    LumiLaboMockTab,
} from './types';

export const lumiLaboGlobalTabs = [
    { id: 'top', label: 'TOP' },
    { id: 'select', label: '選択' },
] as const satisfies readonly LumiLaboMockTab<LumiLaboMockGlobalTabId>[];

// 案件TOPの通常ボタン用。TOPと戻るは案件内ファイルタグ配列へ混ぜない。
export const lumiLaboProjectActionTabs = [
    { id: 'register', label: '登録' },
    { id: 'list', label: '一覧' },
] as const satisfies readonly LumiLaboMockTab<Exclude<LumiLaboMockProjectTabId, 'top'>>[];

export const lumiLaboProjectTabs = [
    { id: 'top', label: 'TOP' },
    ...lumiLaboProjectActionTabs,
] as const satisfies readonly LumiLaboMockTab<LumiLaboMockProjectTabId>[];

export const lumiLaboProjectItem = {
    id: 'project',
    label: '案件',
} as const satisfies LumiLaboMockProjectItem;

export const lumiLaboTopReturnLabel = 'TOPへ戻る';

export const lumiLaboProjectBackLabel = '戻る';

export const lumiLaboProjectDetailBackLabel = '案件一覧へ戻る';

export const lumiLaboProjectRegisterPanel = {
    title: '案件登録',
    fields: [
        {
            id: 'companyName',
            label: '会社名',
            requirementLabel: '必須',
            control: 'input',
            placeholder: '例: ルミラボ工務店',
            autoComplete: 'organization',
        },
        {
            id: 'contactName',
            label: '担当者名',
            requirementLabel: '任意',
            control: 'input',
            placeholder: '例: 山田 太郎',
            autoComplete: 'name',
        },
        {
            id: 'address',
            label: '住所',
            requirementLabel: '任意',
            control: 'textarea',
            placeholder: '例: 東京都千代田区丸の内1-1-1',
            autoComplete: 'street-address',
            rows: 2,
        },
        {
            id: 'memo',
            label: 'メモ',
            requirementLabel: '任意',
            control: 'textarea',
            placeholder: '例: 初回連絡時の補足を入力',
            rows: 3,
        },
    ],
    primaryActionLabel: '登録する',
} as const satisfies LumiLaboMockProjectRegisterPanel;

export const lumiLaboProjectDetail = {
    id: 'mock-project-001',
    companyName: 'ルミラボ工務店',
    contactName: '山田 太郎',
    address: '大阪府岸和田市上町 1-2-3',
    memo: '初回訪問予定。現場確認後に写真と資料を追加する。',
    registeredDate: '2026/07/07',
    savedPhotos: [
        { id: 'site-photo-1', label: '1', alt: '保存済み現場写真 1' },
        { id: 'site-photo-2', label: '2', alt: '保存済み現場写真 2' },
        { id: 'site-photo-3', label: '3', alt: '保存済み現場写真 3' },
    ],
    savedFiles: [
        { id: 'site-file-1', fileName: '現場確認資料.pdf', fileTypeLabel: 'PDF' },
        { id: 'site-file-2', fileName: '現場参考メモ.xlsx', fileTypeLabel: 'XLS' },
    ],
} as const satisfies LumiLaboMockProjectDetail;

export function createLumiLaboProjectDetail(
    project: LumiLaboMockProjectListItem,
    override?: LumiLaboMockProjectDetailDraft,
): LumiLaboMockProjectDetail {
    return {
        id: project.id,
        companyName: override?.companyName ?? project.companyName,
        contactName: override?.contactName ?? project.contactName,
        address: override?.address ?? project.address,
        memo: override?.memo ?? project.memo,
        registeredDate: project.registeredDate,
        savedPhotos: lumiLaboProjectDetail.savedPhotos,
        savedFiles: lumiLaboProjectDetail.savedFiles,
    };
}

export const lumiLaboProjectDetailSavedMessage = '保存しました';

export const lumiLaboProjectDetailSaveLabel = '保存する';

export const lumiLaboProjectDetailSavingLabel = '保存中です';

export const lumiLaboProjectDetailEditingLabel = '編集中';

export const lumiLaboProjectDeleteActionLabel = '案件を削除する';

export const lumiLaboProjectDeleteConfirmMessage = 'この案件を削除しますか？';

export const lumiLaboProjectDeleteConfirmYesLabel = 'はい';

export const lumiLaboProjectDeleteConfirmNoLabel = 'いいえ';
