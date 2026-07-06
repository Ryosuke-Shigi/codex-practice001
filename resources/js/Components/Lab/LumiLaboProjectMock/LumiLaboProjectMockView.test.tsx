import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LumiLaboProjectMockView from './LumiLaboProjectMockView';

describe('LumiLaboProjectMockView', () => {
    it('renders the TOP screen with only TOP / selection tags, icon, title, and Start', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectMockView />);

        expect(markup).toContain('TOP');
        expect(markup).toContain('選択');
        expect(markup).toContain('LumiLabo');
        expect(markup).toContain('Start');
        expect(markup).toContain('rounded-t-md');
        expect(markup).toContain('border-b-0');
        expect(markup).toContain('overflow-x-auto');
        expect(markup).not.toContain('案件');
        expect(markup).not.toContain('IDEA BOARD');
        expect(markup).not.toContain('案件選択');
        expect(markup).not.toContain('進行中');
        expect(markup).not.toContain('完了');
    });

    it('does not render form, table, backend, or sample metric surfaces', () => {
        const markup = renderToStaticMarkup(<LumiLaboProjectMockView />);

        expect(markup).not.toContain('<form');
        expect(markup).not.toContain('<input');
        expect(markup).not.toContain('<textarea');
        expect(markup).not.toContain('<table');
        expect(markup).not.toContain('Controller');
        expect(markup).not.toContain('Service');
        expect(markup).not.toContain('Repository');
    });
});
