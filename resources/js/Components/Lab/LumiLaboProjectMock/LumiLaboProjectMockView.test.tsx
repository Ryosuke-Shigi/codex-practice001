import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LumiLaboMockProjectTabId, LumiLaboMockScreen } from './types';

async function renderMockViewMarkup(
    activeScreen?: LumiLaboMockScreen,
    activeProjectTabId?: LumiLaboMockProjectTabId,
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

                    if (stateCall === 2 && activeProjectTabId) {
                        return [activeProjectTabId, vi.fn()];
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
        expect(markup).not.toContain('会社名');
        expect(markup).not.toContain('担当者名');
        expect(markup).not.toContain('住所');
        expect(markup).not.toContain('メモ');
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

    it('renders the project TOP actions as register, list, and a back button', async () => {
        const markup = await renderMockViewMarkup('project');

        expect(markup).toContain('案件');
        expect(markup).toContain('TOP');
        expect(markup).toContain('登録');
        expect(markup).toContain('一覧');
        expect(markup).toContain('戻る');
        expect(markup.indexOf('登録')).toBeLessThan(markup.indexOf('一覧'));
        expect(markup.indexOf('一覧')).toBeLessThan(markup.indexOf('戻る'));
        expect(markup).toContain('lucide-arrow-left');
        expect(markup).not.toContain('選択へ戻る');
        expect(markup).not.toContain('TOPへ戻る');
        expect(markup).toContain('orientation:landscape');
    });

    it('renders the project register mock fields on the register tab', async () => {
        const markup = await renderMockViewMarkup('project', 'register');

        expect(markup).toContain('案件登録');
        expect(markup).toContain('会社名');
        expect(markup).toContain('担当者名');
        expect(markup).toContain('住所');
        expect(markup).toContain('メモ');
        expect(markup).toContain('登録する');
        expect(markup).toContain('戻る');
        expect(markup.indexOf('登録する')).toBeLessThan(markup.indexOf('戻る'));
        expect(markup).toContain('<input');
        expect(markup).toContain('<textarea');
        expect(markup).not.toContain('<form');
    });

    it('renders the project list placeholder and back button on the list tab', async () => {
        const markup = await renderMockViewMarkup('project', 'list');

        expect(markup).toContain('案件一覧');
        expect(markup).toContain('戻る');
        expect(markup).toContain('lucide-list');
        expect(markup).not.toContain('登録する');
        expect(markup).not.toContain('lucide-layers-3');
        expect(markup).not.toMatch(/<h1[^>]*>案件<\/h1>/);
    });

    it('keeps excluded project register fields out of the register tab', async () => {
        const markup = await renderMockViewMarkup('project', 'register');

        expect(markup).not.toContain('ステータス');
        expect(markup).not.toContain('案件名');
        expect(markup).not.toContain('郵便番号');
        expect(markup).not.toContain('都道府県');
        expect(markup).not.toContain('市区町村');
        expect(markup).not.toContain('工程');
        expect(markup).not.toContain('カレンダー');
        expect(markup).not.toContain('Controller');
        expect(markup).not.toContain('Service');
        expect(markup).not.toContain('Repository');
    });

    it('does not render form, table, backend, or sample metric surfaces on TOP', async () => {
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
