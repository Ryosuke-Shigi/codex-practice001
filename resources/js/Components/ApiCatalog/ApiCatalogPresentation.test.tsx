import { apiCatalogDescriptionExcerpt } from './apiCatalogDescription';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('@inertiajs/react', () => ({ Link: ({ children, ...props }: { children: ReactNode; href: string }) => <a {...props}>{children}</a> }));
import ApiCatalogDetailBody from './ApiCatalogDetailBody';
import ApiCatalogCard from './ApiCatalogCard';
import ApiCatalogSyncNotice from './ApiCatalogSyncNotice';
import { apiCatalogSyncStatusMessage } from '@/Pages/ApiCatalog/apiCatalogIndexUtils';
import type { ApiCatalogSyncStatus } from '@/Pages/ApiCatalog/types';

it('preserves provider warnings and only links supplied http specs before notes', () => {
    const original = 'Deprecated. Use [Successor](https://example.com/new).';
    const html = renderToStaticMarkup(<ApiCatalogDetailBody title="Example" description={original} notesPanel={<div>NOTE-MARKER</div>}
        technicalRows={[['preferredVersion', 'v3'], ['openapiVersion', '3.1.0'], ['openapiJsonUrl', 'https://example.com/spec.json'], ['openapiYamlUrl', null], ['apiKey', 'javascript:alert(1)']]} />);
    expect(html).toContain(original); expect(html).toContain('仕様書 JSONを開く');
    expect(html).toContain('href="https://example.com/spec.json"');
    expect(html).not.toContain('仕様書 YAMLを開く'); expect(html).not.toContain('href="javascript:');
    expect(html.indexOf('版・仕様書')).toBeLessThan(html.indexOf('NOTE-MARKER'));
    const unsafe = renderToStaticMarkup(<ApiCatalogDetailBody title="Example" description={null} notesPanel={null}
        technicalRows={[['openapiJsonUrl', 'javascript:alert(1)'], ['openapiYamlUrl', 'data:text/html,test']]} />);
    expect(unsafe).not.toContain('<a ');
});
it('shows names, service, purpose and labelled versions, keeps two note excerpts and all four external searches', () => {
    const html = renderToStaticMarkup(<ApiCatalogCard index={0} item={{
        title: 'Payment', providerKey: 'adyen.com', serviceKey: 'payments', preferredVersion: 'v3', openapiVersion: '3.1.0',
        description: 'Use [accounting webhooks](https://example.com/long-url).', detailHref: '/api-catalog/payment',
        notes: [1, 2, 3].map(id => ({ id, title: null, body: 'memo-' + id, createdAt: null, updatedAt: null })),
    }} />);
    expect(html).toContain('API版: v3 / OpenAPI版: 3.1.0');
    expect(html).toContain('Use accounting webhooks.'); expect(html).not.toContain('long-url');
    expect(html).toContain('memo-1'); expect(html).toContain('memo-2'); expect(html).not.toContain('memo-3');
    expect(html).toContain('+1件'); expect((html.match(/target="_blank"/g) ?? []).length).toBe(4);
});
const status: ApiCatalogSyncStatus = { id: 1, status: 'completed', isRunning: false, isStale: false,
    result: { totalCount: 4, insertedCount: 1, updatedCount: 2, skippedCount: 1, inactiveCount: 0, failedCount: 0 },
    errorMessage: null, startedAt: null, finishedAt: null, createdAt: null, updatedAt: null };
it('distinguishes all eight import states and keeps the normal completion breakdown collapsed', () => {
    const messages = [
        apiCatalogSyncStatusMessage(null, false, null),
        apiCatalogSyncStatusMessage(null, true, null),
        ...(['queued', 'running', 'completed', 'failed'] as const).map(state => apiCatalogSyncStatusMessage({ ...status, status: state }, false, null)),
        apiCatalogSyncStatusMessage({ ...status, isStale: true }, false, null),
        apiCatalogSyncStatusMessage(status, false, '同期状態の取得に失敗しました'),
    ];
    expect(new Set(messages).size).toBe(8);
    expect(renderToStaticMarkup(<ApiCatalogSyncNotice message={null} status={null} showResult={false} />)).toBe('');
    const html = renderToStaticMarkup(<ApiCatalogSyncNotice message={messages[4]} status={status} showResult />);
    expect(html).toContain('aria-live="polite"'); expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('hidden=""'); expect(html).not.toContain('<form');
    expect(html).toContain('新規: 1件'); expect(html).toContain('更新: 2件');
});

it('preserves language names, successor identifiers, and a URL-only description', () => {
    expect(apiCatalogDescriptionExcerpt('Deprecated: use payments_v2 for C# clients.')).toBe('Deprecated: use payments_v2 for C# clients.');
    expect(apiCatalogDescriptionExcerpt('https://example.com/docs')).toBe('https://example.com/docs');
});
