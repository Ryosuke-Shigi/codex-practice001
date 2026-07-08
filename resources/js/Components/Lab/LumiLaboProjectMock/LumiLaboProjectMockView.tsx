import type { ChangeEvent, DragEvent, MutableRefObject } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    Camera,
    ChevronRight,
    FilePlus2,
    FileText,
    FolderKanban,
    Home,
    Layers3,
    List,
    MapPin,
    Save,
    Sparkles,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
    lumiLaboGlobalTabs,
    lumiLaboProjectActionTabs,
    lumiLaboProjectBackLabel,
    lumiLaboProjectDeleteActionLabel,
    lumiLaboProjectDeleteConfirmMessage,
    lumiLaboProjectDeleteConfirmNoLabel,
    lumiLaboProjectDeleteConfirmYesLabel,
    lumiLaboProjectDetail,
    lumiLaboProjectDetailSavedMessage,
    lumiLaboProjectItem,
    lumiLaboProjectRegisterPanel,
    lumiLaboProjectTabs,
    lumiLaboTopReturnLabel,
} from './mockData';
import type {
    LumiLaboMockGlobalTabId,
    LumiLaboMockProjectDetail,
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectDetailEditableFieldId,
    LumiLaboMockProjectDetailReturnTarget,
    LumiLaboMockProjectRegisterField,
    LumiLaboMockProjectTabId,
    LumiLaboMockProjectViewId,
    LumiLaboMockScreen,
    LumiLaboMockTab,
} from './types';

const projectTabIcons = {
    top: Home,
    register: FilePlus2,
    list: List,
} satisfies Record<LumiLaboMockProjectTabId, LucideIcon>;

const lumiLaboProjectTopReturnTarget = {
    projectTabId: 'top',
    projectViewId: 'top',
} as const satisfies LumiLaboMockProjectDetailReturnTarget;

const lumiLaboProjectListReturnTarget = {
    projectTabId: 'list',
    projectViewId: 'list',
} as const satisfies LumiLaboMockProjectDetailReturnTarget;

type ProjectActionTabId = Exclude<LumiLaboMockProjectTabId, 'top'>;

type ProjectBackTargetId = 'select' | 'project-top' | 'detail-return-target';

type FileTagBarProps<TId extends string> = {
    tabs: readonly LumiLaboMockTab<TId>[];
    activeTabId: string;
    ariaLabel: string;
    onSelectTab: (tabId: TId) => void;
};

type ProjectDetailTextFieldConfig = {
    id: LumiLaboMockProjectDetailEditableFieldId;
    label: string;
    control: 'input' | 'textarea';
    rows?: number;
    autoComplete?: string;
};

type ProjectEntryPanelProps = BackActionProps & {
    onSelectProjectTab: (tabId: ProjectActionTabId) => void;
};

type ProjectListPanelProps = BackActionProps & {
    projectDetail: LumiLaboMockProjectDetail | null;
    onOpenProjectDetail: () => void;
};

type ProjectDetailPanelProps = BackActionProps & {
    projectDetail: LumiLaboMockProjectDetail;
    draft: LumiLaboMockProjectDetailDraft;
    isDeleteDialogOpen: boolean;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    saveMessageVisible: boolean;
    droppedFileNames: readonly string[];
    onChangeDraftField: (
        fieldId: LumiLaboMockProjectDetailEditableFieldId,
        value: string,
    ) => void;
    onSave: () => void;
    onDropFiles: (files: FileList | null) => void;
    onRemoveSavedPhoto: (photoId: string) => void;
    onRemoveSavedFile: (fileId: string) => void;
    onRequestDeleteProject: () => void;
    onCancelDeleteProject: () => void;
    onConfirmDeleteProject: () => void;
};

type ProjectDeleteConfirmDialogProps = {
    onCancel: () => void;
    onConfirm: () => void;
};

type ProjectDetailTextFieldProps = {
    field: ProjectDetailTextFieldConfig;
    value: string;
    onChange: (
        fieldId: LumiLaboMockProjectDetailEditableFieldId,
        value: string,
    ) => void;
};

type BackActionProps = {
    onBack: () => void;
    backTargetId: ProjectBackTargetId;
};

const projectDetailTextFields = [
    {
        id: 'companyName',
        label: '会社名',
        control: 'input',
        autoComplete: 'organization',
    },
    {
        id: 'contactName',
        label: '担当者名',
        control: 'input',
        autoComplete: 'name',
    },
    {
        id: 'address',
        label: '住所',
        control: 'input',
        autoComplete: 'street-address',
    },
    { id: 'memo', label: 'メモ', control: 'textarea', rows: 4 },
] as const satisfies readonly ProjectDetailTextFieldConfig[];

export default function LumiLaboProjectMockView() {
    const [activeScreen, setActiveScreen] =
        useState<LumiLaboMockScreen>('top');
    const [activeProjectTabId, setActiveProjectTabId] =
        useState<LumiLaboMockProjectTabId>('top');
    const [activeProjectViewId, setActiveProjectViewId] =
        useState<LumiLaboMockProjectViewId>('top');
    const [projectDetailReturnTarget, setProjectDetailReturnTarget] =
        useState<LumiLaboMockProjectDetailReturnTarget>(
            lumiLaboProjectListReturnTarget,
        );
    const [projectDetail, setProjectDetail] =
        useState<LumiLaboMockProjectDetail | null>(lumiLaboProjectDetail);
    const [projectDetailDraft, setProjectDetailDraft] =
        useState<LumiLaboMockProjectDetailDraft>(
            createProjectDetailDraft(lumiLaboProjectDetail),
        );
    const [isProjectDetailSaving, setIsProjectDetailSaving] = useState(false);
    const [projectDetailSavedVisible, setProjectDetailSavedVisible] =
        useState(false);
    const [droppedFileNames, setDroppedFileNames] = useState<readonly string[]>(
        [],
    );
    const [isProjectDeleteDialogOpen, setIsProjectDeleteDialogOpen] =
        useState(false);
    const saveCompleteTimerRef = useRef<ReturnType<
        typeof window.setTimeout
    > | null>(null);
    const saveMessageTimerRef = useRef<ReturnType<
        typeof window.setTimeout
    > | null>(null);

    const activeGlobalTabId: LumiLaboMockGlobalTabId =
        activeScreen === 'select' ? 'select' : 'top';

    const hasProjectDetailChanges = hasProjectDetailDraftChanged(
        projectDetailDraft,
        projectDetail ?? lumiLaboProjectDetail,
    );

    useEffect(() => {
        return () => {
            clearMockTimer(saveCompleteTimerRef);
            clearMockTimer(saveMessageTimerRef);
        };
    }, []);

    const selectGlobalTab = (tabId: LumiLaboMockGlobalTabId) => {
        setActiveScreen(tabId);
    };

    const selectProjectTab = (tabId: LumiLaboMockProjectTabId) => {
        setActiveProjectTabId(tabId);
        setActiveProjectViewId(tabId);
    };

    const handleBackFromProjectTop = () => {
        setActiveScreen('select');
    };

    const handleBackFromProjectRegister = () => {
        setActiveProjectTabId(lumiLaboProjectTopReturnTarget.projectTabId);
        setActiveProjectViewId(lumiLaboProjectTopReturnTarget.projectViewId);
    };

    const handleBackFromProjectList = () => {
        setActiveProjectTabId(lumiLaboProjectTopReturnTarget.projectTabId);
        setActiveProjectViewId(lumiLaboProjectTopReturnTarget.projectViewId);
    };

    const openProject = () => {
        setActiveProjectTabId('top');
        setActiveProjectViewId('top');
        setActiveScreen('project');
    };

    const openProjectDetailFromList = () => {
        setProjectDetailReturnTarget(lumiLaboProjectListReturnTarget);
        setActiveProjectTabId('list');
        setActiveProjectViewId('detail');
    };

    const handleBackFromProjectDetail = () => {
        setIsProjectDeleteDialogOpen(false);
        setActiveProjectTabId(projectDetailReturnTarget.projectTabId);
        setActiveProjectViewId(projectDetailReturnTarget.projectViewId);
    };

    const updateProjectDetailDraft = (
        fieldId: LumiLaboMockProjectDetailEditableFieldId,
        value: string,
    ) => {
        setProjectDetailDraft((current) => ({
            ...current,
            [fieldId]: value,
        }));
        setProjectDetailSavedVisible(false);
    };

    const saveProjectDetail = () => {
        if (
            projectDetail === null ||
            isProjectDetailSaving ||
            !hasProjectDetailChanges
        ) {
            return;
        }

        clearMockTimer(saveCompleteTimerRef);
        clearMockTimer(saveMessageTimerRef);
        setIsProjectDetailSaving(true);

        saveCompleteTimerRef.current = window.setTimeout(() => {
            setProjectDetail((current) => {
                if (current === null) {
                    return current;
                }

                return {
                    ...current,
                    ...projectDetailDraft,
                };
            });
            setIsProjectDetailSaving(false);
            setProjectDetailSavedVisible(true);
            saveCompleteTimerRef.current = null;

            saveMessageTimerRef.current = window.setTimeout(() => {
                setProjectDetailSavedVisible(false);
                saveMessageTimerRef.current = null;
            }, 3000);
        }, 250);
    };

    const updateDroppedFiles = (files: FileList | null) => {
        if (!files) {
            return;
        }

        setDroppedFileNames(Array.from(files).map((file) => file.name));
    };

    const removeSavedPhoto = (photoId: string) => {
        setProjectDetail((current) => {
            if (current === null) {
                return current;
            }

            return {
                ...current,
                savedPhotos: current.savedPhotos.filter(
                    (photo) => photo.id !== photoId,
                ),
            };
        });
    };

    const removeSavedFile = (fileId: string) => {
        setProjectDetail((current) => {
            if (current === null) {
                return current;
            }

            return {
                ...current,
                savedFiles: current.savedFiles.filter((file) => file.id !== fileId),
            };
        });
    };

    const requestProjectDelete = () => {
        setIsProjectDeleteDialogOpen(true);
    };

    const confirmProjectDelete = () => {
        clearMockTimer(saveCompleteTimerRef);
        clearMockTimer(saveMessageTimerRef);
        setProjectDetail(null);
        setProjectDetailDraft(createProjectDetailDraft(lumiLaboProjectDetail));
        setIsProjectDetailSaving(false);
        setProjectDetailSavedVisible(false);
        setDroppedFileNames([]);
        handleBackFromProjectDetail();
    };

    return (
        <article className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fffdf2] text-black">
            {activeScreen === 'project' ? (
                <FileTagBar
                    tabs={lumiLaboProjectTabs}
                    activeTabId={activeProjectTabId}
                    ariaLabel="案件内画面"
                    onSelectTab={selectProjectTab}
                />
            ) : (
                <FileTagBar
                    tabs={lumiLaboGlobalTabs}
                    activeTabId={activeGlobalTabId}
                    ariaLabel="LumiLabo MOCK画面"
                    onSelectTab={selectGlobalTab}
                />
            )}

            <main className="min-h-0 flex-1 overflow-hidden bg-white">
                {activeScreen === 'top' ? (
                    <TopPanel onStart={() => setActiveScreen('select')} />
                ) : null}

                {activeScreen === 'select' ? (
                    <SelectPanel
                        onOpenProject={openProject}
                        onBackToTop={() => setActiveScreen('top')}
                    />
                ) : null}

                {activeScreen === 'project' && activeProjectViewId === 'top' ? (
                    <ProjectEntryPanel
                        onBack={handleBackFromProjectTop}
                        backTargetId="select"
                        onSelectProjectTab={selectProjectTab}
                    />
                ) : null}

                {activeScreen === 'project' &&
                activeProjectViewId === 'register' ? (
                    <ProjectRegisterPanel
                        onBack={handleBackFromProjectRegister}
                        backTargetId="project-top"
                    />
                ) : null}

                {activeScreen === 'project' && activeProjectViewId === 'list' ? (
                    <ProjectListPanel
                        projectDetail={projectDetail}
                        backTargetId="project-top"
                        onOpenProjectDetail={openProjectDetailFromList}
                        onBack={handleBackFromProjectList}
                    />
                ) : null}

                {activeScreen === 'project' &&
                activeProjectViewId === 'detail' &&
                projectDetail !== null ? (
                    <ProjectDetailPanel
                        projectDetail={projectDetail}
                        backTargetId="detail-return-target"
                        draft={projectDetailDraft}
                        isDeleteDialogOpen={isProjectDeleteDialogOpen}
                        hasUnsavedChanges={hasProjectDetailChanges}
                        isSaving={isProjectDetailSaving}
                        saveMessageVisible={projectDetailSavedVisible}
                        droppedFileNames={droppedFileNames}
                        onChangeDraftField={updateProjectDetailDraft}
                        onSave={saveProjectDetail}
                        onDropFiles={updateDroppedFiles}
                        onRemoveSavedPhoto={removeSavedPhoto}
                        onRemoveSavedFile={removeSavedFile}
                        onRequestDeleteProject={requestProjectDelete}
                        onCancelDeleteProject={() => setIsProjectDeleteDialogOpen(false)}
                        onConfirmDeleteProject={confirmProjectDelete}
                        onBack={handleBackFromProjectDetail}
                    />
                ) : null}
            </main>
        </article>
    );
}

function FileTagBar<TId extends string>({
    tabs,
    activeTabId,
    ariaLabel,
    onSelectTab,
}: FileTagBarProps<TId>) {
    return (
        <nav
            aria-label={ariaLabel}
            className="flex-none overflow-hidden border-b border-yellow-200 bg-[#fff7c7] px-2 pt-2"
        >
            <div className="flex gap-1 overflow-x-auto overscroll-x-contain">
                {tabs.map((tab) => {
                    const isActive = activeTabId === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            aria-pressed={isActive}
                            aria-current={isActive ? 'page' : undefined}
                            className={getFileTagClasses(isActive)}
                            onClick={() => onSelectTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

function TopPanel({ onStart }: { onStart: () => void }) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-5 py-6 sm:py-8">
            <div className="mx-auto grid min-h-full w-full max-w-sm content-start justify-items-center gap-5 pt-8 sm:content-center sm:pt-0">
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-yellow-300 bg-yellow-100 text-yellow-900 shadow-sm shadow-yellow-900/10">
                    <Sparkles className="h-10 w-10" aria-hidden />
                </span>
                <h1 className="text-center text-4xl font-black leading-tight text-black">
                    LumiLabo
                </h1>
                <button
                    type="button"
                    className="min-h-14 w-full rounded-md border border-yellow-500 bg-yellow-300 px-6 text-lg font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    onClick={onStart}
                >
                    Start
                </button>
            </div>
        </section>
    );
}

function SelectPanel({
    onOpenProject,
    onBackToTop,
}: {
    onOpenProject: () => void;
    onBackToTop: () => void;
}) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-5 py-6 sm:py-8">
            <div className="mx-auto grid min-h-full w-full max-w-sm content-start gap-3 pt-8 sm:content-center sm:pt-0">
                <button
                    type="button"
                    className="grid min-h-24 w-full place-items-center gap-2 rounded-md border border-yellow-500 bg-yellow-300 px-6 py-5 text-2xl font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    onClick={onOpenProject}
                >
                    <FolderKanban
                        className="h-10 w-10 text-yellow-900"
                        aria-hidden
                    />
                    <span>{lumiLaboProjectItem.label}</span>
                </button>
                <button
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-base font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    onClick={onBackToTop}
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                    <span>{lumiLaboTopReturnLabel}</span>
                </button>
            </div>
        </section>
    );
}

function ProjectEntryPanel({
    onBack,
    backTargetId,
    onSelectProjectTab,
}: ProjectEntryPanelProps) {
    // モバイル縦は上寄せ、スマホ横は二列化して通常ボタンと戻るを見切れさせない。
    return (
        <section className="h-full min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-8 [@media(orientation:landscape)_and_(max-height:480px)]:py-3">
            <div className="mx-auto grid min-h-full w-full max-w-sm content-start justify-items-center gap-4 pt-6 sm:content-center sm:pt-0 [@media(orientation:landscape)_and_(max-height:480px)]:max-w-xl [@media(orientation:landscape)_and_(max-height:480px)]:content-center [@media(orientation:landscape)_and_(max-height:480px)]:grid-cols-[auto_minmax(0,1fr)] [@media(orientation:landscape)_and_(max-height:480px)]:items-center [@media(orientation:landscape)_and_(max-height:480px)]:justify-items-stretch [@media(orientation:landscape)_and_(max-height:480px)]:gap-x-3 [@media(orientation:landscape)_and_(max-height:480px)]:gap-y-2">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300 bg-yellow-100 text-yellow-900 shadow-sm shadow-yellow-900/10 [@media(orientation:landscape)_and_(max-height:480px)]:h-10 [@media(orientation:landscape)_and_(max-height:480px)]:w-10">
                    <Layers3 className="h-8 w-8 [@media(orientation:landscape)_and_(max-height:480px)]:h-5 [@media(orientation:landscape)_and_(max-height:480px)]:w-5" aria-hidden />
                </span>
                <h1 className="text-center text-3xl font-black leading-tight text-black [@media(orientation:landscape)_and_(max-height:480px)]:text-left [@media(orientation:landscape)_and_(max-height:480px)]:text-2xl">
                    {lumiLaboProjectItem.label}
                </h1>
                <div className="grid w-full gap-2 [@media(orientation:landscape)_and_(max-height:480px)]:col-span-2 [@media(orientation:landscape)_and_(max-height:480px)]:grid-cols-2 [@media(orientation:landscape)_and_(max-height:480px)]:gap-1.5">
                    {lumiLaboProjectActionTabs.map((tab) => {
                        const Icon = projectTabIcons[tab.id];

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={getProjectEntryButtonClasses()}
                                onClick={() => onSelectProjectTab(tab.id)}
                            >
                                <Icon className="h-5 w-5" aria-hidden />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px [@media(orientation:landscape)_and_(max-height:480px)]:col-span-2 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10 [@media(orientation:landscape)_and_(max-height:480px)]:text-base"
                    data-lumilabo-back-target={backTargetId}
                    onClick={onBack}
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                    <span>{lumiLaboProjectBackLabel}</span>
                </button>
            </div>
        </section>
    );
}

function ProjectListPanel({
    projectDetail,
    onOpenProjectDetail,
    onBack,
    backTargetId,
}: ProjectListPanelProps) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-4 py-4 [@media(orientation:landscape)_and_(max-height:480px)]:py-3 sm:px-6 sm:py-6">
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                <header className="grid gap-1">
                    <p className="text-sm font-black text-yellow-800">
                        {lumiLaboProjectItem.label}
                    </p>
                    <h1 className="text-2xl font-black leading-tight text-black sm:text-3xl">
                        案件一覧
                    </h1>
                </header>

                <div className="grid gap-3">
                    {projectDetail ? (
                        <button
                            type="button"
                            aria-label={projectDetail.companyName + 'の案件詳細を開く'}
                            className="group flex min-h-16 w-full min-w-0 items-center justify-between gap-3 rounded-md border border-neutral-300 bg-white px-4 py-3 text-left text-black shadow-sm transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                            onClick={onOpenProjectDetail}
                        >
                            <span className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                                <span className="max-w-[46%] shrink-0 truncate text-lg font-black sm:max-w-none">
                                    {projectDetail.companyName}
                                </span>
                                <span className="shrink-0 text-sm font-black text-neutral-700 sm:text-base">
                                    担当者：{projectDetail.contactName}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-600 sm:text-base">
                                    メモ：{projectDetail.memo}
                                </span>
                            </span>
                            <ChevronRight
                                className="h-5 w-5 shrink-0 text-yellow-800 transition group-hover:translate-x-0.5"
                                aria-hidden
                            />
                        </button>
                    ) : (
                        <p
                            role="status"
                            className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-base font-black text-neutral-700"
                        >
                            表示できる案件はありません
                        </p>
                    )}
                </div>

                <div className="mt-auto grid gap-2 pt-1 sm:max-w-sm">
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                        data-lumilabo-back-target={backTargetId}
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectBackLabel}</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

function ProjectDetailPanel({
    projectDetail,
    draft,
    isDeleteDialogOpen,
    hasUnsavedChanges,
    isSaving,
    saveMessageVisible,
    droppedFileNames,
    onChangeDraftField,
    onSave,
    onDropFiles,
    onRemoveSavedPhoto,
    onRemoveSavedFile,
    onRequestDeleteProject,
    onCancelDeleteProject,
    onConfirmDeleteProject,
    onBack,
    backTargetId,
}: ProjectDetailPanelProps) {
    const mapSearchUrl = createGoogleMapsSearchUrl(projectDetail.address);

    return (
        <section className="h-full min-h-0 overflow-y-auto px-4 py-4 [@media(orientation:landscape)_and_(max-height:480px)]:py-3 sm:px-6 sm:py-6">
            <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                <header className="grid gap-2 rounded-md border border-neutral-200 bg-[#fffdf2] p-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                    <button
                        type="button"
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-base font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px sm:w-auto"
                        data-lumilabo-back-target={backTargetId}
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectBackLabel}</span>
                    </button>
                    <h1 className="text-xl font-black leading-tight text-black sm:text-2xl">
                        案件詳細
                    </h1>
                    {hasUnsavedChanges ? (
                        <button
                            type="button"
                            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-yellow-600 bg-yellow-300 px-4 text-base font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                            onClick={onSave}
                            disabled={isSaving}
                        >
                            <Save className="h-5 w-5" aria-hidden />
                            <span>{isSaving ? '保存中' : '保存'}</span>
                        </button>
                    ) : null}
                </header>

                {saveMessageVisible ? (
                    <div
                        role="status"
                        className="rounded-md border border-lime-600 bg-lime-300 px-4 py-2 text-center text-lg font-black text-black"
                    >
                        {lumiLaboProjectDetailSavedMessage}
                    </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.95fr)] lg:items-start">
                    <div className="grid gap-4 md:grid-cols-2">
                        {projectDetailTextFields.map((field) => (
                            <ProjectDetailTextField
                                key={field.id}
                                field={field}
                                value={draft[field.id]}
                                onChange={onChangeDraftField}
                            />
                        ))}

                        <div className="grid gap-2 md:col-span-2 lg:max-w-xs">
                            <p className="text-base font-black text-black">
                                登録日
                            </p>
                            <p
                                aria-readonly="true"
                                className="min-h-12 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-3 text-base font-semibold text-black"
                            >
                                {projectDetail.registeredDate}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <MapPreview href={mapSearchUrl} />

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <button
                                type="button"
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-yellow-600 bg-yellow-300 px-4 text-base font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                            >
                                <Camera className="h-5 w-5" aria-hidden />
                                <span>写真撮影</span>
                            </button>
                            <FileDropZone
                                droppedFileNames={droppedFileNames}
                                onDropFiles={onDropFiles}
                            />
                        </div>

                        <SavedPhotoPreview
                            projectDetail={projectDetail}
                            onRemoveSavedPhoto={onRemoveSavedPhoto}
                        />
                        <SavedFilePreview
                            projectDetail={projectDetail}
                            onRemoveSavedFile={onRemoveSavedFile}
                        />
                    </div>
                </div>

                <div className="mt-auto border-t border-red-200 pt-4 sm:max-w-sm">
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-red-600 bg-white px-5 text-lg font-black text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
                        onClick={onRequestDeleteProject}
                    >
                        <Trash2 className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectDeleteActionLabel}</span>
                    </button>
                </div>

                {isDeleteDialogOpen ? (
                    <ProjectDeleteConfirmDialog
                        onCancel={onCancelDeleteProject}
                        onConfirm={onConfirmDeleteProject}
                    />
                ) : null}
            </div>
        </section>
    );
}

function ProjectDetailTextField({
    field,
    value,
    onChange,
}: ProjectDetailTextFieldProps) {
    const controlId = `lumilabo-project-detail-${field.id}`;
    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        onChange(field.id, event.target.value);
    };

    return (
        <div
            className={classNames(
                'grid gap-2',
                field.control === 'textarea' ? 'md:col-span-2' : undefined,
            )}
        >
            <label htmlFor={controlId} className="text-base font-black text-black">
                {field.label}
            </label>
            {field.control === 'textarea' ? (
                <textarea
                    id={controlId}
                    name={field.id}
                    value={value}
                    rows={field.rows}
                    onChange={handleChange}
                    className={classNames(
                        getProjectRegisterControlClasses(),
                        'resize-none leading-relaxed',
                    )}
                />
            ) : (
                <input
                    id={controlId}
                    name={field.id}
                    type="text"
                    value={value}
                    autoComplete={field.autoComplete}
                    onChange={handleChange}
                    className={getProjectRegisterControlClasses()}
                />
            )}
        </div>
    );
}

function MapPreview({ href }: { href: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Google Mapsで住所を開く"
            className="relative block h-40 overflow-hidden rounded-md border border-neutral-300 bg-[#edf4dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 sm:h-48"
        >
            <span className="absolute left-[-8%] top-[52%] h-3 w-[115%] rotate-1 bg-white shadow-[0_0_0_2px_#ddd7a7]" />
            <span className="absolute left-[8%] top-[34%] h-3 w-[88%] -rotate-2 bg-white shadow-[0_0_0_2px_#ddd7a7]" />
            <span className="absolute left-[4%] top-[76%] h-3 w-[64%] -rotate-[28deg] bg-white shadow-[0_0_0_2px_#ddd7a7]" />
            <span className="absolute left-[20%] top-[-10%] h-[130%] w-px -rotate-12 bg-lime-200" />
            <span className="absolute left-[45%] top-[-10%] h-[130%] w-px -rotate-12 bg-lime-200" />
            <span className="absolute left-[70%] top-[-10%] h-[130%] w-px -rotate-12 bg-lime-200" />
            <MapPin
                className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 fill-red-500 text-red-700 drop-shadow"
                aria-hidden
            />
        </a>
    );
}

function FileDropZone({
    droppedFileNames,
    onDropFiles,
}: {
    droppedFileNames: readonly string[];
    onDropFiles: (files: FileList | null) => void;
}) {
    const inputId = 'lumilabo-project-detail-files';
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onDropFiles(event.target.files);
    };
    const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
    };
    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        onDropFiles(event.dataTransfer.files);
    };

    return (
        <div className="grid gap-2">
            <label
                htmlFor={inputId}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-yellow-600 bg-white px-4 text-center text-base font-black text-black transition hover:bg-yellow-50 focus-within:ring-2 focus-within:ring-yellow-500"
            >
                <Upload className="h-5 w-5" aria-hidden />
                <span>ファイルをまとめてドラッグ＆ドロップ</span>
                <input
                    id={inputId}
                    type="file"
                    multiple
                    className="sr-only"
                    aria-label="ファイルをまとめて選択"
                    onChange={handleChange}
                />
            </label>
            {droppedFileNames.length > 0 ? (
                <ul className="grid gap-1 text-sm font-bold text-neutral-700">
                    {droppedFileNames.map((fileName) => (
                        <li key={fileName} className="truncate">
                            {fileName}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

function ProjectDeleteConfirmDialog({
    onCancel,
    onConfirm,
}: ProjectDeleteConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="lumilabo-project-delete-dialog-title"
                className="grid w-full max-w-sm gap-4 rounded-md border border-red-300 bg-white p-4 text-black shadow-xl"
            >
                <h2
                    id="lumilabo-project-delete-dialog-title"
                    className="text-center text-xl font-black"
                >
                    {lumiLaboProjectDeleteConfirmMessage}
                </h2>
                <div className="grid gap-2">
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                        onClick={onCancel}
                    >
                        {lumiLaboProjectDeleteConfirmNoLabel}
                    </button>
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-red-700 bg-red-600 px-5 text-lg font-black text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
                        onClick={onConfirm}
                    >
                        {lumiLaboProjectDeleteConfirmYesLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SavedPhotoPreview({
    projectDetail,
    onRemoveSavedPhoto,
}: {
    projectDetail: LumiLaboMockProjectDetail;
    onRemoveSavedPhoto: (photoId: string) => void;
}) {
    if (projectDetail.savedPhotos.length === 0) {
        return null;
    }

    return (
        <section className="grid gap-2">
            <h2 className="text-base font-black text-black">写真</h2>
            <div className="flex flex-wrap gap-3">
                {projectDetail.savedPhotos.map((photo) => (
                    <div key={photo.id} className="relative h-20 w-28">
                        <div
                            role="img"
                            aria-label={photo.alt}
                            className="relative h-full w-full overflow-hidden rounded-md border border-neutral-300 bg-sky-100"
                        >
                            <span className="absolute left-2 top-2 inline-flex h-6 min-w-8 items-center justify-center rounded-md bg-white px-2 text-sm font-black text-black">
                                {photo.label}
                            </span>
                            <span className="absolute right-2 top-3 h-5 w-5 rounded-full bg-yellow-200" />
                            <span className="absolute bottom-3 left-2 h-0 w-0 border-b-[28px] border-l-[46px] border-r-[28px] border-b-green-600 border-l-transparent border-r-transparent" />
                            <span className="absolute bottom-3 left-9 h-0 w-0 border-b-[22px] border-l-[34px] border-r-[34px] border-b-green-700 border-l-transparent border-r-transparent" />
                        </div>
                        <button
                            type="button"
                            aria-label={photo.alt + 'を削除'}
                            className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-black shadow-sm transition hover:border-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
                            onClick={() => onRemoveSavedPhoto(photo.id)}
                        >
                            <X className="h-4 w-4" aria-hidden />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

function SavedFilePreview({
    projectDetail,
    onRemoveSavedFile,
}: {
    projectDetail: LumiLaboMockProjectDetail;
    onRemoveSavedFile: (fileId: string) => void;
}) {
    if (projectDetail.savedFiles.length === 0) {
        return null;
    }

    return (
        <section className="grid gap-2">
            <h2 className="text-base font-black text-black">ファイル</h2>
            <div className="grid gap-2">
                {projectDetail.savedFiles.map((file) => (
                    <div
                        key={file.id}
                        className="relative flex min-h-14 items-center gap-3 rounded-md border border-neutral-300 bg-white px-3 pr-12 text-black"
                    >
                        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-1 text-xs font-black">
                            {file.fileTypeLabel}
                        </span>
                        <FileText className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="min-w-0 truncate text-base font-black">
                            {file.fileName}
                        </span>
                        <button
                            type="button"
                            aria-label={file.fileName + 'を削除'}
                            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-black shadow-sm transition hover:border-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
                            onClick={() => onRemoveSavedFile(file.id)}
                        >
                            <X className="h-4 w-4" aria-hidden />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ProjectRegisterPanel({ onBack, backTargetId }: BackActionProps) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-4 py-4 [@media(orientation:landscape)_and_(max-height:480px)]:py-3 sm:px-6 sm:py-6">
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                <header className="grid gap-1">
                    <p className="text-sm font-black text-yellow-800">
                        {lumiLaboProjectItem.label}
                    </p>
                    <h1 className="text-2xl font-black leading-tight text-black sm:text-3xl">
                        {lumiLaboProjectRegisterPanel.title}
                    </h1>
                </header>

                <div className="grid gap-4 md:grid-cols-2 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                    {lumiLaboProjectRegisterPanel.fields.map((field) => (
                        <ProjectRegisterField key={field.id} field={field} />
                    ))}
                </div>

                <div className="mt-auto grid gap-2 pt-1 sm:max-w-sm">
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-yellow-600 bg-yellow-300 px-5 text-lg font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    >
                        <FilePlus2 className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectRegisterPanel.primaryActionLabel}</span>
                    </button>
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                        data-lumilabo-back-target={backTargetId}
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectBackLabel}</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

function ProjectRegisterField({
    field,
}: {
    field: LumiLaboMockProjectRegisterField;
}) {
    const controlId = `lumilabo-project-register-${field.id}`;
    return (
        <div
            className={classNames(
                'grid gap-2',
                field.control === 'textarea' ? 'md:col-span-2' : undefined,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <label
                    htmlFor={controlId}
                    className="text-base font-black text-black"
                >
                    {field.label}
                </label>
                <span
                    className={classNames(
                        'shrink-0 rounded-md border px-2 py-1 text-xs font-black',
                        field.requirementLabel === '必須'
                            ? 'border-yellow-500 bg-yellow-100 text-yellow-900'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-600',
                    )}
                >
                    {field.requirementLabel}
                </span>
            </div>

            {field.control === 'textarea' ? (
                <textarea
                    id={controlId}
                    name={field.id}
                    rows={field.rows}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className={classNames(
                        getProjectRegisterControlClasses(),
                        'resize-none leading-relaxed',
                    )}
                />
            ) : (
                <input
                    id={controlId}
                    name={field.id}
                    type="text"
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className={getProjectRegisterControlClasses()}
                />
            )}
        </div>
    );
}

function createProjectDetailDraft(
    projectDetail: LumiLaboMockProjectDetail,
): LumiLaboMockProjectDetailDraft {
    return {
        companyName: projectDetail.companyName,
        contactName: projectDetail.contactName,
        address: projectDetail.address,
        memo: projectDetail.memo,
    };
}

function hasProjectDetailDraftChanged(
    draft: LumiLaboMockProjectDetailDraft,
    saved: LumiLaboMockProjectDetail,
): boolean {
    return projectDetailTextFields.some((field) => draft[field.id] !== saved[field.id]);
}

function createGoogleMapsSearchUrl(address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function clearMockTimer(
    timerRef: MutableRefObject<ReturnType<typeof window.setTimeout> | null>,
) {
    if (timerRef.current === null) {
        return;
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
}

function getFileTagClasses(isActive: boolean): string {
    return classNames(
        'min-h-8 min-w-24 flex-none rounded-t-md border border-b-0 px-3 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
        isActive
            ? 'border-yellow-400 bg-white text-black shadow-sm'
            : 'border-yellow-200 bg-yellow-100 text-yellow-950 hover:bg-yellow-50',
    );
}

function getProjectEntryButtonClasses(): string {
    return 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-yellow-600 bg-yellow-300 px-5 text-lg font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10 [@media(orientation:landscape)_and_(max-height:480px)]:px-3 [@media(orientation:landscape)_and_(max-height:480px)]:text-base';
}

function getProjectRegisterControlClasses(): string {
    return 'min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-base font-semibold text-black placeholder:text-neutral-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300';
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
