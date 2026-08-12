import type {
    LumiLabMockGlobalTabId,
    LumiLabMockProjectDetail,
    LumiLabMockProjectDetailDraft,
    LumiLabMockProjectItem,
    LumiLabMockProjectListItem,
    LumiLabMockProjectRegisterPanel,
    LumiLabMockProjectTabId,
    LumiLabMockTab,
} from './types';

export const lumiLabGlobalTabs = [
    { id: 'top', label: 'TOP' },
    { id: 'select', label: '選択' },
] as const satisfies readonly LumiLabMockTab<LumiLabMockGlobalTabId>[];

// 案件TOPの通常ボタン用。TOPと戻るは案件内ファイルタグ配列へ混ぜない。
export const lumiLabProjectActionTabs = [
    { id: 'register', label: '登録' },
    { id: 'list', label: '一覧' },
] as const satisfies readonly LumiLabMockTab<Exclude<LumiLabMockProjectTabId, 'top'>>[];

export const lumiLabProjectTabs = [
    { id: 'top', label: 'TOP' },
    ...lumiLabProjectActionTabs,
] as const satisfies readonly LumiLabMockTab<LumiLabMockProjectTabId>[];

export const lumiLabProjectItem = {
    id: 'project',
    label: '案件',
} as const satisfies LumiLabMockProjectItem;

export const lumiLabTopReturnLabel = '戻る';
export const lumiLabTopReturnAccessibleLabel = 'TOPへ戻る';

export const lumiLabProjectBackLabel = '戻る';
export const lumiLabProjectBackAccessibleLabel = '案件選択へ戻る';

export const lumiLabProjectDetailBackLabel = '戻る';
export const lumiLabProjectDetailBackAccessibleLabel = '案件一覧へ戻る';
export const lumiLabProjectTopBackAccessibleLabel = '案件TOPへ戻る';

export const lumiLabProjectRegisterPanel = {
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
} as const satisfies LumiLabMockProjectRegisterPanel;

export const lumiLabProjectDetail = {
    id: 'mock-project-001',
    companyName: 'ルミラボ工務店',
    contactName: '山田 太郎',
    address: '大阪府岸和田市上町 1-2-3',
    memo: '初回訪問予定。現場確認後に写真と資料を追加する。',
    registeredDate: '2026/07/07',
    savedPhotos: [
        { id: 'site-photo-1', alt: '保存済み現場写真 1' },
        { id: 'site-photo-2', alt: '保存済み現場写真 2' },
        { id: 'site-photo-3', alt: '保存済み現場写真 3' },
    ],
    savedFiles: [
        { id: 'site-file-1', fileName: '現場確認資料.pdf', fileTypeLabel: 'PDF' },
        { id: 'site-file-2', fileName: '現場参考メモ.xlsx', fileTypeLabel: 'XLS' },
    ],
} as const satisfies LumiLabMockProjectDetail;

export function createLumiLabProjectDetail(
    project: LumiLabMockProjectListItem,
    override?: LumiLabMockProjectDetailDraft,
): LumiLabMockProjectDetail {
    return {
        id: project.id,
        companyName: override?.companyName ?? project.companyName,
        contactName: override?.contactName ?? project.contactName,
        address: override?.address ?? project.address,
        memo: override?.memo ?? project.memo,
        registeredDate: project.registeredDate,
        savedPhotos: lumiLabProjectDetail.savedPhotos,
        savedFiles: lumiLabProjectDetail.savedFiles,
    };
}

export const lumiLabProjectDetailSavedMessage = '保存しました';

export const lumiLabProjectDetailSaveLabel = '保存する';

export const lumiLabProjectDetailSavingLabel = '保存中です';

export const lumiLabProjectDetailEditingLabel = '編集中';

export const lumiLabProjectDeleteActionLabel = '案件を削除する';

export const lumiLabProjectDeleteConfirmMessage = 'この案件を削除しますか？';

export const lumiLabProjectDeleteConfirmYesLabel = 'はい';

export const lumiLabProjectDeleteConfirmNoLabel = 'いいえ';
