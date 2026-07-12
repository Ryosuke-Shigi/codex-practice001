import type { ChangeEvent, DragEvent, MutableRefObject } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    Camera,
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
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    lumiLaboGlobalTabs,
    createLumiLaboProjectDetail,
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
import LumiLaboProjectListPanel from './LumiLaboProjectListPanel';
import type {
    LumiLaboMockGlobalTabId,
    LumiLaboMockProjectDetail,
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectDetailEditableFieldId,
    LumiLaboMockProjectDetailReturnTarget,
    LumiLaboMockProjectList,
    LumiLaboMockProjectListItem,
    LumiLaboMockProjectOverride,
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

type ProjectDetailSaveBarProps = {
    statusLabel: string;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    onSave: () => void;
};

type ProjectDeleteConfirmDialogProps = {
    onCancel: () => void;
    onConfirm: () => void;
};

type ProjectDetailTextFieldProps = {
    field: ProjectDetailTextFieldConfig;
    value: string;
    mapSearchUrl?: string;
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

export type LumiLaboMockProjectSession = {
    detail: LumiLaboMockProjectDetail;
    draft: LumiLaboMockProjectDetailDraft;
};

export type LumiLaboMockProjectSessionById = Record<
    string,
    LumiLaboMockProjectSession | undefined
>;

export function createLumiLaboMockProjectSession(
    detail: LumiLaboMockProjectDetail,
): LumiLaboMockProjectSession {
    return {
        detail,
        draft: createProjectDetailDraft(detail),
    };
}

export function updateLumiLaboMockProjectSession(
    sessions: LumiLaboMockProjectSessionById,
    projectId: string,
    update: (session: LumiLaboMockProjectSession) => LumiLaboMockProjectSession,
): LumiLaboMockProjectSessionById {
    const session = sessions[projectId];

    if (session === undefined) {
        return sessions;
    }

    return {
        ...sessions,
        [projectId]: update(session),
    };
}

export function setLumiLaboMockProjectDroppedFileNames(
    droppedFileNamesByProjectId: Record<string, readonly string[] | undefined>,
    projectId: string,
    droppedFileNames: readonly string[],
): Record<string, readonly string[] | undefined> {
    return {
        ...droppedFileNamesByProjectId,
        [projectId]: droppedFileNames,
    };
}

export function canCompleteLumiLaboMockProjectSave(
    projectId: string,
    deletedProjectIds: ReadonlySet<string>,
): boolean {
    return !deletedProjectIds.has(projectId);
}

export function applyLumiLaboMockProjectSaveToCurrentDetail(
    currentProjectDetail: LumiLaboMockProjectDetail | null,
    savedProjectId: string,
    savedDraft: LumiLaboMockProjectDetailDraft,
): LumiLaboMockProjectDetail | null {
    if (
        currentProjectDetail === null ||
        currentProjectDetail.id !== savedProjectId
    ) {
        return currentProjectDetail;
    }

    return {
        ...currentProjectDetail,
        ...savedDraft,
    };
}

export function applyLumiLaboMockProjectSaveToSession(
    session: LumiLaboMockProjectSession,
    savedDraft: LumiLaboMockProjectDetailDraft,
): LumiLaboMockProjectSession {
    return {
        detail: {
            ...session.detail,
            ...savedDraft,
        },
        draft: session.draft,
    };
}

type LumiLaboProjectMockViewProps = {
    projectList: LumiLaboMockProjectList;
    initialDeletedProjectIds: readonly string[];
    initialProjectOverrides: readonly LumiLaboMockProjectOverride[];
};

export default function LumiLaboProjectMockView({
    projectList,
    initialDeletedProjectIds,
    initialProjectOverrides,
}: LumiLaboProjectMockViewProps) {
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
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null,
    );
    const [projectDetail, setProjectDetail] =
        useState<LumiLaboMockProjectDetail | null>(null);
    const [projectDetailDraft, setProjectDetailDraft] =
        useState<LumiLaboMockProjectDetailDraft>(
            createProjectDetailDraft(lumiLaboProjectDetail),
        );
    const [projectOverrides, setProjectOverrides] = useState<
        Record<string, LumiLaboMockProjectDetailDraft | undefined>
    >(() => createProjectOverrideRecord(initialProjectOverrides));
    const [deletedProjectIds, setDeletedProjectIds] = useState<ReadonlySet<string>>(
        () => new Set(initialDeletedProjectIds),
    );
    const [savingProjectIds, setSavingProjectIds] = useState<ReadonlySet<string>>(
        new Set(),
    );
    const [savedProjectIds, setSavedProjectIds] = useState<ReadonlySet<string>>(
        new Set(),
    );
    const [droppedFileNamesByProjectId, setDroppedFileNamesByProjectId] =
        useState<Record<string, readonly string[] | undefined>>({});
    const [isProjectDeleteDialogOpen, setIsProjectDeleteDialogOpen] =
        useState(false);
    const [projectSessions, setProjectSessions] =
        useState<LumiLaboMockProjectSessionById>({});
    const [shouldRefreshProjectList, setShouldRefreshProjectList] =
        useState(false);
    const deletedProjectIdsRef = useRef<ReadonlySet<string>>(
        new Set(initialDeletedProjectIds),
    );
    const saveCompleteTimerRef = useRef<
        Record<string, ReturnType<typeof window.setTimeout> | undefined>
    >({});
    const saveMessageTimerRef = useRef<
        Record<string, ReturnType<typeof window.setTimeout> | undefined>
    >({});

    const activeGlobalTabId: LumiLaboMockGlobalTabId =
        activeScreen === 'select' ? 'select' : 'top';
    const isProjectDetailSaving =
        projectDetail !== null && savingProjectIds.has(projectDetail.id);
    const projectDetailSavedVisible =
        projectDetail !== null && savedProjectIds.has(projectDetail.id);
    const droppedFileNames =
        projectDetail === null
            ? []
            : (droppedFileNamesByProjectId[projectDetail.id] ?? []);

    const hasProjectDetailChanges = hasProjectDetailDraftChanged(
        projectDetailDraft,
        projectDetail ?? lumiLaboProjectDetail,
    );

    useEffect(() => {
        return () => {
            clearProjectTimers(saveCompleteTimerRef);
            clearProjectTimers(saveMessageTimerRef);
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

    const handleProjectListRefreshed = useCallback(() => {
        setShouldRefreshProjectList(false);
    }, []);

    const openProject = () => {
        setActiveProjectTabId('top');
        setActiveProjectViewId('top');
        setActiveScreen('project');
    };

    const openProjectDetailFromList = (
        project: LumiLaboMockProjectListItem,
    ) => {
        const session =
            projectSessions[project.id] ??
            createLumiLaboMockProjectSession(
                createLumiLaboProjectDetail(
                    project,
                    projectOverrides[project.id],
                ),
            );

        setSelectedProjectId(project.id);
        setProjectDetail(session.detail);
        setProjectDetailDraft(session.draft);
        setProjectSessions((current) =>
            current[project.id] === undefined
                ? { ...current, [project.id]: session }
                : current,
        );
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
        if (projectDetail === null) {
            return;
        }

        const nextDraft = {
            ...projectDetailDraft,
            [fieldId]: value,
        };

        setProjectDetailDraft(nextDraft);
        setProjectSessions((current) =>
            updateLumiLaboMockProjectSession(
                current,
                projectDetail.id,
                (session) => ({ ...session, draft: nextDraft }),
            ),
        );
        setSavedProjectIds((current) => removeProjectId(current, projectDetail.id));
    };

    const saveProjectDetail = () => {
        if (
            projectDetail === null ||
            selectedProjectId === null ||
            savingProjectIds.has(selectedProjectId) ||
            !hasProjectDetailChanges
        ) {
            return;
        }

        const savedProjectId = selectedProjectId;
        const savedDraft = { ...projectDetailDraft };

        clearProjectTimer(saveCompleteTimerRef, savedProjectId);
        clearProjectTimer(saveMessageTimerRef, savedProjectId);
        setSavingProjectIds((current) => addProjectId(current, savedProjectId));
        setSavedProjectIds((current) => removeProjectId(current, savedProjectId));

        saveCompleteTimerRef.current[savedProjectId] = window.setTimeout(() => {
            if (!canCompleteLumiLaboMockProjectSave(savedProjectId, deletedProjectIdsRef.current)) {
                setSavingProjectIds((current) =>
                    removeProjectId(current, savedProjectId),
                );
                delete saveCompleteTimerRef.current[savedProjectId];

                return;
            }

            setProjectDetail((current) =>
                applyLumiLaboMockProjectSaveToCurrentDetail(
                    current,
                    savedProjectId,
                    savedDraft,
                ),
            );
            setProjectSessions((current) =>
                updateLumiLaboMockProjectSession(
                    current,
                    savedProjectId,
                    (session) =>
                        applyLumiLaboMockProjectSaveToSession(
                            session,
                            savedDraft,
                        ),
                ),
            );
            setProjectOverrides((current) => ({
                ...current,
                [savedProjectId]: savedDraft,
            }));
            setShouldRefreshProjectList(true);
            setSavingProjectIds((current) =>
                removeProjectId(current, savedProjectId),
            );
            setSavedProjectIds((current) => addProjectId(current, savedProjectId));
            delete saveCompleteTimerRef.current[savedProjectId];

            saveMessageTimerRef.current[savedProjectId] = window.setTimeout(() => {
                setSavedProjectIds((current) =>
                    removeProjectId(current, savedProjectId),
                );
                delete saveMessageTimerRef.current[savedProjectId];
            }, 3000);
        }, 250);
    };

    const updateDroppedFiles = (files: FileList | null) => {
        if (!files) {
            return;
        }

        if (projectDetail === null) {
            return;
        }

        setDroppedFileNamesByProjectId((current) =>
            setLumiLaboMockProjectDroppedFileNames(
                current,
                projectDetail.id,
                Array.from(files).map((file) => file.name),
            ),
        );
    };

    const removeSavedPhoto = (photoId: string) => {
        if (projectDetail === null) {
            return;
        }

        const projectId = projectDetail.id;
        setProjectDetail((current) => {
            if (current === null || current.id !== projectId) {
                return current;
            }

            return {
                ...current,
                savedPhotos: current.savedPhotos.filter(
                    (photo) => photo.id !== photoId,
                ),
            };
        });
        setProjectSessions((current) =>
            updateLumiLaboMockProjectSession(current, projectId, (session) => ({
                ...session,
                detail: {
                    ...session.detail,
                    savedPhotos: session.detail.savedPhotos.filter(
                        (photo) => photo.id !== photoId,
                    ),
                },
            })),
        );
    };

    const removeSavedFile = (fileId: string) => {
        if (projectDetail === null) {
            return;
        }

        const projectId = projectDetail.id;
        setProjectDetail((current) => {
            if (current === null || current.id !== projectId) {
                return current;
            }

            return {
                ...current,
                savedFiles: current.savedFiles.filter((file) => file.id !== fileId),
            };
        });
        setProjectSessions((current) =>
            updateLumiLaboMockProjectSession(current, projectId, (session) => ({
                ...session,
                detail: {
                    ...session.detail,
                    savedFiles: session.detail.savedFiles.filter(
                        (file) => file.id !== fileId,
                    ),
                },
            })),
        );
    };

    const requestProjectDelete = () => {
        setIsProjectDeleteDialogOpen(true);
    };

    const confirmProjectDelete = () => {
        if (projectDetail === null) {
            return;
        }

        const deletedProjectId = projectDetail.id;

        clearProjectTimer(saveCompleteTimerRef, deletedProjectId);
        clearProjectTimer(saveMessageTimerRef, deletedProjectId);
        const nextDeletedProjectIds = addProjectId(
            deletedProjectIdsRef.current,
            deletedProjectId,
        );

        deletedProjectIdsRef.current = nextDeletedProjectIds;
        setDeletedProjectIds(nextDeletedProjectIds);
        setProjectSessions((current) => removeProjectSession(current, deletedProjectId));
        setProjectOverrides((current) => removeProjectRecord(current, deletedProjectId));
        setDroppedFileNamesByProjectId((current) =>
            removeProjectRecord(current, deletedProjectId),
        );
        setSavingProjectIds((current) =>
            removeProjectId(current, deletedProjectId),
        );
        setSavedProjectIds((current) =>
            removeProjectId(current, deletedProjectId),
        );
        setShouldRefreshProjectList(true);
        setSelectedProjectId(null);
        setProjectDetail(null);
        setProjectDetailDraft(createProjectDetailDraft(lumiLaboProjectDetail));
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
                    <LumiLaboProjectListPanel
                        projectList={projectList}
                        projectOverrides={projectOverrides}
                        deletedProjectIds={Array.from(deletedProjectIds)}
                        shouldRefreshProjectList={shouldRefreshProjectList}
                        onProjectListRefreshed={handleProjectListRefreshed}
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
    const mapAddress = draft.address.trim();
    const mapSearchUrl =
        mapAddress === '' ? undefined : createGoogleMapsSearchUrl(mapAddress);
    const statusLabel = isSaving
        ? lumiLaboProjectDetailSavingLabel
        : saveMessageVisible
          ? lumiLaboProjectDetailSavedMessage
          : hasUnsavedChanges
            ? lumiLaboProjectDetailEditingLabel
            : null;
    const shouldShowSaveBar = statusLabel !== null || hasUnsavedChanges;

    return (
        <section className="relative h-full min-h-0 overflow-y-auto bg-[#f6efdd] px-4 py-4 [@media(orientation:landscape)_and_(max-height:480px)]:py-3 sm:px-6 sm:py-6">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(87,77,56,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(87,77,56,0.06)_1px,transparent_1px)] bg-[size:28px_28px]"
            />
            <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                {shouldShowSaveBar && statusLabel ? <ProjectDetailSaveBar statusLabel={statusLabel} hasUnsavedChanges={hasUnsavedChanges} isSaving={isSaving} onSave={onSave} /> : null}

                <header className="rounded-[8px] border border-stone-300 border-l-[6px] border-l-yellow-300 bg-[#fffdf7] p-4 text-black shadow-sm shadow-stone-900/10 sm:p-5">
                    <div className="grid gap-4">
                        <div className="grid min-w-0 gap-3">
                            <button
                                type="button"
                                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[6px] border border-stone-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px sm:w-fit"
                                data-lumilabo-back-target={backTargetId}
                                onClick={onBack}
                            >
                                <ArrowLeft className="h-5 w-5" aria-hidden />
                                <span>{lumiLaboProjectDetailBackLabel}</span>
                            </button>

                            <div className="grid gap-2">
                                <p className="text-base font-black text-yellow-900">
                                    案件詳細
                                </p>
                                <h1 className="break-words text-[1.75rem] font-black leading-tight text-black sm:text-4xl">
                                    {draft.companyName}
                                </h1>
                                <div className="flex flex-wrap gap-2 text-base font-bold leading-relaxed text-stone-800 sm:text-lg">
                                    <span className="rounded-[4px] border border-stone-200 bg-white/80 px-3 py-1">
                                        担当者：{draft.contactName}
                                    </span>
                                    <span className="rounded-[4px] border border-stone-200 bg-white/80 px-3 py-1">
                                        住所：{draft.address}
                                    </span>
                                    <span className="rounded-[4px] border border-stone-200 bg-stone-50 px-3 py-1">
                                        登録日：{projectDetail.registeredDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-start">
                    <section
                        className={classNames(
                            'rounded-[8px] border border-stone-300 border-l-[6px] bg-[#fffefa] p-4 shadow-sm shadow-stone-900/10 sm:p-5',
                            hasUnsavedChanges || isSaving
                                ? 'border-l-yellow-400 shadow-yellow-900/10'
                                : 'border-l-stone-300',
                        )}
                    >
                        <h2 className="mb-5 text-2xl font-black leading-tight text-black">
                            基本情報
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            {projectDetailTextFields.map((field) => (
                                <ProjectDetailTextField
                                    key={field.id}
                                    field={field}
                                    value={draft[field.id]}
                                    mapSearchUrl={
                                        field.id === 'address'
                                            ? mapSearchUrl
                                            : undefined
                                    }
                                    onChange={onChangeDraftField}
                                />
                            ))}
                        </div>

                        <div className="mt-4 rounded-[4px] border border-stone-200 bg-stone-50/80 p-3">
                            <p className="text-lg font-black text-black">
                                登録日
                            </p>
                            <p
                                aria-readonly="true"
                                className="mt-2 min-h-14 rounded-[4px] border border-stone-300 bg-white px-3 py-3 text-lg font-semibold leading-relaxed text-black"
                            >
                                {projectDetail.registeredDate}
                            </p>
                        </div>
                    </section>

                    <div className="grid gap-4">
                        <section className="rounded-[8px] border border-stone-300 bg-[#fffefa] p-4 shadow-sm shadow-stone-900/10 sm:p-5">
                            <button
                                type="button"
                                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[6px] border border-yellow-600 bg-yellow-300 px-5 text-lg font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                            >
                                <Camera className="h-5 w-5" aria-hidden />
                                <span>写真を撮影する</span>
                            </button>
                            <SavedPhotoPreview
                                projectDetail={projectDetail}
                                onRemoveSavedPhoto={onRemoveSavedPhoto}
                            />
                        </section>

                        <section className="rounded-[8px] border border-stone-300 bg-[#fffefa] p-4 shadow-sm shadow-stone-900/10 sm:p-5">
                            <FileDropZone
                                droppedFileNames={droppedFileNames}
                                onDropFiles={onDropFiles}
                            />
                            <SavedFilePreview
                                projectDetail={projectDetail}
                                onRemoveSavedFile={onRemoveSavedFile}
                            />
                        </section>
                    </div>
                </div>

                <div className="mt-2 sm:max-w-xl">
                    <button
                        type="button"
                        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[6px] border border-red-700 bg-white px-5 text-lg font-black text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
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

function ProjectDetailSaveBar({
    statusLabel,
    hasUnsavedChanges,
    isSaving,
    onSave,
}: ProjectDetailSaveBarProps) {
    return (
        <div
            className="sticky top-0 z-20 rounded-[8px] border border-yellow-200/80 bg-white/85 p-2.5 text-black shadow-sm shadow-stone-900/10 backdrop-blur-md sm:p-3"
            data-lumilabo-save-bar="true"
        >
            <div
                className={classNames(
                    'grid min-h-12 items-center gap-3',
                    hasUnsavedChanges
                        ? 'grid-cols-[minmax(0,1fr)_auto]'
                        : 'grid-cols-1',
                )}
            >
                <p
                    role="status"
                    aria-live="polite"
                    className="inline-flex min-w-0 items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50/90 px-3 py-2 text-base font-black leading-tight text-yellow-950 sm:text-lg"
                >
                    <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-300 shadow-[0_0_0_4px_rgba(253,224,71,0.2)]"
                    />
                    <span className="min-w-0 truncate">{statusLabel}</span>
                </p>

                {hasUnsavedChanges ? (
                    <button
                        type="button"
                        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[6px] border border-yellow-600 bg-yellow-300 px-4 text-base font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-36 sm:px-5 sm:text-lg"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        <Save className="h-5 w-5 shrink-0" aria-hidden />
                        <span>{lumiLaboProjectDetailSaveLabel}</span>
                    </button>
                ) : null}
            </div>
        </div>
    );
}

function ProjectDetailTextField({
    field,
    value,
    mapSearchUrl,
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
            <label htmlFor={controlId} className="text-lg font-black text-black">
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
                        getProjectDetailControlClasses(),
                        'min-h-32 resize-y leading-relaxed',
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
                    className={getProjectDetailControlClasses()}
                />
            )}
            {mapSearchUrl ? <MapPreview href={mapSearchUrl} /> : null}
        </div>
    );
}

function MapPreview({ href }: { href: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Google Mapsで住所を確認する"
            className="relative block min-h-56 overflow-hidden rounded-[4px] border border-stone-300 bg-[#edf4dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 sm:min-h-64"
        >
            <span className="absolute left-[-8%] top-[52%] h-3 w-[115%] rotate-1 bg-white shadow-[0_0_0_2px_#ddd7a7]" />
            <span className="absolute left-[8%] top-[34%] h-3 w-[88%] -rotate-2 bg-white shadow-[0_0_0_2px_#ddd7a7]" />
            <span className="absolute left-[4%] top-[76%] h-3 w-[64%] -rotate-[28deg] bg-white shadow-[0_0_0_2px_#ddd7a7]" />
            <span className="absolute left-[20%] top-[-10%] h-[130%] w-px -rotate-12 bg-lime-200" />
            <span className="absolute left-[45%] top-[-10%] h-[130%] w-px -rotate-12 bg-lime-200" />
            <span className="absolute left-[70%] top-[-10%] h-[130%] w-px -rotate-12 bg-lime-200" />
            <MapPin
                className="absolute left-1/2 top-[50%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 fill-red-500 text-red-700 drop-shadow"
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
        <div className="grid gap-3">
            <label
                htmlFor={inputId}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-yellow-600 bg-white px-4 text-center text-lg font-black leading-snug text-black transition hover:bg-yellow-50 focus-within:ring-2 focus-within:ring-yellow-500 active:translate-y-px"
            >
                <Upload className="h-5 w-5 shrink-0" aria-hidden />
                <span className="md:hidden">ファイルを選択</span>
                <span className="hidden md:inline">
                    ファイルを選択、またはまとめてドラッグ＆ドロップ
                </span>
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
                <ul className="grid gap-2 rounded-[4px] border border-yellow-300 bg-yellow-50 p-3 text-base font-bold leading-relaxed text-stone-800">
                    {droppedFileNames.map((fileName) => (
                        <li key={fileName} className="break-all">
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="lumilabo-project-delete-dialog-title"
                className="grid w-full max-w-sm gap-4 rounded-[6px] border border-red-300 bg-white p-5 text-black shadow-xl shadow-red-950/20"
            >
                <h2
                    id="lumilabo-project-delete-dialog-title"
                    className="text-center text-2xl font-black leading-tight"
                >
                    {lumiLaboProjectDeleteConfirmMessage}
                </h2>
                <div className="grid gap-2">
                    <button
                        type="button"
                        className="inline-flex min-h-14 w-full items-center justify-center rounded-[6px] border border-stone-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                        onClick={onCancel}
                    >
                        {lumiLaboProjectDeleteConfirmNoLabel}
                    </button>
                    <button
                        type="button"
                        className="inline-flex min-h-14 w-full items-center justify-center rounded-[6px] border border-red-700 bg-red-600 px-5 text-lg font-black text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
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
        <section className="mt-4 grid gap-3 rounded-[4px] border border-stone-200 bg-white/80 p-3">
            <h3 className="text-xl font-black text-black">保存済み写真</h3>
            <div className="flex flex-wrap gap-3">
                {projectDetail.savedPhotos.map((photo) => (
                    <div key={photo.id} className="relative h-24 w-32">
                        <div
                            role="img"
                            aria-label={photo.alt}
                            className="relative h-full w-full overflow-hidden rounded-[4px] border border-stone-300 bg-sky-100"
                        >
                            <span className="absolute left-2 top-2 inline-flex h-7 min-w-9 items-center justify-center rounded-[4px] bg-white px-2 text-base font-black text-black">
                                {photo.label}
                            </span>
                            <span className="absolute right-3 top-[50%] h-5 w-5 rounded-full bg-yellow-200" />
                            <span className="absolute bottom-3 left-2 h-0 w-0 border-b-[32px] border-l-[52px] border-r-[30px] border-b-green-600 border-l-transparent border-r-transparent" />
                            <span className="absolute bottom-3 left-9 h-0 w-0 border-b-[26px] border-l-[38px] border-r-[38px] border-b-green-700 border-l-transparent border-r-transparent" />
                        </div>
                        <button
                            type="button"
                            aria-label={photo.alt + 'を削除'}
                            className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-black shadow-sm transition hover:border-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
                            onClick={() => onRemoveSavedPhoto(photo.id)}
                        >
                            <X className="h-5 w-5" aria-hidden />
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
        <section className="mt-4 grid gap-3 rounded-[4px] border border-stone-200 bg-white/80 p-3">
            <h3 className="text-xl font-black text-black">保存済みファイル</h3>
            <div className="grid gap-2">
                {projectDetail.savedFiles.map((file) => (
                    <div
                        key={file.id}
                        className="relative flex min-h-16 items-center gap-3 rounded-[4px] border border-stone-300 bg-white px-3 py-2 pr-14 text-black"
                    >
                        <span className="inline-flex h-11 min-w-12 items-center justify-center rounded-[4px] border border-stone-300 bg-stone-50 px-2 text-sm font-black">
                            {file.fileTypeLabel}
                        </span>
                        <FileText className="h-6 w-6 shrink-0" aria-hidden />
                        <span className="min-w-0 break-all text-lg font-black leading-snug">
                            {file.fileName}
                        </span>
                        <button
                            type="button"
                            aria-label={file.fileName + 'を削除'}
                            className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-black shadow-sm transition hover:border-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:translate-y-px"
                            onClick={() => onRemoveSavedFile(file.id)}
                        >
                            <X className="h-5 w-5" aria-hidden />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

function getProjectDetailControlClasses(): string {
    return 'min-h-14 w-full rounded-[4px] border border-stone-300 bg-white px-3 py-3 text-lg font-semibold leading-relaxed text-black placeholder:text-stone-500 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300';
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

function createProjectOverrideRecord(
    projectOverrides: readonly LumiLaboMockProjectOverride[],
): Record<string, LumiLaboMockProjectDetailDraft | undefined> {
    return Object.fromEntries(
        projectOverrides.map(({ id, ...projectOverride }) => [
            id,
            projectOverride,
        ]),
    );
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

export function addProjectId(
    projectIds: ReadonlySet<string>,
    projectId: string,
): ReadonlySet<string> {
    return new Set(projectIds).add(projectId);
}

export function removeProjectId(
    projectIds: ReadonlySet<string>,
    projectId: string,
): ReadonlySet<string> {
    const nextProjectIds = new Set(projectIds);
    nextProjectIds.delete(projectId);

    return nextProjectIds;
}

function removeProjectRecord<T>(
    record: Record<string, T | undefined>,
    projectId: string,
): Record<string, T | undefined> {
    if (record[projectId] === undefined) {
        return record;
    }

    const { [projectId]: _, ...remaining } = record;

    return remaining;
}

function removeProjectSession(
    sessions: LumiLaboMockProjectSessionById,
    projectId: string,
): LumiLaboMockProjectSessionById {
    return removeProjectRecord(sessions, projectId);
}

type ProjectTimerRef = MutableRefObject<
    Record<string, ReturnType<typeof window.setTimeout> | undefined>
>;

function clearProjectTimer(timerRef: ProjectTimerRef, projectId: string) {
    const timer = timerRef.current[projectId];

    if (timer === undefined) {
        return;
    }

    window.clearTimeout(timer);
    delete timerRef.current[projectId];
}

function clearProjectTimers(timerRef: ProjectTimerRef) {
    Object.keys(timerRef.current).forEach((projectId) =>
        clearProjectTimer(timerRef, projectId),
    );
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
