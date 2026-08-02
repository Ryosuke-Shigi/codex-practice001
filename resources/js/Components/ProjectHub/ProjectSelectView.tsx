import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type RefObject,
} from 'react';

import AquaParticlesBackground from '@/Components/Effects/AquaParticlesBackground';
import useSwipeNavigation from '@/Hooks/useSwipeNavigation';

import './projectHub.css';
import {
    getAdjacentProjectIndex,
    projects,
    sortStagesForProjectSelect,
    type DedicatedProject,
    type Project,
    type Stage,
} from './projectData';
import { resolveProjectIcon } from './projectIcons';
import {
    buildProjectSelectHref,
    parseProjectSelectUrl,
} from './projectNavigation';
import usePrefersReducedMotion from './usePrefersReducedMotion';

type ProjectSelectScreen =
    | 'project-select'
    | 'project-expanding'
    | 'stage-select'
    | 'project-returning'
    | 'stage-navigating';

type ProjectThemeStyle = CSSProperties & {
    '--project-accent': string;
    '--project-bg': string;
    '--project-bg-glow': string;
    '--project-muted': string;
    '--project-sphere': string;
    '--project-sphere-shadow': string;
    '--project-surface': string;
    '--project-text': string;
};

const STAGE_TRANSITION_MS = 280;

export default function ProjectSelectView() {
    const { url: pageUrl } = usePage();
    const projectSelectUrl = getProjectSelectRuntimeUrl(pageUrl);
    const initialUrl = useRef(parseProjectSelectUrl(projectSelectUrl)).current;
    const initialSelectedIndex = getProjectIndex(initialUrl.state.projectId);
    const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
    const [screen, setScreen] = useState<ProjectSelectScreen>(
        initialUrl.state.screen,
    );
    const [isStageMounted, setIsStageMounted] = useState(
        initialUrl.state.screen === 'stage-select',
    );
    const [visibleDescription, setVisibleDescription] = useState(
        projects[initialSelectedIndex].description,
    );
    const sphereRef = useRef<HTMLButtonElement>(null);
    const firstStageActionRef = useRef<HTMLButtonElement>(null);
    const transitionTimerRef = useRef<number | null>(null);
    const navigatingHrefRef = useRef<string | null>(null);
    const lastPageUrlRef = useRef(projectSelectUrl);
    const internalPageUrlRef = useRef<string | null>(null);
    const prefersReducedMotion = usePrefersReducedMotion();
    const selectedProject = projects[selectedIndex];
    const previousProject =
        projects[getAdjacentProjectIndex(selectedIndex, -1)];
    const nextProject = projects[getAdjacentProjectIndex(selectedIndex, 1)];
    const selectedStages = useMemo(
        () =>
            selectedProject.kind === 'staged'
                ? sortStagesForProjectSelect(selectedProject.stages)
                : [],
        [selectedProject],
    );
    const hasStages = selectedProject.kind === 'staged';
    const SelectedIcon = resolveProjectIcon(selectedProject.iconKey);
    const themeStyle = useMemo(
        () => createProjectThemeStyle(selectedProject),
        [selectedProject],
    );
    const isProjectSelectable = screen === 'project-select';
    const depthActionStatus = getDepthActionStatus(
        selectedProject.name,
        hasStages,
        screen,
    );

    const clearTransitionTimer = useCallback(() => {
        if (transitionTimerRef.current !== null) {
            window.clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }
    }, []);

    const replaceProjectUrl = useCallback((href: string) => {
        internalPageUrlRef.current = href;
        router.replace({ url: href });
    }, []);

    const selectProject = useCallback(
        (offset: -1 | 1) => {
            if (!isProjectSelectable) {
                return;
            }

            const nextIndex = getAdjacentProjectIndex(selectedIndex, offset);

            setSelectedIndex(nextIndex);
            replaceProjectUrl(
                buildProjectSelectHref(projects[nextIndex].id, 'project'),
            );
        },
        [isProjectSelectable, replaceProjectUrl, selectedIndex],
    );

    const selectPreviousProject = useCallback(() => {
        selectProject(-1);
    }, [selectProject]);

    const selectNextProject = useCallback(() => {
        selectProject(1);
    }, [selectProject]);

    const enterSelectedProject = useCallback(() => {
        if (!isProjectSelectable) {
            return;
        }

        clearTransitionTimer();
        setIsStageMounted(true);

        if (selectedProject.kind === 'staged') {
            replaceProjectUrl(
                buildProjectSelectHref(selectedProject.id, 'stages'),
            );
        }

        if (prefersReducedMotion) {
            setScreen('stage-select');
            return;
        }

        setScreen('project-expanding');
        transitionTimerRef.current = window.setTimeout(() => {
            setScreen('stage-select');
            transitionTimerRef.current = null;
        }, STAGE_TRANSITION_MS);
    }, [
        clearTransitionTimer,
        isProjectSelectable,
        prefersReducedMotion,
        replaceProjectUrl,
        selectedProject,
    ]);

    const returnToProjectSelection = useCallback(() => {
        if (screen !== 'stage-select') {
            return;
        }

        clearTransitionTimer();
        replaceProjectUrl(
            buildProjectSelectHref(selectedProject.id, 'project'),
        );

        if (prefersReducedMotion) {
            setScreen('project-select');
            setIsStageMounted(false);
            return;
        }

        setScreen('project-returning');
        transitionTimerRef.current = window.setTimeout(() => {
            setScreen('project-select');
            setIsStageMounted(false);
            transitionTimerRef.current = null;
            sphereRef.current?.focus();
        }, STAGE_TRANSITION_MS);
    }, [
        clearTransitionTimer,
        prefersReducedMotion,
        replaceProjectUrl,
        screen,
        selectedProject.id,
    ]);

    const visitStage = useCallback(
        (href: string) => {
            if (
                screen !== 'stage-select' ||
                navigatingHrefRef.current !== null
            ) {
                return;
            }

            navigatingHrefRef.current = href;
            setScreen('stage-navigating');

            router.visit(href, {
                onFinish: () => {
                    navigatingHrefRef.current = null;
                    setScreen('stage-select');
                },
            });
        },
        [screen],
    );

    const visitDedicatedAction = useCallback(() => {
        if (selectedProject.kind !== 'dedicated') {
            return;
        }

        visitStage(selectedProject.action.route);
    }, [selectedProject, visitStage]);

    useSwipeNavigation({
        disabled: !isProjectSelectable,
        onSwipeLeft: selectNextProject,
        onSwipeRight: selectPreviousProject,
    });

    useEffect(() => {
        const parsedUrl = parseProjectSelectUrl(projectSelectUrl);

        if (parsedUrl.shouldCanonicalize) {
            router.replace({ url: parsedUrl.canonicalHref });
        }

        if (lastPageUrlRef.current === projectSelectUrl) {
            return;
        }

        lastPageUrlRef.current = projectSelectUrl;

        if (internalPageUrlRef.current === projectSelectUrl) {
            internalPageUrlRef.current = null;
            return;
        }

        clearTransitionTimer();
        navigatingHrefRef.current = null;
        setSelectedIndex(getProjectIndex(parsedUrl.state.projectId));
        setScreen(parsedUrl.state.screen);
        setIsStageMounted(parsedUrl.state.screen === 'stage-select');
    }, [clearTransitionTimer, projectSelectUrl]);

    useEffect(() => {
        if (prefersReducedMotion) {
            setVisibleDescription(selectedProject.description);
            return;
        }

        let nextLength = 0;
        setVisibleDescription('');

        const typingTimer = window.setInterval(() => {
            nextLength += 1;
            setVisibleDescription(
                selectedProject.description.slice(0, nextLength),
            );

            if (nextLength >= selectedProject.description.length) {
                window.clearInterval(typingTimer);
            }
        }, 24);

        return () => {
            window.clearInterval(typingTimer);
        };
    }, [prefersReducedMotion, selectedProject.description]);

    useEffect(() => {
        if (screen !== 'stage-select') {
            return;
        }

        firstStageActionRef.current?.focus();
    }, [screen]);

    useLayoutEffect(() => {
        if (screen === 'project-select') {
            sphereRef.current?.focus();
        }
    }, [screen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isProjectSelectable) {
                return;
            }

            if (event.key === 'ArrowLeft') {
                if (
                    shouldIgnoreProjectKeyTarget(
                        event.target,
                        sphereRef.current,
                    )
                ) {
                    return;
                }

                event.preventDefault();
                selectPreviousProject();
                return;
            }

            if (event.key === 'ArrowRight') {
                if (
                    shouldIgnoreProjectKeyTarget(
                        event.target,
                        sphereRef.current,
                    )
                ) {
                    return;
                }

                event.preventDefault();
                selectNextProject();
                return;
            }

            if (event.key === 'Enter') {
                if (shouldIgnoreProjectKeyTarget(event.target)) {
                    return;
                }

                event.preventDefault();
                enterSelectedProject();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enterSelectedProject, isProjectSelectable, selectNextProject, selectPreviousProject]);

    useEffect(
        () => () => {
            clearTransitionTimer();
        },
        [clearTransitionTimer],
    );

    return (
        <section
            className={`project-select-page project-select-page--${screen}`}
            style={themeStyle}
        >
            <Head title="Project Select" />

            <AquaParticlesBackground />
            <div className="project-select-backdrop" aria-hidden="true" />

            <header className="project-select-header">
                <Link
                    href="/"
                    className="project-nav-link"
                    aria-label="Portfolioへ戻る"
                    title="Portfolioへ戻る"
                >
                    戻る
                </Link>
            </header>

            <div className="project-select-main">
                <div
                    className="project-sphere-stage"
                    aria-label="Project selector"
                >
                    {isProjectSelectable && (
                        <>
                            <button
                                type="button"
                                className="project-select-arrow project-select-arrow--left"
                                onClick={selectPreviousProject}
                                aria-label="前のProjectへ切り替える"
                                title="前のProject"
                            >
                                <ChevronLeft aria-hidden="true" size={24} />
                            </button>

                            <SideProjectBubble
                                project={previousProject}
                                position="left"
                            />
                        </>
                    )}

                    <button
                        ref={sphereRef}
                        type="button"
                        className="project-sphere-button"
                        disabled={!isProjectSelectable}
                        onClick={enterSelectedProject}
                        aria-label={
                            selectedProject.kind === 'staged'
                                ? `${selectedProject.name} の開発段階を選択する`
                                : `${selectedProject.name} の専用操作を選択する`
                        }
                    >
                        <span className="project-sphere-core">
                            <span className="project-sphere-shine" />
                            <SelectedIcon
                                aria-hidden="true"
                                className="project-sphere-icon"
                                size={48}
                                strokeWidth={1.8}
                            />
                        </span>
                    </button>

                    {isProjectSelectable && (
                        <>
                            <SideProjectBubble
                                project={nextProject}
                                position="right"
                            />

                            <button
                                type="button"
                                className="project-select-arrow project-select-arrow--right"
                                onClick={selectNextProject}
                                aria-label="次のProjectへ切り替える"
                                title="次のProject"
                            >
                                <ChevronRight aria-hidden="true" size={24} />
                            </button>
                        </>
                    )}
                </div>

                {isStageMounted && (
                    <section
                        className="project-depth-select"
                        aria-label={
                            hasStages
                                ? `${selectedProject.name} の開発段階`
                                : `${selectedProject.name} の専用操作`
                        }
                    >
                        <div className="project-depth-select-heading">
                            <button
                                type="button"
                                className="project-stage-back-button"
                                disabled={screen !== 'stage-select'}
                                onClick={returnToProjectSelection}
                                aria-label="PROJECT選択へ戻る"
                                title="PROJECT選択へ戻る"
                            >
                                <ArrowLeft aria-hidden="true" size={18} />
                                戻る
                            </button>
                            <p>
                                {hasStages
                                    ? 'Development stages'
                                    : 'Dedicated action'}
                            </p>
                        </div>

                        <div
                            className={
                                hasStages
                                    ? `project-stage-grid project-stage-grid--${selectedStages.length}`
                                    : 'project-dedicated-action-grid'
                            }
                        >
                            {hasStages ? (
                                selectedStages.map((stage, index) => (
                                    <StageAction
                                        key={stage.kind}
                                        actionRef={
                                            index === 0
                                                ? firstStageActionRef
                                                : undefined
                                        }
                                        disabled={screen !== 'stage-select'}
                                        stage={stage}
                                        onSelect={() => visitStage(stage.route)}
                                    />
                                ))
                            ) : (
                                <DedicatedProjectAction
                                    actionRef={firstStageActionRef}
                                    action={
                                        (selectedProject as DedicatedProject)
                                            .action
                                    }
                                    disabled={screen !== 'stage-select'}
                                    onSelect={visitDedicatedAction}
                                />
                            )}
                        </div>
                    </section>
                )}
            </div>

            {!isStageMounted && (
                <aside
                    className="project-select-message"
                    aria-label={selectedProject.description}
                >
                    <div className="project-message-title">
                        <SelectedIcon aria-hidden="true" size={20} />
                        <span>{selectedProject.name}</span>
                    </div>
                    <p aria-hidden="true">
                        {visibleDescription}
                        {!prefersReducedMotion && (
                            <span className="project-typing-caret" />
                        )}
                    </p>
                    <span className="sr-only">
                        {selectedProject.description}
                    </span>
                </aside>
            )}

            <p className="sr-only" aria-live="polite">
                {depthActionStatus}
            </p>
        </section>
    );
}

function StageAction({
    actionRef,
    disabled,
    stage,
    onSelect,
}: {
    actionRef?: RefObject<HTMLButtonElement | null>;
    disabled: boolean;
    stage: Stage;
    onSelect: () => void;
}) {
    const StageIcon = resolveProjectIcon(stage.iconKey);

    return (
        <button
            ref={actionRef}
            type="button"
            className="project-depth-action project-stage-action"
            disabled={disabled}
            onClick={onSelect}
            aria-label={`${stage.name}: ${stage.description}`}
        >
            <span className="project-depth-action-icon" aria-hidden="true">
                <StageIcon size={28} strokeWidth={1.7} />
            </span>
            <span className="project-depth-action-copy">
                <strong>{stage.name}</strong>
                <span>{stage.description}</span>
            </span>
            <ChevronRight
                className="project-depth-action-chevron"
                aria-hidden="true"
                size={22}
            />
        </button>
    );
}

function DedicatedProjectAction({
    action,
    actionRef,
    disabled,
    onSelect,
}: {
    action: DedicatedProject['action'];
    actionRef?: RefObject<HTMLButtonElement | null>;
    disabled: boolean;
    onSelect: () => void;
}) {
    const ActionIcon = resolveProjectIcon(action.iconKey);
    const actionLabel = `${action.name}を開く`;

    return (
        <button
            ref={actionRef}
            type="button"
            className="project-depth-action project-dedicated-action"
            disabled={disabled}
            onClick={onSelect}
            aria-label={actionLabel}
            title={actionLabel}
        >
            <span className="project-depth-action-icon" aria-hidden="true">
                <ActionIcon size={28} strokeWidth={1.7} />
            </span>
            <span className="project-depth-action-copy">
                <strong>{actionLabel}</strong>
                <span>{action.description}</span>
            </span>
            <ChevronRight
                className="project-depth-action-chevron"
                aria-hidden="true"
                size={22}
            />
        </button>
    );
}

function SideProjectBubble({
    project,
    position,
}: {
    project: Project;
    position: 'left' | 'right';
}) {
    const ProjectIcon = resolveProjectIcon(project.iconKey);

    return (
        <div
            className={`project-side-bubble project-side-bubble--${position}`}
            aria-hidden="true"
        >
            <span className="project-side-bubble-core">
                <ProjectIcon size={24} strokeWidth={1.8} />
            </span>
        </div>
    );
}

function createProjectThemeStyle(project: Project): ProjectThemeStyle {
    return {
        '--project-accent': project.theme.accent,
        '--project-bg': project.theme.background,
        '--project-bg-glow': project.theme.backgroundGlow,
        '--project-muted': project.theme.muted,
        '--project-sphere': project.theme.sphere,
        '--project-sphere-shadow': project.theme.sphereShadow,
        '--project-surface': project.theme.surface,
        '--project-text': project.theme.text,
    };
}

/**
 * Laravel / Inertia が同名 query を1件へ正規化しても、直接URLの不正値を
 * canonicalizeできるよう、Project Select表示中はbrowserの実URLを優先します。
 */
function getProjectSelectRuntimeUrl(pageUrl: string): string {
    if (
        typeof window === 'undefined' ||
        window.location.pathname !== '/projects'
    ) {
        return pageUrl;
    }

    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function shouldIgnoreProjectKeyTarget(
    target: EventTarget | null,
    allowedButton: HTMLButtonElement | null = null,
): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    if (target === allowedButton) {
        return false;
    }

    return (
        target.closest(
            'a, button, input, textarea, select, [contenteditable="true"]',
        ) !== null
    );
}

function getProjectIndex(projectId: Project['id'] | null): number {
    if (projectId === null) {
        return 0;
    }

    const projectIndex = projects.findIndex(
        (project) => project.id === projectId,
    );

    return projectIndex === -1 ? 0 : projectIndex;
}

function getDepthActionStatus(
    projectName: string,
    hasStages: boolean,
    screen: ProjectSelectScreen,
): string {
    if (screen === 'project-expanding') {
        return hasStages
            ? `${projectName} の開発段階を表示しています。`
            : `${projectName} の専用操作を表示しています。`;
    }

    if (screen === 'stage-select') {
        return hasStages
            ? `${projectName} の開発段階を選択できます。`
            : `${projectName} の専用操作を選択できます。`;
    }

    if (screen === 'stage-navigating') {
        return hasStages
            ? `${projectName} の開発段階へ移動しています。`
            : `${projectName} の専用画面へ移動しています。`;
    }

    if (screen === 'project-returning') {
        return `${projectName} のProject選択へ戻っています。`;
    }

    return `${projectName} を選択しています。`;
}
