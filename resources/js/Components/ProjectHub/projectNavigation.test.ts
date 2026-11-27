import { describe, expect, it } from 'vitest';

import { parseProjectSelectUrl } from './projectNavigation';

describe('Project Select URL contract', () => {
    it.each([
        ['/projects', null],
        ['/projects?project=api-discovery-hub', 'api-discovery-hub'],
        ['/projects?project=dance-shorts-radar', 'dance-shorts-radar'],
        ['/projects?project=dance-shorts-analyzer', 'dance-shorts-analyzer'],
        ['/projects?project=japan-quake-wave-map', 'japan-quake-wave-map'],
        ['/projects?project=lumilab', 'lumilab'],
        ['/projects?project=construction-order', 'construction-order'],
        ['/projects?project=event-card-calendar', 'event-card-calendar'],
        ['/projects?project=logs', 'logs'],
    ])('routes %s to the Portfolio list', (url, projectId) => {
        expect(parseProjectSelectUrl(url)).toEqual({
            state: { screen: 'portfolio-list', projectId },
            canonicalHref: projectId === null
                ? '/portfolio/links-launcher'
                : '/portfolio/links-launcher?project=' + projectId,
            shouldCanonicalize: true,
        });
    });

    it.each([
        '/projects?project=unknown',
        '/projects?project=api-discovery-hub&project=lumilab',
        '/projects?project=lumilab&view=stages&view=stages',
        '/projects?project=lumilab&view=modules',
        '/projects?view=stages',
        '/projects?project=lumilab&tab=stages',
        '/projects?project=lumilab#stage',
        '/projects?project=lumilab&view=stages#stage',
        '/projects?project=logs&view=stages',
        '/projects?project[]=lumilab',
        '/projects/unknown?project=lumilab',
    ])('rejects %s and falls back to the unselected Portfolio list', (url) => {
        expect(parseProjectSelectUrl(url)).toEqual({
            state: { screen: 'portfolio-list', projectId: null },
            canonicalHref: '/portfolio/links-launcher',
            shouldCanonicalize: true,
        });
    });

    it.each([
        ['/projects?project=lumilab&view=stages', false],
        ['/projects?view=stages&project=lumilab', true],
    ])('keeps the stage selection for %s', (url, shouldCanonicalize) => {
        expect(parseProjectSelectUrl(url)).toEqual({
            state: { screen: 'stage-select', projectId: 'lumilab' },
            canonicalHref: '/projects?project=lumilab&view=stages',
            shouldCanonicalize,
        });
    });
});
