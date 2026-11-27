import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type RefObject,
} from 'react';

import AquaParticlesBackground from '@/Components/Effects/AquaParticlesBackground';

import './projectHub.css';
import {
    sortStagesForProjectSelect,
    type Stage,
    type StagedProject,
} from './projectData';
import { resolveProjectIcon } from './projectIcons';
import { buildPortfolioProjectListHref } from './projectNavigation';

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

export default function ProjectSelectView({ project }: { project: StagedProject }) {
    const firstStageActionRef = useRef<HTMLButtonElement>(null);
    const navigatingRef = useRef(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const stages = sortStagesForProjectSelect(project.stages);
    const ProjectIcon = resolveProjectIcon(project.iconKey);
    const screen = isNavigating ? 'stage-navigating' : 'stage-select';

    useEffect(() => {
        if (!isNavigating) {
            firstStageActionRef.current?.focus();
        }
    }, [isNavigating]);

    function visitStage(href: string) {
        if (navigatingRef.current) {
            return;
        }

        navigatingRef.current = true;
        setIsNavigating(true);
        router.visit(href, {
            onFinish: () => {
                navigatingRef.current = false;
                setIsNavigating(false);
            },
        });
    }

    return (
        <section
            className={`project-select-page project-select-page--${screen}`}
            style={createProjectThemeStyle(project)}
        >
            <Head title="Project Select" />

            <AquaParticlesBackground />
            <div className="project-select-backdrop" aria-hidden="true" />

            <div className="project-select-main">
                <div className="project-sphere-stage" aria-hidden="true">
                    <span className="project-sphere">
                        <span className="project-sphere-core">
                            <span className="project-sphere-shine" />
                            <ProjectIcon
                                className="project-sphere-icon"
                                size={48}
                                strokeWidth={1.8}
                            />
                        </span>
                    </span>
                </div>

                <section
                    className="project-depth-select"
                    aria-label={`${project.name} の開発段階`}
                >
                    <div className="project-depth-select-heading">
                        <Link
                            className="project-stage-back-button"
                            href={buildPortfolioProjectListHref(project.id)}
                            aria-disabled={isNavigating || undefined}
                            tabIndex={isNavigating ? -1 : undefined}
                            onClick={(event) => {
                                if (navigatingRef.current) {
                                    event.preventDefault();
                                }
                            }}
                        >
                            <ArrowLeft aria-hidden="true" size={18} />
                            作品一覧へ
                        </Link>
                        <p>Development stages</p>
                    </div>

                    <div className={`project-stage-grid project-stage-grid--${stages.length}`}>
                        {stages.map((stage, index) => (
                            <StageAction
                                key={stage.kind}
                                actionRef={index === 0 ? firstStageActionRef : undefined}
                                disabled={isNavigating}
                                stage={stage}
                                onSelect={() => visitStage(stage.route)}
                            />
                        ))}
                    </div>
                </section>
            </div>

            <p className="sr-only" aria-live="polite">
                {isNavigating
                    ? `${project.name} の開発段階へ移動しています。`
                    : `${project.name} の開発段階を選択できます。`}
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

function createProjectThemeStyle(project: StagedProject): ProjectThemeStyle {
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
