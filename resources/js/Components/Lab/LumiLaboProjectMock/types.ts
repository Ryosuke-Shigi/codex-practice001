export type LumiLaboMockGlobalTabId = 'top' | 'select';

export type LumiLaboMockProjectTabId = 'top' | 'register' | 'list';

export type LumiLaboMockScreen = LumiLaboMockGlobalTabId | 'project';

export type LumiLaboMockTab<TId extends string> = {
    id: TId;
    label: string;
};

export type LumiLaboMockProjectItem = {
    id: string;
    label: string;
};
