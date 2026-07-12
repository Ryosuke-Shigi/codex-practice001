import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { lumiLaboProjectDetail } from './mockData';
import type {
    LumiLaboMockProjectDetail,
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectDetailReturnTarget,
    LumiLaboMockProjectList,
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
    projectList?: LumiLaboMockProjectList;
    projectOverrides?: Record<string, LumiLaboMockProjectDetailDraft | undefined>;
    deletedProjectIds?: ReadonlySet<string>;
    isSearchDialogOpen?: boolean;
    listIsLoading?: boolean;
    droppedFileNames?: readonly string[];
    isDeleteDialogOpen?: boolean;
};

const testProjectList = {
    items: [
        {
            id: 'mock-project-001',
            companyName: 'ルミラボ工務店',
            contactName: '山田 太郎',
            address: '大阪府岸和田市上町 1-2-3',
            memo: '初回訪問予定。現場確認後に写真と資料を追加する。',
            registeredDate: '2026/07/07',
        },
    ],
    keyword: '',
    sort: 'registered_desc',
    viewport: 'mobile',
    currentPage: 1,
    hasPrevious: false,
    previousPage: null,
    hasNext: false,
    nextPage: null,
    showPagination: false,
    action: '/lab/lumilabo-project-mock',
} satisfies LumiLaboMockProjectList;

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
                        return [projectDetail?.id ?? null, vi.fn()];
                    }

                    if (stateCall === 6) {
                        return [projectDetail, vi.fn()];
                    }

                    if (stateCall === 7) {
                        return [detailDraft, vi.fn()];
                    }

                    if (stateCall === 8) {
                        return [options.projectOverrides ?? {}, vi.fn()];
                    }

                    if (stateCall === 9) {
                        return [options.deletedProjectIds ?? new Set(), vi.fn()];
                    }

                    if (stateCall === 10) {
                        return [options.isSaving ?? false, vi.fn()];
                    }

                    if (stateCall === 11) {
                        return [options.saveMessageVisible ?? false, vi.fn()];
                    }

                    if (stateCall === 12) {
                        return [options.droppedFileNames ?? [], vi.fn()];
                    }

                    if (stateCall === 13) {
                        return [options.isDeleteDialogOpen ?? false, vi.fn()];
                    }

                    if (stateCall === 14) {
                        return [options.isSearchDialogOpen ?? false, vi.fn()];
                    }

                    if (stateCall === 16) {
                        return [options.listIsLoading ?? false, vi.fn()];
                    }

                    return [initialValue, vi.fn()];
                }),
            };
        });
    }

    const { default: LumiLaboProjectMockView } = await import(
        './LumiLaboProjectMockView'
    );

    return renderToStaticMarkup(
        <LumiLaboProjectMockView projectList={options.projectList ?? testProjectList} />,
    );
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

    it('renders a mobile project row with company and date but no contact, address, or memo', async () => {
        const markup = await renderMockViewMarkup('project', 'list');

        expect(markup).toContain('案件一覧');
        expect(markup).toContain('ルミラボ工務店');
        expect(markup).toContain('2026/07/07');
        expect(markup).toContain('案件詳細を開く');
        expect(markup).toContain('<button');
        expect(markup).not.toContain('担当者：山田 太郎');
        expect(markup).not.toContain('大阪府岸和田市上町 1-2-3');
        expect(markup).not.toContain('初回訪問予定。現場確認後に写真と資料を追加する。');
        expect(markup).not.toContain('詳細を見る');
        expect(markup).not.toContain('＜＜');
        expect(markup).not.toContain('＞＞');
    });

    it('shows contact information from tablet width and confines search loading to the list', async () => {
        const markup = await renderMockViewMarkup('project', 'list', {
            projectList: {
                ...testProjectList,
                viewport: 'tablet',
                showPagination: true,
                hasNext: true,
                nextPage: 2,
            },
            isSearchDialogOpen: true,
            listIsLoading: true,
        });

        expect(markup).toContain('担当者：山田 太郎');
        expect(markup).toContain('hidden truncate text-base font-bold text-neutral-700 md:block');
        expect(markup).toContain('role="dialog"');
        expect(markup).toContain('案件を検索');
        expect(markup).toContain('一覧を更新しています');
        expect(markup).toContain('＜＜');
        expect(markup).toContain('＞＞');
        expect(markup).toContain('disabled=""');
        expect(markup).not.toContain('詳細を見る');
    });

    it('renders an empty project list without pagination', async () => {
        const markup = await renderMockViewMarkup('project', 'list', {
            projectList: {
                ...testProjectList,
                items: [],
            },
        });

        expect(markup).toContain('案件一覧');
        expect(markup).toContain('表示できる案件はありません');
        expect(markup).not.toContain('ルミラボ工務店');
        expect(markup).not.toContain('＜＜');
        expect(markup).not.toContain('＞＞');
    });

    it('applies ID-specific saved overrides and deleted IDs to the current list page', async () => {
        const overriddenMarkup = await renderMockViewMarkup('project', 'list', {
            projectOverrides: {
                'mock-project-001': {
                    companyName: 'ルミラボ工務店 保存後',
                    contactName: '山田 太郎',
                    address: '大阪府岸和田市上町 1-2-3',
                    memo: '保存済みのメモ',
                },
            },
        });
        const deletedMarkup = await renderMockViewMarkup('project', 'list', {
            deletedProjectIds: new Set(['mock-project-001']),
        });

        expect(overriddenMarkup).toContain('ルミラボ工務店 保存後');
        expect(overriddenMarkup).not.toContain('>ルミラボ工務店<');
        expect(overriddenMarkup).not.toContain('保存済みのメモ');
        expect(deletedMarkup).toContain('表示できる案件はありません');
        expect(deletedMarkup).not.toContain('ルミラボ工務店');
    });

    it('renders project detail without adding detail or back to file tags', async () => {
        const markup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
        });
        const mapUrl = `https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(lumiLaboProjectDetail.address)}`;

        expect(markup).toContain('aria-label="案件内画面"');
        expect(markup).toContain('aria-current="page"');
        expect(markup).toContain('案件詳細');
        expect(markup).toContain('案件一覧へ戻る');
        expect(markup).toContain('ルミラボ工務店');
        expect(markup).not.toContain('role="status"');
        expect(markup).not.toContain('保存状態');
        expect(markup).not.toContain('変更はありません');
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
        expect(markup.indexOf('name="address"')).toBeLessThan(
            markup.indexOf('aria-label="Google Mapsで住所を確認する"'),
        );
        expect(markup.indexOf('aria-label="Google Mapsで住所を確認する"')).toBeLessThan(
            markup.indexOf('name="memo"'),
        );
        expect(markup).toContain('写真を撮影する');
        expect(markup).toContain('ファイルを選択、またはまとめてドラッグ＆ドロップ');
        expect(markup).toContain('class="md:hidden"');
        expect(markup).toContain('class="hidden md:inline"');
        expect(markup).toMatch(/<h3[^>]*>保存済み写真<\/h3>/);
        expect(markup).toMatch(/<h3[^>]*>保存済みファイル<\/h3>/);
        expect(markup).toContain('aria-label="保存済み現場写真 1を削除"');
        expect(markup).toContain('aria-label="現場確認資料.pdfを削除"');
        expect(markup.match(/lucide-x/g) ?? []).toHaveLength(5);
        expect(markup).toContain('案件を削除する');
        expect(markup).toContain('lucide-trash-2');
        expect(markup).toContain('現場確認資料.pdf');
        expect(markup).toContain('現場参考メモ.xlsx');
        expect(markup).not.toContain('Google Maps API');
        expect(markup).not.toContain('Geocoding');
        expect(markup).not.toContain('Embed');
    });

    it('renders the project delete confirmation dialog with Japanese actions', async () => {
        const markup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            isDeleteDialogOpen: true,
        });

        expect(markup).toContain('role="dialog"');
        expect(markup).toContain('aria-modal="true"');
        expect(markup).toContain('この案件を削除しますか？');
        expect(markup).toContain('いいえ');
        expect(markup).toContain('はい');
        expect(markup).not.toContain('YES');
        expect(markup).not.toContain('NO');
        expect(markup).not.toContain('削除しない');
        expect(markup).not.toMatch(/<button[^>]*>\s*削除する\s*<\/button>/);
        expect(markup.indexOf('いいえ')).toBeLessThan(
            markup.lastIndexOf('はい'),
        );
    });

    it('keeps the map preview and search URL in sync with the draft address', async () => {
        const changedAddress = '東京都千代田区丸の内 2-2-2';
        const changedMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            detailDraft: {
                ...createProjectDetailDraft(lumiLaboProjectDetail),
                address: changedAddress,
            },
        });
        const emptyAddressMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            detailDraft: {
                ...createProjectDetailDraft(lumiLaboProjectDetail),
                address: '   ',
            },
        });
        const changedMapUrl = `https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(changedAddress)}`;

        expect(changedMarkup).toContain(`住所：${changedAddress}`);
        expect(changedMarkup).toContain(changedMapUrl);
        expect(changedMarkup).not.toContain(
            `query=${encodeURIComponent(lumiLaboProjectDetail.address)}`,
        );
        expect(emptyAddressMarkup).not.toContain(
            'aria-label="Google Mapsで住所を確認する"',
        );
        expect(emptyAddressMarkup).not.toContain('https://www.google.com/maps');
    });

    it('shows the sticky save bar only when detail draft changed and can show save states', async () => {
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
        const savingMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            detailDraft: {
                ...createProjectDetailDraft(lumiLaboProjectDetail),
                memo: '保存中のメモ',
            },
            isSaving: true,
        });
        const savedMarkup = await renderMockViewMarkup('project', 'list', {
            activeProjectViewId: 'detail',
            saveMessageVisible: true,
        });

        expect(initialMarkup).not.toContain('data-lumilabo-save-bar="true"');
        expect(initialMarkup).not.toContain('lucide-save');
        expect(initialMarkup).not.toContain('role="status"');
        expect(changedMarkup).toContain('data-lumilabo-save-bar="true"');
        expect(changedMarkup).toContain('sticky top-0 z-20');
        expect(changedMarkup).toContain('grid-cols-[minmax(0,1fr)_auto]');
        expect(changedMarkup).toContain('lucide-save');
        expect(changedMarkup).toContain('保存する');
        expect(changedMarkup).toContain('編集中');
        expect(changedMarkup.indexOf('編集中')).toBeLessThan(
            changedMarkup.indexOf('保存する'),
        );
        expect(savingMarkup).toContain('保存中です');
        expect(savingMarkup).toContain('disabled=""');
        expect(savedMarkup).toContain('data-lumilabo-save-bar="true"');
        expect(savedMarkup).toContain('role="status"');
        expect(savedMarkup).toContain('保存しました');
        expect(savedMarkup).not.toContain('lucide-save');
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

        expect(markup.match(/>写真を撮影する</g) ?? []).toHaveLength(1);
        expect(markup).toContain('ファイルを選択、またはまとめてドラッグ＆ドロップ');
        expect(markup).not.toContain('保存済み写真');
        expect(markup).not.toContain('保存済みファイル');
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
