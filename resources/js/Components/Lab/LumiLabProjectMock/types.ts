export type LumiLabMockGlobalTabId = 'top' | 'select';

export type LumiLabMockProjectTabId = 'top' | 'register' | 'list';

export type LumiLabMockProjectViewId = LumiLabMockProjectTabId | 'detail';

export type LumiLabMockProjectListItem = {
    id: string;
    companyName: string;
    contactName: string;
    address: string;
    memo: string;
    registeredDate: string;
};

export type LumiLabMockProjectList = {
    items: readonly LumiLabMockProjectListItem[];
};

export type LumiLabMockProjectDetailReturnTarget = {
    projectTabId: LumiLabMockProjectTabId;
    projectViewId: LumiLabMockProjectViewId;
};

export type LumiLabMockScreen = LumiLabMockGlobalTabId | 'project';

export type LumiLabMockTab<TId extends string> = {
    id: TId;
    label: string;
};

export type LumiLabMockProjectItem = {
    id: string;
    label: string;
};

export type LumiLabMockProjectRegisterFieldId =
    | 'companyName'
    | 'contactName'
    | 'address'
    | 'memo';

export type LumiLabMockProjectRegisterField = {
    id: LumiLabMockProjectRegisterFieldId;
    label: string;
    requirementLabel: '必須' | '任意';
    control: 'input' | 'textarea';
    placeholder: string;
    autoComplete?: string;
    rows?: number;
};

export type LumiLabMockProjectRegisterPanel = {
    title: string;
    fields: readonly LumiLabMockProjectRegisterField[];
    primaryActionLabel: string;
};

export type LumiLabMockProjectDetailEditableFieldId =
    | 'companyName'
    | 'contactName'
    | 'address'
    | 'memo';

export type LumiLabMockProjectDetailDraft = Record<
    LumiLabMockProjectDetailEditableFieldId,
    string
>;

export type LumiLabMockProjectSavedPhoto = {
    id: string;
    alt: string;
};

export type LumiLabMockProjectSavedFile = {
    id: string;
    fileName: string;
    fileTypeLabel: string;
};

export type LumiLabMockProjectDetail = LumiLabMockProjectDetailDraft & {
    id: string;
    registeredDate: string;
    savedPhotos: readonly LumiLabMockProjectSavedPhoto[];
    savedFiles: readonly LumiLabMockProjectSavedFile[];
};
