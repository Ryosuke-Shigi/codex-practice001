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

vi.mock('jquery', () => ({
    default: () => ({
        ripples: vi.fn(),
    }),
}));

vi.mock('jquery.ripples', () => ({}));

import Welcome from '@/Pages/Welcome';

describe('Welcome entrypoint', () => {
    it('uses Project Select as the START entrypoint', () => {
        const markup = renderToStaticMarkup(<Welcome />);

        expect(markup).toContain('href="/projects"');
        expect(markup).toContain('href="/design-philosophy"');
        expect(markup).not.toContain('href="/lab"');
    });
});
