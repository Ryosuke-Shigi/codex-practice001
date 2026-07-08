import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { lumiLaboProjectDetail } from './mockData';
import type {
    LumiLaboMockProjectDetail,
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectDetailReturnTarget,
    LumiLaboMockProjectTabId,
    LumiLaboMockProjectViewId,
    LumiLaboMockScreen,
} from './types';

type RenderMockViewOptions = {
    activeProjectViewId?: LumiLaboMockProjectViewId;
    projectDetail?: LumiLaboMockProjectDetail | null;
    detailDraft?: LumiLaboMockProjectDetailDraft;
    projectDetailReturnTarget?: LumiLaboMockProjectDetailReturnTarget;
    isSaving?: boolean;
    saveMessageVisible?: boolean;
    droppedFileNames?: readonly string[];
    isDeleteDialogOpen?: boolean;
};

async function renderMockViewMarkup(
    activeScreen?: LumiLaboMockScreen,
    activeProjectTabId?: LumiLaboMockProjectTabId,
    options: RenderMockViewOptions = {},
): Promise<string> {
    vi.resetModules();
    vi.doUnmock('react');

    if (activeScreen) {
        let stateCall = 0;
        const projectDetail =
            options.projectDetail === undefined
                ? lumiLaboProjectDetail
                : options.projectDetail;
        const detailDraft =
            options.detailDraft ??
            createProjectDetailDraft(projectDetail ?? lumiLaboProjectDetail);
        const activeProjectViewId =
            options.activeProjectViewId ?? activeProjectTabId ?? 'top';

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

                    if (stateCall === 2) {
                        return [activeProjectTabId ?? 'top', vi.fn()];
                    }

                    if (stateCall === 3) {
                        return [activeProjectViewId, vi.fn()];
                    }

                    if (stateCall === 4) {
                        return [
                            options.projectDetailReturnTarget ?? {
                                projectTabId: 'list',
                                projectViewId: 'list',
                            },
                            vi.fn(),
                        ];
                    }

                    if (stateCall === 5) {
                        return [projectDetail, vi.fn()];
                    }

                    if (stateCall === 6) {
                        return [detailDraft, vi.fn()];
                    }

                    if (stateCall === 7) {
                        return [options.isSaving ?? false, vi.fn()];
                    }

                    if (stateCall === 8) {
                        return [options.saveMessageVisible ?? false, vi.fn()];
                    }

                    if (stateCall === 9) {
                        return [options.droppedFileNames ?? [], vi.fn()];
                    }

                    if (stateCall === 10) {
                        return [options.isDeleteDialogOpen ?? false, vi.fn()];
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
        expect(markup).toContain('aria-label="LumiLabo MOCK画面"');
        expect(markup).toContain('rounded-t-md');
        expect(markup).toContain('border-b-0');
        expect(markup).toContain('overflow-x-auto');
        expect(markup).toContain('content-start');
        expect(markup).toContain('sm:content-center');
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
        expect(markup).toContain('aria-label="案件内画面"');
        expect(markup).toContain('lucide-arrow-left');
        expect(markup).toContain('content-start');
        expect(markup).toContain('sm:content-center');
        expect(markup).toContain('orientation:landscape');
        expect(markup).not.toContain('選択へ戻る');
        expect(markup).not.toContain('TOPへ戻る');
    });

    it('marks project back targets by screen', async () => {
        const projectTopMarkup = await renderMockViewMarkup('project');
        const registerMarkup = await renderMockViewMarkup('project', 'register');
        const listMarkup = await renderMockViewMarkup('project', 'list');
        const detailMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
        });

        expect(projectTopMarkup).toContain(
            'data-lumilabo-back-target="select"',
        );
        expect(registerMarkup).toContain(
            'data-lumilabo-back-target="project-top"',
        );
        expect(listMarkup).toContain(
            'data-lumilabo-back-target="project-top"',
        );
        expect(detailMarkup).toContain(
            'data-lumilabo-back-target="detail-return-target"',
        );
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

    it('renders a keyboard-operable project item with contact and memo on the list tab', async () => {
        const markup = await renderMockViewMarkup('project', 'list');

        expect(markup).toContain('案件一覧');
        expect(markup).toContain('ルミラボ工務店');
        expect(markup).toContain('担当者：山田 太郎');
        expect(markup).toContain('メモ：初回訪問予定。現場確認後に写真と資料を追加する。');
        expect(markup).toContain('案件詳細を開く');
        expect(markup).toContain('overflow-hidden whitespace-nowrap');
        expect(markup).toContain('truncate text-sm font-semibold');
        expect(markup).toContain('lucide-chevron-right');
        expect(markup).toContain('戻る');
        expect(markup).not.toContain('詳細を見る');
        expect(markup).not.toContain('登録する');
        expect(markup).not.toContain('会社名');
        expect(markup).not.toContain('担当者名');
        expect(markup).not.toContain('住所');
        expect(markup).not.toContain('登録日');
        expect(markup).not.toContain('写真撮影');
        expect(markup).not.toContain('ファイルをまとめてドラッグ');
        expect(markup).not.toContain('lucide-save');
        expect(markup).not.toContain('lucide-layers-3');
        expect(markup).not.toMatch(/<h1[^>]*>案件<\/h1>/);
    });

    it('renders an empty project list after a mock project deletion', async () => {
        const markup = await renderMockViewMarkup('project', 'list', {
            projectDetail: null,
        });

        expect(markup).toContain('案件一覧');
        expect(markup).toContain('表示できる案件はありません');
        expect(markup).not.toContain('ルミラボ工務店');
        expect(markup).not.toContain('詳細を見る');
    });

    it('renders project detail without adding detail or back to file tags', async () => {
        const markup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
        });
        const mapUrl = `https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(lumiLaboProjectDetail.address)}`;

        expect(markup).toContain('aria-label="案件内画面"');
        expect(markup).toContain('aria-current="page"');
        expect(markup).toContain('案件詳細');
        expect(markup).toContain('会社名');
        expect(markup).toContain('担当者名');
        expect(markup).toContain('住所');
        expect(markup).toContain('メモ');
        expect(markup).toContain('登録日');
        expect(markup).toContain('2026/07/07');
        expect(markup).toContain('name="companyName"');
        expect(markup).toContain('name="contactName"');
        expect(markup).toContain('name="address"');
        expect(markup).toContain('name="memo"');
        expect(markup).not.toContain('name="registeredDate"');
        expect(markup).toContain(mapUrl);
        expect(markup).toContain('target="_blank"');
        expect(markup).toContain('rel="noopener noreferrer"');
        expect(markup).toContain('写真撮影');
        expect(markup).toContain('ファイルをまとめてドラッグ＆ドロップ');
        expect(markup).toMatch(/<h2[^>]*>写真<\/h2>/);
        expect(markup).toMatch(/<h2[^>]*>ファイル<\/h2>/);
        expect(markup).toContain('aria-label="保存済み現場写真 1を削除"');
        expect(markup).toContain('aria-label="現場確認資料.pdfを削除"');
        expect(markup.match(/lucide-x/g) ?? []).toHaveLength(5);
        expect(markup).toContain('案件を削除');
        expect(markup).toContain('lucide-trash-2');
        expect(markup).toContain('現場確認資料.pdf');
        expect(markup).toContain('現場参考メモ.xlsx');
        expect(markup).not.toContain('Google Maps API');
        expect(markup).not.toContain('Geocoding');
        expect(markup).not.toContain('Embed');
    });

    it('renders the project delete confirmation dialog with YES and NO', async () => {
        const markup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            isDeleteDialogOpen: true,
        });

        expect(markup).toContain('role="dialog"');
        expect(markup).toContain('aria-modal="true"');
        expect(markup).toContain('削除しますか？');
        expect(markup).toContain('YES');
        expect(markup).toContain('NO');
        expect(markup.indexOf('NO')).toBeLessThan(markup.indexOf('YES'));
    });

    it('shows the save button only when detail draft changed and can show the instant save message', async () => {
        const initialMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
        });
        const changedMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            detailDraft: {
                ...createProjectDetailDraft(lumiLaboProjectDetail),
                memo: '変更したメモ',
            },
        });
        const savedMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            saveMessageVisible: true,
        });

        expect(initialMarkup).not.toContain('lucide-save');
        expect(changedMarkup).toContain('lucide-save');
        expect(changedMarkup).toContain('<span>保存</span>');
        expect(savedMarkup).toContain('role="status"');
        expect(savedMarkup).toContain('保存しました');
    });

    it('does not render saved photo or file preview headings when detail has no saved previews', async () => {
        const emptyProjectDetail = {
            ...lumiLaboProjectDetail,
            savedPhotos: [],
            savedFiles: [],
        } satisfies LumiLaboMockProjectDetail;
        const markup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            projectDetail: emptyProjectDetail,
            detailDraft: createProjectDetailDraft(emptyProjectDetail),
        });

        expect(markup).toContain('写真撮影');
        expect(markup).toContain('ファイルをまとめてドラッグ＆ドロップ');
        expect(markup).not.toMatch(/<h2[^>]*>写真<\/h2>/);
        expect(markup).not.toMatch(/<h2[^>]*>ファイル<\/h2>/);
        expect(markup).not.toContain('保存済み現場写真');
        expect(markup).not.toContain('現場確認資料.pdf');
        expect(markup).not.toContain('現場参考メモ.xlsx');
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

function createProjectDetailDraft(
    projectDetail: LumiLaboMockProjectDetail,
): LumiLaboMockProjectDetailDraft {
    return {
        companyName: projectDetail.companyName,
        contactName: projectDetail.contactName,
        address: projectDetail.address,
        memo: projectDetail.memo,
    };
}
