import type {
    LumiLaboMockGlobalTabId,
    LumiLaboMockProjectItem,
    LumiLaboMockProjectRegisterPanel,
    LumiLaboMockProjectTabId,
    LumiLaboMockTab,
} from './types';

export const lumiLaboGlobalTabs = [
    { id: 'top', label: 'TOP' },
    { id: 'select', label: '選択' },
] as const satisfies readonly LumiLaboMockTab<LumiLaboMockGlobalTabId>[];

export const lumiLaboProjectTabs = [
    { id: 'register', label: '登録' },
    { id: 'list', label: '一覧' },
] as const satisfies readonly LumiLaboMockTab<LumiLaboMockProjectTabId>[];

export const lumiLaboProjectItem = {
    id: 'project',
    label: '案件',
} as const satisfies LumiLaboMockProjectItem;

export const lumiLaboTopReturnLabel = 'TOPへ戻る';

export const lumiLaboProjectBackLabel = '戻る';

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
