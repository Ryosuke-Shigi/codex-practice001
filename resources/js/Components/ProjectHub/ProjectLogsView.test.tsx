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

import ProjectLogsView from './ProjectLogsView';

describe('ProjectLogsView', () => {
    it('keeps application logs on their dedicated page without stage cards', () => {
        const markup = renderToStaticMarkup(
            <ProjectLogsView
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
        expect(markup).toContain('href="/projects"');
        expect(markup).toContain('aria-label="PROJECT選択へ戻る"');
        expect(markup).toContain('title="PROJECT選択へ戻る"');
        expect(markup).toContain(
            'href="/projects" class="project-nav-link" aria-label="PROJECT選択へ戻る" title="PROJECT選択へ戻る"><svg',
        );
        expect(markup).toContain(
            'href="/" class="project-nav-link project-nav-link--quiet" aria-label="Portfolioへ戻る" title="Portfolioへ戻る">戻る</a>',
        );
        expect(markup).not.toContain('Project Hub');
        expect(markup).not.toContain('IDEA BOARD');
        expect(markup).not.toContain('PRODUCT');
        expect(markup).not.toContain('MOCK');
    });
});
