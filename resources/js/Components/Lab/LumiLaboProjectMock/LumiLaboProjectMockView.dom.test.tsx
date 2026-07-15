// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LumiLaboProjectListPanel from './LumiLaboProjectListPanel';
import LumiLaboProjectMockView from './LumiLaboProjectMockView';
import type { LumiLaboMockProjectList } from './types';

const projectList = {
    items: [
        {
            id: 'one',
            companyName: '会社A',
            contactName: '田中',
            address: '大阪',
            memo: '初回',
            registeredDate: '2026/07/12',
        },
        {
            id: 'two',
            companyName: '会社B',
            contactName: '佐藤',
            address: '岸和田',
            memo: '確認',
            registeredDate: '2026/07/11',
        },
        {
            id: 'three',
            companyName: '会社C',
            contactName: '山田',
            address: '大阪',
            memo: '点検',
            registeredDate: '2026/07/10',
        },
        {
            id: 'four',
            companyName: '会社D',
            contactName: '鈴木',
            address: '堺',
            memo: '見積',
            registeredDate: '2026/07/09',
        },
        {
            id: 'five',
            companyName: '会社E',
            contactName: '高橋',
            address: '泉州',
            memo: '訪問',
            registeredDate: '2026/07/08',
        },
    ],
} satisfies LumiLaboMockProjectList;

class TestResizeObserver {
    static instances: TestResizeObserver[] = [];

    constructor(private readonly callback: ResizeObserverCallback) {
        TestResizeObserver.instances.push(this);
    }

    observe() {}

    unobserve() {}

    disconnect() {}

    trigger() {
        this.callback([], this as unknown as ResizeObserver);
    }
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
    (
        globalThis as typeof globalThis & {
            IS_REACT_ACT_ENVIRONMENT: boolean;
        }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    TestResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function render(ui: ReactNode) {
    act(() => root.render(ui));
}

function normalizedText(element: Element): string {
    return element.textContent?.replace(/\s+/gu, '') ?? '';
}

function findButton(
    label: string,
    scope: ParentNode = container,
): HTMLButtonElement {
    const button = Array.from(scope.querySelectorAll('button')).find(
        (candidate) => normalizedText(candidate) === label,
    );

    if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Button not found: ${label}`);
    }

    return button;
}

function clickButton(label: string, scope: ParentNode = container) {
    act(() => findButton(label, scope).click());
}

function clickProject(companyName: string) {
    const button = container.querySelector(
        `button[aria-label="${companyName}の案件詳細を開く"]`,
    );

    if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`Project row not found: ${companyName}`);
    }

    act(() => button.click());
}

function changeInput(input: HTMLInputElement, value: string) {
    act(() => {
        Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )?.set?.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

function changeSelect(select: HTMLSelectElement, value: string) {
    act(() => {
        Object.getOwnPropertyDescriptor(
            HTMLSelectElement.prototype,
            'value',
        )?.set?.call(select, value);
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

function submit(form: HTMLFormElement) {
    act(() => {
        form.dispatchEvent(
            new Event('submit', { bubbles: true, cancelable: true }),
        );
    });
}

function renderListPanel() {
    render(
        <LumiLaboProjectListPanel
            projectList={projectList}
            projectOverrides={{}}
            deletedProjectIds={[]}
            onOpenProjectDetail={vi.fn()}
            onBack={vi.fn()}
            backTargetId="project-top"
        />,
    );
}

function openProjectList() {
    render(<LumiLaboProjectMockView projectList={projectList} />);
    clickButton('Start');
    clickButton('案件');
    clickButton('一覧');
}

function listPanelWrapper(): HTMLDivElement {
    const heading = Array.from(container.querySelectorAll('h1')).find(
        (candidate) => normalizedText(candidate) === '案件一覧',
    );
    const wrapper = heading?.closest('section')?.parentElement;

    if (!(wrapper instanceof HTMLDivElement)) {
        throw new Error('List panel wrapper not found');
    }

    return wrapper;
}

function visibleProjectLabels(): string[] {
    return Array.from(
        container.querySelectorAll<HTMLButtonElement>(
            'button[aria-label$="の案件詳細を開く"]',
        ),
    ).map((button) => button.getAttribute('aria-label') ?? '');
}

function searchDialog(): HTMLFormElement {
    const dialog = container.querySelector('[role="dialog"]');

    if (!(dialog instanceof HTMLFormElement)) {
        throw new Error('Search dialog not found');
    }

    return dialog;
}

function mockRectHeight(element: Element, height: number) {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        bottom: height,
        height,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    });
}

describe('LumiLaboProjectMock client interactions', () => {
    it('saves an override, returns to the list, and searches the saved value', () => {
        openProjectList();
        clickProject('会社A');

        const companyInput = container.querySelector(
            'input[autocomplete="organization"]',
        );

        expect(companyInput).toBeInstanceOf(HTMLInputElement);
        changeInput(companyInput as HTMLInputElement, '保存後会社');
        clickButton('保存する');
        act(() => vi.advanceTimersByTime(250));
        clickButton('案件一覧へ戻る');

        expect(container.textContent).toContain('保存後会社');
        clickButton('検索');
        const dialog = searchDialog();
        const input = dialog.querySelector('input');

        expect(input).toBeInstanceOf(HTMLInputElement);
        changeInput(input as HTMLInputElement, '保存後会社');
        submit(dialog);

        expect(container.textContent).toContain('検索条件：保存後会社');
        expect(container.textContent).toContain('保存後会社');
        expect(container.textContent).not.toContain('会社B');
    });

    it('keeps an applied search while opening a project detail and returning', () => {
        openProjectList();
        clickButton('検索');
        const dialog = searchDialog();
        const input = dialog.querySelector('input');

        expect(input).toBeInstanceOf(HTMLInputElement);
        changeInput(input as HTMLInputElement, '会社B');
        submit(dialog);

        const wrapper = listPanelWrapper();
        expect(visibleProjectLabels()).toEqual(['会社Bの案件詳細を開く']);
        clickProject('会社B');

        expect(wrapper.hidden).toBe(true);
        expect(wrapper.contains(document.activeElement)).toBe(false);
        clickButton('案件一覧へ戻る');

        expect(wrapper.hidden).toBe(false);
        expect(container.textContent).toContain('検索条件：会社B');
        expect(visibleProjectLabels()).toEqual(['会社Bの案件詳細を開く']);
    });

    it('keeps ascending sort and order while opening a project detail and returning', () => {
        openProjectList();
        const select = container.querySelector('select[aria-label="登録日順"]');

        expect(select).toBeInstanceOf(HTMLSelectElement);
        changeSelect(select as HTMLSelectElement, 'registered_asc');
        expect(visibleProjectLabels()).toEqual([
            '会社Eの案件詳細を開く',
            '会社Dの案件詳細を開く',
            '会社Cの案件詳細を開く',
            '会社Bの案件詳細を開く',
        ]);

        clickProject('会社E');
        clickButton('案件一覧へ戻る');

        expect((select as HTMLSelectElement).value).toBe('registered_asc');
        expect(visibleProjectLabels()).toEqual([
            '会社Eの案件詳細を開く',
            '会社Dの案件詳細を開く',
            '会社Cの案件詳細を開く',
            '会社Bの案件詳細を開く',
        ]);
    });

    it('clamps the retained last page after its only project is deleted', () => {
        openProjectList();
        clickButton('＞＞');

        expect(visibleProjectLabels()).toEqual(['会社Eの案件詳細を開く']);
        clickProject('会社E');
        clickButton('案件を削除する');

        expect(container.textContent).toContain('この案件を削除しますか？');
        clickButton('はい');

        expect(visibleProjectLabels()).toEqual([
            '会社Aの案件詳細を開く',
            '会社Bの案件詳細を開く',
            '会社Cの案件詳細を開く',
            '会社Dの案件詳細を開く',
        ]);
        expect(container.textContent).not.toContain('会社E');
        expect(
            container.querySelector('nav[aria-label="案件一覧のページ移動"]'),
        ).toBeNull();
    });

    it('applies search only on submit, shows the condition, and clears it', () => {
        renderListPanel();
        clickButton('検索');
        const dialog = searchDialog();
        const input = dialog.querySelector('input');

        expect(input).toBeInstanceOf(HTMLInputElement);
        changeInput(input as HTMLInputElement, '会社B');

        expect(container.textContent).toContain('会社A');
        expect(container.textContent).not.toContain('検索条件：会社B');

        const mobileActions = dialog.querySelector('.sm\\:hidden');
        const desktopActions = dialog.querySelector('.sm\\:grid');
        expect(
            Array.from(mobileActions?.querySelectorAll('button') ?? []).map(
                normalizedText,
            ),
        ).toEqual(['検索', '閉じる']);
        expect(
            Array.from(desktopActions?.querySelectorAll('button') ?? []).map(
                normalizedText,
            ),
        ).toEqual(['閉じる', '検索']);

        submit(dialog);

        expect(container.textContent).toContain('検索条件：会社B');
        expect(container.textContent).not.toContain('会社A');
        expect(container.textContent).toContain('会社B');

        clickButton('解除');

        expect(container.textContent).not.toContain('検索条件：');
        expect(container.textContent).toContain('会社A');
    });

    it('uses only previous and next pagination controls and disables each edge', () => {
        renderListPanel();
        const pagination = container.querySelector(
            'nav[aria-label="案件一覧のページ移動"]',
        );

        expect(pagination).not.toBeNull();
        expect(pagination?.querySelectorAll('button')).toHaveLength(2);
        expect(findButton('＜＜', pagination as HTMLElement).disabled).toBe(
            true,
        );
        expect(findButton('＞＞', pagination as HTMLElement).disabled).toBe(
            false,
        );
        expect(pagination?.textContent).not.toMatch(/\d+\s*\/\s*\d+/u);
        expect(pagination?.textContent).not.toContain('全5件');

        clickButton('＞＞', pagination as HTMLElement);

        expect(container.textContent).not.toContain('会社A');
        expect(container.textContent).toContain('会社E');
        expect(findButton('＜＜', pagination as HTMLElement).disabled).toBe(
            false,
        );
        expect(findButton('＞＞', pagination as HTMLElement).disabled).toBe(
            true,
        );
    });

    it('keeps projects when ResizeObserver is unavailable', () => {
        vi.stubGlobal('ResizeObserver', undefined);
        renderListPanel();

        expect(container.textContent).toContain('会社A');
        expect(container.textContent).not.toContain('計測しています');

        clickButton('＞＞');

        expect(container.textContent).toContain('会社E');
    });

    it('keeps projects when list dimensions cannot be measured', () => {
        renderListPanel();

        act(() => TestResizeObserver.instances[0]?.trigger());

        expect(container.textContent).toContain('会社A');
        clickButton('＞＞');
        expect(container.textContent).toContain('会社E');
    });

    it('changes per-page locally after observation and clamps the current page', () => {
        renderListPanel();
        clickButton('＞＞');
        expect(container.textContent).toContain('会社E');

        const measurementRow = Array.from(
            container.querySelectorAll('[aria-hidden="true"]'),
        ).find((element) =>
            element.textContent?.includes('案件一覧の計測用会社名'),
        );
        const listRegion = measurementRow?.parentElement;

        expect(measurementRow).not.toBeUndefined();
        expect(listRegion).not.toBeNull();
        mockRectHeight(measurementRow as Element, 64);
        mockRectHeight(listRegion as Element, 320);

        act(() => TestResizeObserver.instances[0]?.trigger());

        expect(container.textContent).toContain('会社A');
        expect(container.textContent).toContain('会社E');
        expect(
            container.querySelector('nav[aria-label="案件一覧のページ移動"]'),
        ).toBeNull();
    });

    it('reserves one compact row and keeps the list controls compact in short landscape viewports', () => {
        renderListPanel();

        const measurementRow = Array.from(
            container.querySelectorAll('[aria-hidden="true"]'),
        ).find((element) =>
            element.textContent?.includes('案件一覧の計測用会社名'),
        );
        const listRegion = measurementRow?.parentElement;

        expect(listRegion?.className).toContain(
            '[@media(orientation:landscape)_and_(max-height:480px)]:min-h-12',
        );
        expect(measurementRow?.className).toContain(
            '[@media(orientation:landscape)_and_(max-height:480px)]:min-h-12',
        );
        expect(findButton('検索').className).toContain(
            '[@media(orientation:landscape)_and_(max-height:480px)]:min-h-10',
        );
        expect(findButton('戻る').className).toContain(
            '[@media(orientation:landscape)_and_(max-height:480px)]:min-h-10',
        );
    });

    it('opens and closes the camera feature without replacing the existing file input or making a request', async () => {
        const track = { stop: vi.fn() };
        const stream = {
            getTracks: () => [track],
        } as unknown as MediaStream;
        const getUserMedia = vi.fn().mockResolvedValue(stream);
        const fetchRequest = vi.fn();
        vi.stubGlobal('navigator', {
            mediaDevices: {
                getUserMedia,
                enumerateDevices: vi.fn().mockResolvedValue([
                    { kind: 'videoinput', deviceId: 'rear-camera' },
                ]),
            },
        });
        vi.stubGlobal('fetch', fetchRequest);
        openProjectList();
        clickProject('会社A');

        const fileInput = container.querySelector<HTMLInputElement>(
            'input[aria-label="ファイルをまとめて選択"]',
        );

        expect(fileInput?.type).toBe('file');
        expect(fileInput?.multiple).toBe(true);

        await act(async () => {
            findButton('写真を撮影する').click();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(getUserMedia).toHaveBeenCalledWith({
            audio: false,
            video: { facingMode: { ideal: 'environment' } },
        });
        expect(container.textContent).toContain('案件写真を撮影');
        expect(fetchRequest).not.toHaveBeenCalled();

        clickButton('閉じる');

        expect(track.stop).toHaveBeenCalledTimes(1);
        expect(container.textContent).not.toContain('案件写真を撮影');
        expect(
            container.querySelector('input[aria-label="ファイルをまとめて選択"]'),
        ).toBe(fileInput);
    });

    it('returns to the existing file picker when camera permission is denied', async () => {
        const getUserMedia = vi
            .fn()
            .mockRejectedValue(
                new DOMException('permission denied', 'NotAllowedError'),
            );
        vi.stubGlobal('navigator', {
            mediaDevices: {
                getUserMedia,
                enumerateDevices: vi.fn().mockResolvedValue([]),
            },
        });
        openProjectList();
        clickProject('会社A');
        const fileInput = container.querySelector<HTMLInputElement>(
            'input[aria-label="ファイルをまとめて選択"]',
        );

        expect(fileInput).toBeInstanceOf(HTMLInputElement);
        const inputClick = vi.spyOn(fileInput as HTMLInputElement, 'click');

        await act(async () => {
            findButton('写真を撮影する').click();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(container.textContent).toContain(
            'カメラの利用が許可されませんでした。',
        );
        clickButton('ファイルを選択する');

        expect(inputClick).toHaveBeenCalledTimes(1);
        expect(container.textContent).not.toContain('案件写真を撮影');
    });
});
