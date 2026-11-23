import ProjectSelectView from '@/Components/ProjectHub/ProjectSelectView';
import useLinksLauncherHistory from '@/Hooks/useLinksLauncherHistory';

export default function Select() {
    const canGoBack = useLinksLauncherHistory();

    return <ProjectSelectView stageHistory={{ canGoBack }} />;
}
