import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/Components/Effects/EffectLayer', () => ({
    default: () => <div data-effect-layer="true" />,
    defaultEffectName: 'water',
    readPreferredEffectName: () => null,
    resolveEffectName: () => 'water',
}));

import PublicLayout from '@/Layouts/PublicLayout';

function renderLayout(props: { children: ReactNode; withEffect?: boolean }) {
    return renderToStaticMarkup(<PublicLayout {...props} />);
}

describe('PublicLayout', () => {
    it('renders the shared effect by default', () => {
        const markup = renderLayout({ children: <p>Page content</p> });

        expect(markup).toContain('data-effect-layer="true"');
        expect(markup).toContain('Page content');
    });

    it('allows a page to opt out of the shared effect', () => {
        const markup = renderLayout({
            children: <p>Page content</p>,
            withEffect: false,
        });

        expect(markup).not.toContain('data-effect-layer="true"');
        expect(markup).toContain('Page content');
    });
});
