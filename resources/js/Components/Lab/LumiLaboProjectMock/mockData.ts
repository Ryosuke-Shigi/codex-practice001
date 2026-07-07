import type {
    LumiLaboMockGlobalTabId,
    LumiLaboMockProjectItem,
    LumiLaboMockProjectTabId,
    LumiLaboMockTab,
} from './types';

export const lumiLaboGlobalTabs = [
    { id: 'top', label: 'TOP' },
    { id: 'select', label: '選択' },
] as const satisfies readonly LumiLaboMockTab<LumiLaboMockGlobalTabId>[];

export const lumiLaboProjectTabs = [
    { id: 'top', label: 'TOP' },
    { id: 'register', label: '登録' },
    { id: 'list', label: '一覧' },
] as const satisfies readonly LumiLaboMockTab<LumiLaboMockProjectTabId>[];

export const lumiLaboProjectItem = {
    id: 'project',
    label: '案件',
} as const satisfies LumiLaboMockProjectItem;

export const lumiLaboTopReturnLabel = 'TOPへ戻る';

export const lumiLaboProjectBackLabel = '選択へ戻る';
