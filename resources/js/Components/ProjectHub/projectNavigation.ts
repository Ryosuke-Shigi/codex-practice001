import {
    getProjectById,
    getProjectStageSelectHref,
    isProjectId,
    isStageProjectId,
    type ProjectId,
    type StageProjectId,
} from './projectData';

type ProjectSelectUrlState =
    | {
          screen: 'portfolio-list';
          projectId: ProjectId | null;
      }
    | {
          screen: 'stage-select';
          projectId: StageProjectId;
      };

type ParsedProjectSelectUrl = {
    state: ProjectSelectUrlState;
    canonicalHref: string;
    shouldCanonicalize: boolean;
};

const projectSelectPath = '/projects';
const portfolioProjectListPath = '/portfolio/links-launcher';
const allowedQueryKeys = new Set(['project', 'view']);

/** 旧URLを段階画面または新作品一覧へ振り分けます。不正な指定では作品を選択しません。 */
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
        return portfolioListUrl();
    }

    const projectId = projectValues[0];
    const view = viewValues[0];

    if (projectId === undefined || !isProjectId(projectId)) {
        return portfolioListUrl();
    }

    if (view === undefined) {
        return portfolioListUrl(projectId);
    }

    if (view !== 'stages' || !isStageProjectId(projectId)) {
        return portfolioListUrl();
    }

    const canonicalHref = getProjectStageSelectHref(projectId);

    return {
        state: { screen: 'stage-select', projectId },
        canonicalHref,
        shouldCanonicalize:
            `${parsedUrl.pathname}${parsedUrl.search}` !== canonicalHref,
    };
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

export function buildPortfolioProjectListHref(projectId: ProjectId | null = null): string {
    return projectId === null
        ? portfolioProjectListPath
        : `${portfolioProjectListPath}?project=${projectId}`;
}

function portfolioListUrl(projectId: ProjectId | null = null): ParsedProjectSelectUrl {
    return {
        state: { screen: 'portfolio-list', projectId },
        canonicalHref: buildPortfolioProjectListHref(projectId),
        shouldCanonicalize: true,
    };
}
