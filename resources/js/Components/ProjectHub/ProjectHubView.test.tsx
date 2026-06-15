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
});
