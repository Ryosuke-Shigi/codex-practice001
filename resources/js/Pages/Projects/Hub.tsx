import ProjectHubView from '@/Components/ProjectHub/ProjectHubView';

type ProjectHubPageProps = {
    projectId?: string;
};

export default function Hub({ projectId }: ProjectHubPageProps) {
    return <ProjectHubView projectId={projectId} />;
}
