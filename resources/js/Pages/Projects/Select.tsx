import ProjectSelectView from '@/Components/ProjectHub/ProjectSelectView';
import useLinksLancharHistory from '@/Hooks/useLinksLancharHistory';

export default function Select() {
    const canGoBack = useLinksLancharHistory();

    return <ProjectSelectView stageHistory={{ canGoBack }} />;
}
