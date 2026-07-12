export type LumiLaboMockGlobalTabId = 'top' | 'select';

export type LumiLaboMockProjectTabId = 'top' | 'register' | 'list';

export type LumiLaboMockProjectViewId = LumiLaboMockProjectTabId | 'detail';

export type LumiLaboMockProjectDetailReturnTarget = {
    projectTabId: LumiLaboMockProjectTabId;
    projectViewId: LumiLaboMockProjectViewId;
};

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

export type LumiLaboMockProjectDetailEditableFieldId =
    | 'companyName'
    | 'contactName'
    | 'address'
    | 'memo';

export type LumiLaboMockProjectDetailDraft = Record<
    LumiLaboMockProjectDetailEditableFieldId,
    string
>;

export type LumiLaboMockProjectSavedPhoto = {
    id: string;
    label: string;
    alt: string;
};

export type LumiLaboMockProjectSavedFile = {
    id: string;
    fileName: string;
    fileTypeLabel: string;
};

export type LumiLaboMockProjectDetail = LumiLaboMockProjectDetailDraft & {
    id: string;
    registeredDate: string;
    savedPhotos: readonly LumiLaboMockProjectSavedPhoto[];
    savedFiles: readonly LumiLaboMockProjectSavedFile[];
};
