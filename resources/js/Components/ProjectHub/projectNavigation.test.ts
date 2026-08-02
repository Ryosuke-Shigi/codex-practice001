import { describe, expect, it } from 'vitest';

import {
    buildProjectSelectHref,
    parseProjectSelectUrl,
    type ParsedProjectSelectUrl,
} from './projectNavigation';

type ParseCase = {
    name: string;
    url: string;
    expected: ParsedProjectSelectUrl;
};

const parseCases: ParseCase[] = [
    {
        name: 'base Project Select URL',
        url: '/projects',
        expected: {
            state: { screen: 'project-select', projectId: null },
            canonicalHref: '/projects',
            shouldCanonicalize: false,
        },
    },
    {
        name: 'valid selected project URL',
        url: '/projects?project=dance-shorts-radar',
        expected: {
            state: {
                screen: 'project-select',
                projectId: 'dance-shorts-radar',
            },
            canonicalHref: '/projects?project=dance-shorts-radar',
            shouldCanonicalize: false,
        },
    },
    {
        name: 'valid staged project URL',
        url: '/projects?project=api-discovery-hub&view=stages',
        expected: {
            state: {
                screen: 'stage-select',
                projectId: 'api-discovery-hub',
            },
            canonicalHref:
                '/projects?project=api-discovery-hub&view=stages',
            shouldCanonicalize: false,
        },
    },
    {
        name: 'unknown project',
        url: '/projects?project=unknown',
        expected: invalidUrl(),
    },
    {
        name: 'duplicate project',
        url: '/projects?project=api-discovery-hub&project=lumilabo',
        expected: invalidUrl(),
    },
    {
        name: 'duplicate view',
        url: '/projects?project=lumilabo&view=stages&view=stages',
        expected: invalidUrl(),
    },
    {
        name: 'invalid view',
        url: '/projects?project=lumilabo&view=modules',
        expected: invalidUrl(),
    },
    {
        name: 'view without project',
        url: '/projects?view=stages',
        expected: invalidUrl(),
    },
    {
        name: 'unknown query key',
        url: '/projects?project=lumilabo&tab=stages',
        expected: invalidUrl(),
    },
    {
        name: 'non-canonical valid query order',
        url: '/projects?view=stages&project=lumilabo',
        expected: {
            state: { screen: 'stage-select', projectId: 'lumilabo' },
            canonicalHref: '/projects?project=lumilabo&view=stages',
            shouldCanonicalize: true,
        },
    },
];

describe('Project Select URL contract', () => {
    it.each(parseCases)('parses $name', ({ url, expected }) => {
        expect(parseProjectSelectUrl(url)).toEqual(expected);
    });

    it.each([
        {
            name: 'base URL',
            projectId: null,
            view: 'project' as const,
            expected: '/projects',
        },
        {
            name: 'selected project URL',
            projectId: 'dance-shorts-analyzer' as const,
            view: 'project' as const,
            expected: '/projects?project=dance-shorts-analyzer',
        },
        {
            name: 'staged project URL in canonical query order',
            projectId: 'event-card-calendar' as const,
            view: 'stages' as const,
            expected:
                '/projects?project=event-card-calendar&view=stages',
        },
    ])('builds $name', ({ projectId, view, expected }) => {
        expect(buildProjectSelectHref(projectId, view)).toBe(expected);
    });
});

function invalidUrl(): ParsedProjectSelectUrl {
    return {
        state: { screen: 'project-select', projectId: null },
        canonicalHref: '/projects',
        shouldCanonicalize: true,
    };
}
