import ProjectLogsView from '@/Components/ProjectHub/ProjectLogsView';
import type { ProjectLogsProps } from '@/Components/ProjectHub/ProjectLogsField';

type ProjectLogsPageProps = {
    applicationLogs: ProjectLogsProps;
};

export default function Logs({ applicationLogs }: ProjectLogsPageProps) {
    return <ProjectLogsView applicationLogs={applicationLogs} />;
}
