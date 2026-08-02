import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { CSSProperties } from 'react';

import './projectHub.css';
import { projects, type DedicatedProject } from './projectData';
import { resolveProjectIcon } from './projectIcons';
import ProjectLogsField, {
    type ProjectLogsProps,
} from './ProjectLogsField';

type ProjectLogsViewProps = {
    applicationLogs: ProjectLogsProps;
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

const logsProject = getLogsProject();

export default function ProjectLogsView({
    applicationLogs,
}: ProjectLogsViewProps) {
    const LogsIcon = resolveProjectIcon(logsProject.iconKey);

    return (
        <section
            className="project-logs-page"
            style={createProjectThemeStyle(logsProject)}
        >
            <Head title="アプリログ" />

            <div className="project-select-backdrop" aria-hidden="true" />

            <header className="project-logs-header">
                <Link
                    href="/projects"
                    className="project-nav-link"
                    aria-label="PROJECT選択へ戻る"
                    title="PROJECT選択へ戻る"
                >
                    <ArrowLeft aria-hidden="true" size={18} />
                    戻る
                </Link>
                <Link
                    href="/"
                    className="project-nav-link project-nav-link--quiet"
                    aria-label="Portfolioへ戻る"
                    title="Portfolioへ戻る"
                >
                    戻る
                </Link>
            </header>

            <main className="project-logs-main">
                <section className="project-logs-hero">
                    <div className="project-logs-emblem" aria-hidden="true">
                        <LogsIcon size={52} strokeWidth={1.7} />
                    </div>
                    <div className="project-logs-title">
                        <h1>{logsProject.name}</h1>
                        <span>{logsProject.description}</span>
                    </div>
                </section>

                <ProjectLogsField logs={applicationLogs} />
            </main>
        </section>
    );
}

function createProjectThemeStyle(
    project: DedicatedProject,
): ProjectThemeStyle {
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

function getLogsProject(): DedicatedProject {
    const project = projects.find(
        (candidate): candidate is DedicatedProject =>
            candidate.kind === 'dedicated',
    );

    if (project === undefined) {
        throw new Error('アプリログの専用Project定義が見つかりません。');
    }

    return project;
}
