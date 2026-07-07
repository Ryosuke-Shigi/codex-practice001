import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LumiLaboMockScreen } from './types';

async function renderMockViewMarkup(
    activeScreen?: LumiLaboMockScreen,
): Promise<string> {
    vi.resetModules();
    vi.doUnmock('react');

    if (activeScreen) {
        let stateCall = 0;

        vi.doMock('react', async () => {
            const actual = await vi.importActual<typeof import('react')>(
                'react',
            );

            return {
                ...actual,
                useState: vi.fn((initialValue: unknown) => {
                    stateCall += 1;

                    if (stateCall === 1) {
                        return [activeScreen, vi.fn()];
                    }

                    return [initialValue, vi.fn()];
                }),
            };
        });
    }

    const { default: LumiLaboProjectMockView } = await import(
        './LumiLaboProjectMockView'
    );

    return renderToStaticMarkup(<LumiLaboProjectMockView />);
}

afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
});

describe('LumiLaboProjectMockView', () => {
    it('renders the TOP screen with only TOP / selection tags, icon, title, and Start', async () => {
        const markup = await renderMockViewMarkup();

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

    it('renders project and TOP return actions on the selection screen', async () => {
        const markup = await renderMockViewMarkup('select');

        expect(markup).toContain('案件');
        expect(markup).toContain('TOPへ戻る');
        expect(markup.indexOf('案件')).toBeLessThan(
            markup.indexOf('TOPへ戻る'),
        );
        expect(markup).not.toContain('IDEA BOARD');
        expect(markup).not.toContain('進行中');
        expect(markup).not.toContain('完了');
    });

    it('keeps the project TOP selection return distinct from TOP return', async () => {
        const markup = await renderMockViewMarkup('project');

        expect(markup).toContain('案件');
        expect(markup).toContain('TOP');
        expect(markup).toContain('登録');
        expect(markup).toContain('一覧');
        expect(markup).toContain('選択へ戻る');
        expect(markup).not.toContain('TOPへ戻る');
        expect(markup).toContain('orientation:landscape');
    });

    it('does not render form, table, backend, or sample metric surfaces', async () => {
        const markup = await renderMockViewMarkup();

        expect(markup).not.toContain('<form');
        expect(markup).not.toContain('<input');
        expect(markup).not.toContain('<textarea');
        expect(markup).not.toContain('<table');
        expect(markup).not.toContain('Controller');
        expect(markup).not.toContain('Service');
        expect(markup).not.toContain('Repository');
    });
});
