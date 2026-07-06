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

    it('renders LumiLabo project system mock and idea board entries', () => {
        const markup = renderToStaticMarkup(
            <ProjectHubView projectId="lumilabo" />,
        );

        expect(markup).toContain('LumiLabo');
        expect(markup).toContain('上位プロダクト');
        expect(markup).toContain('案件システム');
        expect(markup).toContain('MOCK');
        expect(markup).toContain('開始UI');
        expect(markup).toContain('href="/lab/lumilabo-project-mock"');
        expect(markup).toContain('お客様向けの機能説明資料');
        expect(markup).toContain('概要');
        expect(markup).toContain('フロー');
        expect(markup).toContain('図解');
        expect(markup).toContain('グラフ');
        expect(markup).toContain('code');
        expect(markup).toContain('href="/lab/lumilabo-project-idea-board"');
        expect(markup).not.toContain('5タブ');
        expect(markup).not.toContain('Coding');
        expect(markup).not.toContain('PRODUCT');
    });

    it('renders logs project with API and error tabs instead of stage cards', () => {
        const markup = renderToStaticMarkup(
            <ProjectHubView
                projectId="logs"
                applicationLogs={{
                    activeTab: 'api',
                    resolveConfirmationKeyword: 'resolve',
                    tabs: [
                        { id: 'api', label: 'API連携' },
                        { id: 'error', label: 'エラー' },
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
                        emptyMessage: 'エラーログはまだありません。',
                    },
                }}
            />,
        );

        expect(markup).toContain('アプリログ');
        expect(markup).toContain('API連携');
        expect(markup).toContain('エラー');
        expect(markup).toContain('時間');
        expect(markup).toContain('内容');
        expect(markup).toContain('[成功]');
        expect(markup).not.toContain('IDEA BOARD');
        expect(markup).not.toContain('PRODUCT');
    });
});
