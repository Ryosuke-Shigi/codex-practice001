import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import { getProjectById } from '@/Components/ProjectHub/projectData';
import { parseProjectSelectUrl } from '@/Components/ProjectHub/projectNavigation';
import { whenProjectSelectReady } from '@/Components/ProjectHub/projectSelectInitialization';
import ProjectSelectView from '@/Components/ProjectHub/ProjectSelectView';

export default function Select() {
    const { url: pageUrl } = usePage();
    const { state, canonicalHref, shouldCanonicalize } =
        parseProjectSelectUrl(getProjectSelectRuntimeUrl(pageUrl));
    const { screen, projectId } = state;

    useEffect(() => {
        if (!shouldCanonicalize) {
            return;
        }

        return whenProjectSelectReady(() => {
            if (screen === 'portfolio-list') {
                // 保存済みの旧Pageからも、新一覧のpropsをサーバーから取り直します。
                router.get(canonicalHref, {}, { replace: true });
            } else {
                router.replace({ url: canonicalHref, preserveState: true });
            }
        });
    }, [canonicalHref, screen, shouldCanonicalize]);

    if (screen === 'portfolio-list') {
        return null;
    }

    const project = getProjectById(projectId);

    if (project?.kind !== 'staged') {
        return null;
    }

    return <ProjectSelectView key={project.id} project={project} />;
}

/** HTTPが受け取らないhashや、正規化前の重複queryを含む実URLを判定します。 */
function getProjectSelectRuntimeUrl(pageUrl: string): string {
    if (typeof window === 'undefined' || window.location.pathname !== '/projects') {
        return pageUrl;
    }

    const { pathname, search, hash } = window.location;

    return `${pathname}${search}${hash}`;
}
