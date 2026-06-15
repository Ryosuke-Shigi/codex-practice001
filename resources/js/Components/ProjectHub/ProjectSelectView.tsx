import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import useSwipeNavigation from '@/Hooks/useSwipeNavigation';

import './projectHub.css';
import {
    getAdjacentProjectIndex,
    getProjectHubHref,
    projects,
    type Project,
} from './projectData';
import { resolveProjectIcon } from './projectIcons';
import usePrefersReducedMotion from './usePrefersReducedMotion';

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

export default function ProjectSelectView() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const prefersReducedMotion = usePrefersReducedMotion();
    const selectedProject = projects[selectedIndex];
    const previousProject =
        projects[getAdjacentProjectIndex(selectedIndex, -1)];
    const nextProject = projects[getAdjacentProjectIndex(selectedIndex, 1)];
    const SelectedIcon = resolveProjectIcon(selectedProject.iconKey);
    const [visibleDescription, setVisibleDescription] = useState(
        selectedProject.description,
    );

    const themeStyle = useMemo(
        () => createProjectThemeStyle(selectedProject),
        [selectedProject],
    );

    const selectPreviousProject = useCallback(() => {
        setSelectedIndex((currentIndex) =>
            getAdjacentProjectIndex(currentIndex, -1),
        );
    }, []);

    const selectNextProject = useCallback(() => {
        setSelectedIndex((currentIndex) =>
            getAdjacentProjectIndex(currentIndex, 1),
        );
    }, []);

    const enterSelectedProject = useCallback(() => {
        router.visit(getProjectHubHref(selectedProject));
    }, [selectedProject]);

    useSwipeNavigation({
        onSwipeLeft: selectNextProject,
        onSwipeRight: selectPreviousProject,
    });

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
        const handleKeyDown = (event: KeyboardEvent) => {
            if (shouldIgnoreProjectKeyTarget(event.target)) {
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                selectPreviousProject();
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                selectNextProject();
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                enterSelectedProject();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enterSelectedProject, selectNextProject, selectPreviousProject]);

    return (
        <section className="project-select-page" style={themeStyle}>
            <Head title="Project Select" />

            <div className="project-select-backdrop" aria-hidden="true" />

            <header className="project-select-header">
                <Link href="/" className="project-nav-link">
                    Portfolio
                </Link>
            </header>

            <div className="project-select-main">
                <div
                    className="project-sphere-stage"
                    aria-label="Project selector"
                >
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

                    <button
                        type="button"
                        className="project-sphere-button"
                        onClick={enterSelectedProject}
                        aria-label={`${selectedProject.name} の Project Hub へ入る`}
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

                    <SideProjectBubble project={nextProject} position="right" />

                    <button
                        type="button"
                        className="project-select-arrow project-select-arrow--right"
                        onClick={selectNextProject}
                        aria-label="次のProjectへ切り替える"
                        title="次のProject"
                    >
                        <ChevronRight aria-hidden="true" size={24} />
                    </button>
                </div>
            </div>

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
                <span className="sr-only">{selectedProject.description}</span>
            </aside>
        </section>
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

function shouldIgnoreProjectKeyTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.closest('a, button, input, textarea, select, [contenteditable="true"]') !== null;
}
