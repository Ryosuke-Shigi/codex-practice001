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
}));

vi.mock('@/Layouts/PublicLayout', () => ({
    default: ({
        children,
        className,
    }: {
        children?: ReactNode;
        className?: string;
    }) => <main className={className}>{children}</main>,
}));

import Index from './Index';

describe('ApiPreview Index', () => {
    it('renders preview target labels in Japanese', () => {
        const markup = renderToStaticMarkup(
            <Index
                apis={[
                    {
                        id: 'apis-guru',
                        name: 'APIs.guru list.json',
                        summary: '公開APIカタログを確認します。',
                        endpoint: 'https://api.apis.guru/v2/list.json',
                        method: 'GET',
                        href: '/api-preview/apis-guru',
                        links: [],
                        status: 'Ready',
                        enabled: true,
                        open_in_new_window: true,
                    },
                    {
                        id: 'github-api',
                        name: 'GitHub API',
                        summary: '準備中の確認枠です。',
                        endpoint: 'https://api.github.com',
                        method: 'GET',
                        href: '/api-preview/github',
                        links: [],
                        status: 'Planned',
                        enabled: false,
                        open_in_new_window: true,
                    },
                ]}
            />,
        );

        expect(markup).toContain('API確認');
        expect(markup).toContain('開発確認');
        expect(markup).toContain('利用可');
        expect(markup).toContain('準備中');
        expect(markup).toContain('>戻る</a>');
        expect(markup).toContain(
            'aria-label="API Discovery Hubの開発段階へ戻る"',
        );
        expect(markup).toContain(
            'title="API Discovery Hubの開発段階へ戻る"',
        );
        expect(markup).not.toContain(
            '>API Discovery Hubの開発段階へ</a>',
        );
        expect(markup).not.toContain('Development Tool');
        expect(markup).not.toContain('Ready');
        expect(markup).not.toContain('Planned');
    });
});
