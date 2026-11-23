// @vitest-environment jsdom

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
    it('opens the portfolio LinksLauncher from START and keeps the other entrypoints', () => {
        const markup = renderToStaticMarkup(<Welcome />);
        const container = document.createElement('div');
        container.innerHTML = markup;
        const links = Array.from(container.querySelectorAll('a'));

        expect(links.map((link) => [link.textContent?.trim(), link.getAttribute('href')])).toEqual([
            ['START', '/portfolio/links-launcher'],
            ['設計思想', '/design-philosophy'],
        ]);
        expect(markup).not.toContain('href="/lab"');
    });
});
