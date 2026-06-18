import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title?: string }) =>
        title === undefined ? null : <title>{title}</title>,
    Link: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children?: ReactNode;
        [key: string]: unknown;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: {
        post: vi.fn(),
    },
}));

import ProjectHubView from './ProjectHubView';

describe('ProjectHubView', () => {
    it('renders construction order idea board and mock entries without prototype stage', () => {
        const markup = renderToStaticMarkup(
            <ProjectHubView projectId="construction-order" />,
        );

        expect(markup).toContain('工事発注管理');
        expect(markup).toContain('IDEA BOARD');
        expect(markup).toContain('MOCK');
        expect(markup).toContain(
            'href="/lab/construction-order-workflow-idea-board"',
        );
        expect(markup).toContain(
            'href="/lab/construction-order-workflow-mock"',
        );
        expect(markup).toContain('href="/projects"');
        expect(markup).not.toContain('PROTOTYPE');
        expect(markup).not.toContain('href="/lab"');
        expect(markup).not.toContain('construction-order-new-mock');
    });

    it('renders logs project with API and ERROR tabs instead of stage cards', () => {
        const markup = renderToStaticMarkup(
            <ProjectHubView
                projectId="logs"
                applicationLogs={{
                    activeTab: 'api',
                    resolveConfirmationKeyword: 'resolve',
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
                        rows: [],
                        emptyMessage: 'ERRORログはまだありません。',
                    },
                }}
            />,
        );

        expect(markup).toContain('logs');
        expect(markup).toContain('API');
        expect(markup).toContain('ERROR');
        expect(markup).toContain('時間');
        expect(markup).toContain('内容');
        expect(markup).toContain('[success]');
        expect(markup).not.toContain('IDEA BOARD');
        expect(markup).not.toContain('PRODUCT');
    });
});
