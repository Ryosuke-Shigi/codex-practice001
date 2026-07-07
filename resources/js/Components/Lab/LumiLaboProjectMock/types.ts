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

export type LumiLaboMockProjectRegisterFieldId =
    | 'companyName'
    | 'contactName'
    | 'address'
    | 'memo';

export type LumiLaboMockProjectRegisterField = {
    id: LumiLaboMockProjectRegisterFieldId;
    label: string;
    requirementLabel: '必須' | '任意';
    control: 'input' | 'textarea';
    placeholder: string;
    autoComplete?: string;
    rows?: number;
};

export type LumiLaboMockProjectRegisterPanel = {
    title: string;
    fields: readonly LumiLaboMockProjectRegisterField[];
    primaryActionLabel: string;
};
