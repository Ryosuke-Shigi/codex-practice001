import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { CSSProperties } from 'react';

import './projectHub.css';
import {
    getProjectById,
    projects,
    sortStagesForProjectHub,
    type Project,
    type ProjectModule,
    type Stage,
} from './projectData';
import { resolveProjectIcon } from './projectIcons';

type ProjectHubViewProps = {
    projectId?: string;
};

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

export default function ProjectHubView({ projectId }: ProjectHubViewProps) {
    const project = getProjectById(projectId) ?? projects[0];
    const ProjectIcon = resolveProjectIcon(project.iconKey);
    const orderedStages = sortStagesForProjectHub(project.stages);

    return (
        <section
            className="project-hub-page"
            style={createProjectThemeStyle(project)}
        >
            <Head title={`${project.name} Project Hub`} />

            <div className="project-select-backdrop" aria-hidden="true" />

            <header className="project-hub-header">
                <Link href="/projects" className="project-nav-link">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Project Select
                </Link>
                <Link href="/" className="project-nav-link project-nav-link--quiet">
                    Portfolio
                </Link>
            </header>

            <main className="project-hub-main">
                <section className="project-hub-hero">
                    <div className="project-hub-emblem" aria-hidden="true">
                        <ProjectIcon size={52} strokeWidth={1.7} />
                    </div>
                    <div className="project-hub-title">
                        <p>Project Hub</p>
                        <h1>{project.name}</h1>
                        <span>{project.description}</span>
                    </div>
                </section>

                <section
                    className="project-hub-stage-grid"
                    aria-label={`${project.name} stages`}
                >
                    {orderedStages.map((stage) => (
                        <StagePanel key={stage.kind} stage={stage} />
                    ))}
                </section>
            </main>
        </section>
    );
}

function StagePanel({ stage }: { stage: Stage }) {
    const StageIcon = resolveProjectIcon(stage.iconKey);

    const panel = (
        <article className="project-hub-stage project-hub-stage--available">
            <div className="project-hub-stage-head">
                <span className="project-hub-stage-icon" aria-hidden="true">
                    <StageIcon size={24} strokeWidth={1.8} />
                </span>
                <div>
                    <h2>{stage.name}</h2>
                </div>
            </div>

            <p>{stage.description}</p>

            {stage.modules !== undefined && (
                <div className="project-hub-modules">
                    {stage.modules.map((module) => (
                        <ModuleRow key={module.id} module={module} />
                    ))}
                </div>
            )}
        </article>
    );

    if (stage.route) {
        return (
            <Link href={stage.route} className="project-hub-stage-link">
                {panel}
            </Link>
        );
    }

    return panel;
}

function ModuleRow({ module }: { module: ProjectModule }) {
    const ModuleIcon = resolveProjectIcon(module.iconKey);
    const content = (
        <>
            <span className="project-hub-module-icon" aria-hidden="true">
                <ModuleIcon size={20} strokeWidth={1.8} />
            </span>
            <span className="project-hub-module-copy">
                <strong>{module.name}</strong>
                <span>{module.description}</span>
            </span>
            {module.route && (
                <ExternalLink
                    className="project-hub-module-external"
                    aria-hidden="true"
                    size={17}
                />
            )}
        </>
    );

    if (module.route) {
        return (
            <Link href={module.route} className="project-hub-module-row">
                {content}
            </Link>
        );
    }

    return <div className="project-hub-module-row">{content}</div>;
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
