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
        get: vi.fn(),
    },
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

import ApisGuru from './ApisGuru';

describe('ApisGuru', () => {
    it('renders the API check result with Japanese labels', () => {
        const markup = renderToStaticMarkup(
            <ApisGuru
                api={{
                    name: 'APIs.guru list.json',
                    endpoint: 'https://api.apis.guru/v2/list.json',
                    method: 'GET',
                }}
                hasFetched
                result={{
                    api_name: 'APIs.guru',
                    endpoint: 'https://api.apis.guru/v2/list.json',
                    method: 'GET',
                    success: true,
                    status_code: 200,
                    fetched_at: '2026-06-19T10:00:00+09:00',
                    total_count: 1,
                    response_time_ms: 123,
                    error_message: null,
                    request_headers: {
                        Accept: 'application/json',
                    },
                    query_parameters: {},
                    items: [
                        {
                            api_key: 'example.com',
                            title: 'Example API',
                            description: 'example',
                            provider_key: 'example.com',
                            service_key: null,
                            preferred_version: 'v1',
                            openapi_json_url: 'https://example.com/openapi.json',
                            openapi_yaml_url: 'https://example.com/openapi.yaml',
                            openapi_version: '3.0.0',
                        },
                    ],
                    raw_payload_preview: '{}',
                }}
            />,
        );

        expect(markup).toContain('API確認');
        expect(markup).toContain('取得結果');
        expect(markup).toContain('成功');
        expect(markup).toContain('取得情報');
        expect(markup).toContain('取得先URL');
        expect(markup).toContain('リクエストヘッダー');
        expect(markup).toContain('取得データ概要');
        expect(markup).not.toContain('HTTP応答');
        expect(markup).not.toContain('元データ抜粋');
        expect(markup).not.toContain('status_code');
        expect(markup).not.toContain('Response Preview');
        expect(markup).not.toContain('Raw Payload Preview');
    });
});
