import ProjectHubView from '@/Components/ProjectHub/ProjectHubView';
import type { ProjectLogsProps } from '@/Components/ProjectHub/ProjectLogsField';

type ProjectHubPageProps = {
    projectId?: string;
    applicationLogs?: ProjectLogsProps;
};

export default function Hub({
    projectId,
    applicationLogs,
}: ProjectHubPageProps) {
    return (
        <ProjectHubView
            projectId={projectId}
            applicationLogs={applicationLogs}
        />
    );
}
