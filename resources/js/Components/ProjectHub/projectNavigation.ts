import {
    getProjectById,
    getProjectStageSelectHref,
    isProjectId,
    isStageProjectId,
    type ProjectId,
    type StageProjectId,
} from './projectData';

export type ProjectSelectUrlState =
    | {
          screen: 'project-select';
          projectId: ProjectId | null;
      }
    | {
          screen: 'stage-select';
          projectId: StageProjectId;
      };

export type ParsedProjectSelectUrl = {
    state: ProjectSelectUrlState;
    canonicalHref: string;
    shouldCanonicalize: boolean;
};

const projectSelectPath = '/projects';
const allowedQueryKeys = new Set(['project', 'view']);

/**
 * 呼び出し元から渡された URL だけを入力に、Project Select の復元状態を決めます。
 * parser 自身は DOM やブラウザ履歴へ依存せず、direct access と画面内遷移で同じ規則を使えます。
 */
export function parseProjectSelectUrl(url: string): ParsedProjectSelectUrl {
    const parsedUrl = new URL(url, 'https://project-select.local');
    const projectValues = parsedUrl.searchParams.getAll('project');
    const viewValues = parsedUrl.searchParams.getAll('view');
    const hasUnknownQuery = Array.from(parsedUrl.searchParams.keys()).some(
        (key) => !allowedQueryKeys.has(key),
    );

    if (
        parsedUrl.pathname !== projectSelectPath ||
        parsedUrl.hash !== '' ||
        hasUnknownQuery ||
        projectValues.length > 1 ||
        viewValues.length > 1
    ) {
        return invalidProjectSelectUrl();
    }

    const projectId = projectValues[0];
    const view = viewValues[0];

    if (projectId === undefined && view === undefined) {
        return {
            state: { screen: 'project-select', projectId: null },
            canonicalHref: projectSelectPath,
            shouldCanonicalize: parsedUrl.search !== '',
        };
    }

    if (
        projectId === undefined ||
        !isProjectId(projectId) ||
        (view !== undefined && view !== 'stages')
    ) {
        return invalidProjectSelectUrl();
    }

    if (view === 'stages') {
        if (!isStageProjectId(projectId)) {
            return invalidProjectSelectUrl();
        }

        const canonicalHref = buildProjectSelectHref(projectId, 'stages');

        return {
            state: { screen: 'stage-select', projectId },
            canonicalHref,
            shouldCanonicalize:
                `${parsedUrl.pathname}${parsedUrl.search}` !== canonicalHref,
        };
    }

    const canonicalHref = buildProjectSelectHref(projectId, 'project');

    return {
        state: { screen: 'project-select', projectId },
        canonicalHref,
        shouldCanonicalize:
            `${parsedUrl.pathname}${parsedUrl.search}` !== canonicalHref,
    };
}

export function buildProjectSelectHref(
    projectId?: ProjectId | null,
    view: 'project' | 'stages' = 'project',
): string {
    if (projectId === undefined || projectId === null) {
        return projectSelectPath;
    }

    if (view === 'stages') {
        return getProjectStageSelectHref(projectId);
    }

    return `${projectSelectPath}?project=${projectId}`;
}

export function getStageProjectReturnLink(projectId: StageProjectId): {
    href: string;
    label: string;
    ariaLabel: string;
    title: string;
} {
    const project = getProjectById(projectId);

    if (project === null || project.kind !== 'staged') {
        throw new Error(`Stage Project が見つかりません: ${projectId}`);
    }

    const destinationLabel = `${project.name}の開発段階へ戻る`;

    return {
        href: getProjectStageSelectHref(projectId),
        label: '戻る',
        ariaLabel: destinationLabel,
        title: destinationLabel,
    };
}

function invalidProjectSelectUrl(): ParsedProjectSelectUrl {
    return {
        state: { screen: 'project-select', projectId: null },
        canonicalHref: projectSelectPath,
        shouldCanonicalize: true,
    };
}
