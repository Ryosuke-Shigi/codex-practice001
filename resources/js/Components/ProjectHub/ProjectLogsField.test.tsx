import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ProjectLogsField, { type ProjectLogsProps } from './ProjectLogsField';

vi.mock('@inertiajs/react', () => ({
    router: {
        post: vi.fn(),
    },
}));

describe('ProjectLogsField', () => {
    it('renders the API tab as a two column log table', () => {
        const markup = renderToStaticMarkup(
            <ProjectLogsField logs={logsFixture('api')} />,
        );

        expect(markup).toContain('API');
        expect(markup).toContain('ERROR');
        expect(markup).toContain('時間');
        expect(markup).toContain('内容');
        expect(markup).toContain('2026-06-18 16:30');
        expect(markup).toContain('[success]');
        expect(markup).toContain('YouTube API / rising candidates');
        expect(markup).not.toContain('DanceShortsRadar集計で例外発生');
    });

    it('renders the ERROR tab with file line and resolve action', () => {
        const markup = renderToStaticMarkup(
            <ProjectLogsField logs={logsFixture('error')} />,
        );

        expect(markup).toContain('2026-06-18 16:35');
        expect(markup).toContain('[error]');
        expect(markup).toContain(
            'DanceShortsRadar集計で例外発生 / app/Services/DanceShortsRadarService.php:128',
        );
        expect(markup).toContain('対応済み');
        expect(markup).not.toContain('YouTube API / rising candidates');
    });
});

function logsFixture(activeTab: 'api' | 'error'): ProjectLogsProps {
    return {
        activeTab,
        tabs: [
            { id: 'api', label: 'API' },
            { id: 'error', label: 'ERROR' },
        ],
        api: {
            rows: [
                {
                    id: 1,
                    occurredAt: '2026-06-18 16:30',
                    content: 'YouTube API / rising candidates',
                    status: 'success',
                },
            ],
            emptyMessage: 'API連携ログはまだありません。',
        },
        error: {
            rows: [
                {
                    id: 2,
                    occurredAt: '2026-06-18 16:35',
                    content:
                        'DanceShortsRadar集計で例外発生 / app/Services/DanceShortsRadarService.php:128',
                    level: 'error',
                    isResolved: false,
                    canResolve: true,
                    resolveUrl: '/application-error-logs/2/resolve',
                },
            ],
            emptyMessage: 'ERRORログはまだありません。',
        },
    };
}
