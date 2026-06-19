import {
    Children,
    isValidElement,
    type ReactElement,
    type ReactNode,
} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import ProjectLogsField, {
    ApiLogTableRow,
    ErrorLogDetailModal,
    ErrorLogTableRow,
    canSubmitErrorLogResolve,
    postErrorLogResolve,
    type ApiLogRow,
    type ErrorLogRow,
    type ProjectLogsProps,
} from './ProjectLogsField';

const routerPost = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', () => ({
    router: {
        post: routerPost,
    },
}));

describe('ProjectLogsField', () => {
    it('renders the API tab as a two column log table without resolve modal', () => {
        const markup = renderToStaticMarkup(
            <ProjectLogsField logs={logsFixture('api')} />,
        );

        expect(markup).toContain('API連携');
        expect(markup).toContain('エラー');
        expect(markup).toContain('時間');
        expect(markup).toContain('内容');
        expect(markup).toContain('2026-06-18 16:30');
        expect(markup).toContain('[成功]');
        expect(markup).toContain('YouTube API / rising candidates');
        expect(markup).not.toContain('role="dialog"');
        expect(markup).not.toContain('対応済みにする');
        expect(markup).not.toContain('DanceShortsRadar集計で例外発生');
    });

    it('renders the ERROR tab as clickable rows while keeping file line in the two column table', () => {
        const markup = renderToStaticMarkup(
            <ProjectLogsField logs={logsFixture('error')} />,
        );

        expect(markup).toContain('時間');
        expect(markup).toContain('内容');
        expect(markup).toContain('role="button"');
        expect(markup).toContain('エラーログ詳細を開く 2026-06-18 16:35');
        expect(markup).toContain('2026-06-18 16:35');
        expect(markup).toContain('[エラー]');
        expect(markup).toContain(
            'DanceShortsRadar集計で例外発生 / app/Services/DanceShortsRadarService.php:128',
        );
        expect(markup).not.toContain('対応済みにする');
        expect(markup).not.toContain('YouTube API / rising candidates');
    });

    it('opens the ERROR detail target from an ERROR row click handler', () => {
        const row = errorRowFixture();
        const onSelect = vi.fn();
        const element = ErrorLogTableRow({
            row,
            onSelect,
        }) as ReactElement<{
            onClick: () => void;
            role: string;
        }>;

        expect(element.props.role).toBe('button');

        element.props.onClick();

        expect(onSelect).toHaveBeenCalledWith(row);
    });

    it('keeps API rows free of modal click behavior', () => {
        const element = ApiLogTableRow({
            row: apiRowFixture(),
        }) as ReactElement<{
            onClick?: () => void;
            role?: string;
        }>;

        expect(element.props.role).toBeUndefined();
        expect(element.props.onClick).toBeUndefined();
    });

    it('renders the ERROR detail modal with confirmation disabled until the keyword matches', () => {
        const markup = renderToStaticMarkup(
            <ErrorLogDetailModal
                row={errorRowFixture()}
                confirmation="wrong"
                resolveConfirmationKeyword="resolve"
                resolvingErrorLogId={null}
                onConfirmationChange={vi.fn()}
                onClose={vi.fn()}
                onResolve={vi.fn()}
            />,
        );

        expect(markup).toContain('role="dialog"');
        expect(markup).toContain('2026-06-18 16:35');
        expect(markup).toContain(
            'DanceShortsRadar集計で例外発生 / app/Services/DanceShortsRadarService.php:128',
        );
        expect(markup).toContain('[エラー]');
        expect(markup).toContain('app/Services/DanceShortsRadarService.php:128');
        expect(markup).toContain('未対応');
        expect(markup).toContain('確認入力');
        expect(markup).toContain('disabled=""');
    });

    it('allows resolve only with the configured confirmation keyword', () => {
        const row = errorRowFixture();

        expect(canSubmitErrorLogResolve(row, '', 'resolve', null)).toBe(false);
        expect(canSubmitErrorLogResolve(row, 'wrong', 'resolve', null)).toBe(
            false,
        );
        expect(canSubmitErrorLogResolve(row, 'resolve', 'resolve', null)).toBe(
            true,
        );
        expect(
            canSubmitErrorLogResolve(
                { ...row, isResolved: true, canResolve: false },
                'resolve',
                'resolve',
                null,
            ),
        ).toBe(false);
    });

    it('posts resolve confirmation in the request body', () => {
        const row = errorRowFixture();

        routerPost.mockClear();
        postErrorLogResolve(row, 'resolve');

        expect(routerPost).toHaveBeenCalledWith(
            '/application-error-logs/2/resolve',
            { confirmation: 'resolve' },
            expect.objectContaining({
                preserveScroll: true,
            }),
        );
    });

    it('calls close handler from the modal close button', () => {
        const onClose = vi.fn();
        const modal = ErrorLogDetailModal({
            row: errorRowFixture(),
            confirmation: 'resolve',
            resolveConfirmationKeyword: 'resolve',
            resolvingErrorLogId: null,
            onConfirmationChange: vi.fn(),
            onClose,
            onResolve: vi.fn(),
        });
        const closeButton = findElement(modal, (element) => {
            const props = element.props as Record<string, unknown>;

            return props['aria-label'] === '閉じる';
        });

        expect(closeButton).not.toBeNull();

        const closeProps = closeButton?.props as { onClick: () => void };
        closeProps.onClick();

        expect(onClose).toHaveBeenCalledOnce();
    });
});

function findElement(
    node: ReactNode,
    predicate: (element: ReactElement) => boolean,
): ReactElement | null {
    if (!isValidElement(node)) {
        return null;
    }

    if (predicate(node)) {
        return node;
    }

    const props = node.props as { children?: ReactNode };
    const children = Children.toArray(props.children);

    for (const child of children) {
        const found = findElement(child, predicate);

        if (found !== null) {
            return found;
        }
    }

    return null;
}

function logsFixture(activeTab: 'api' | 'error'): ProjectLogsProps {
    return {
        activeTab,
        resolveConfirmationKeyword: 'resolve',
        tabs: [
            { id: 'api', label: 'API連携' },
            { id: 'error', label: 'エラー' },
        ],
        api: {
            rows: [apiRowFixture()],
            emptyMessage: 'API連携ログはまだありません。',
        },
        error: {
            rows: [errorRowFixture()],
            emptyMessage: 'エラーログはまだありません。',
        },
    };
}

function apiRowFixture(): ApiLogRow {
    return {
        id: 1,
        occurredAt: '2026-06-18 16:30',
        content: 'YouTube API / rising candidates',
        status: 'success',
    };
}

function errorRowFixture(): ErrorLogRow {
    return {
        id: 2,
        occurredAt: '2026-06-18 16:35',
        content:
            'DanceShortsRadar集計で例外発生 / app/Services/DanceShortsRadarService.php:128',
        level: 'error',
        location: 'app/Services/DanceShortsRadarService.php:128',
        isResolved: false,
        canResolve: true,
        resolveUrl: '/application-error-logs/2/resolve',
    };
}
