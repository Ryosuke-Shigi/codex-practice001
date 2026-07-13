// @vitest-environment jsdom

import { router } from '@inertiajs/react';
import { act, useCallback, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

vi.mock('@inertiajs/react', () => ({
    router: {
        get: vi.fn(),
    },
}));

import LumiLaboProjectListPanel, {
    type LumiLaboProjectListRequestData,
} from './LumiLaboProjectListPanel';
import {
    createLumiLaboProjectListRefreshState,
    reduceLumiLaboProjectListRefreshState,
    type LumiLaboProjectListRefreshAction,
    type LumiLaboProjectListRefreshState,
} from './LumiLaboProjectMockView';
import type {
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectList,
} from './types';

type RouterGetOptions = {
    onSuccess?: () => void;
    onError?: () => void;
    onCancel?: () => void;
    onFinish?: () => void;
};

type LifecycleHarnessProps = {
    initialPanelMounted?: boolean;
    initialRefreshRevision?: number;
};

const initialProjectList: LumiLaboMockProjectList = {
    items: [
        {
            id: 'mock-project-001',
            companyName: '初期会社',
            contactName: '初期担当者',
            address: '大阪府岸和田市',
            memo: '初期メモ',
            registeredDate: '2026-07-07',
        },
    ],
    keyword: '',
    sort: 'registered_desc',
    perPage: 5,
    isReady: true,
    currentPage: 1,
    hasPrevious: false,
    previousPage: null,
    hasNext: false,
    nextPage: null,
    showPagination: false,
    action: '/lab/lumilabo-project-mock',
};

let listHeight = 500;
let rowHeight = 100;

class TestResizeObserver {
    static instances = new Set<TestResizeObserver>();

    constructor(private readonly callback: ResizeObserverCallback) {
        TestResizeObserver.instances.add(this);
    }

    observe(): void {}

    unobserve(): void {}

    disconnect(): void {
        TestResizeObserver.instances.delete(this);
    }

    static triggerAll(): void {
        for (const observer of TestResizeObserver.instances) {
            observer.callback([], observer as unknown as ResizeObserver);
        }
    }
}

function createInitialRefreshState(
    requestedRevision: number,
): LumiLaboProjectListRefreshState {
    let state = createLumiLaboProjectListRefreshState();

    for (let revision = 0; revision < requestedRevision; revision += 1) {
        state = reduceLumiLaboProjectListRefreshState(state, {
            type: 'request',
        });
    }

    return state;
}

function createSavedOverride(companyName: string): LumiLaboMockProjectDetailDraft {
    return {
        companyName,
        contactName: '保存済み担当者',
        address: '保存済み住所',
        memo: '保存済みメモ',
    };
}

function LifecycleHarness({
    initialPanelMounted = true,
    initialRefreshRevision = 0,
}: LifecycleHarnessProps) {
    const [isPanelMounted, setIsPanelMounted] = useState(initialPanelMounted);
    const [projectList, setProjectList] = useState(initialProjectList);
    const [projectOverrides, setProjectOverrides] = useState<
        Record<string, LumiLaboMockProjectDetailDraft | undefined>
    >({});
    const [refreshState, setRefreshState] = useState(() =>
        createInitialRefreshState(initialRefreshRevision),
    );
    const refreshStateRef = useRef(refreshState);
    const updateRefreshState = useCallback(
        (action: LumiLaboProjectListRefreshAction) => {
            const current = refreshStateRef.current;
            const next = reduceLumiLaboProjectListRefreshState(
                current,
                action,
            );

            if (next !== current) {
                refreshStateRef.current = next;
                setRefreshState(next);
            }

            return next;
        },
        [],
    );
    const startRefresh = useCallback(
        (revision: number) => {
            const current = refreshStateRef.current;

            return updateRefreshState({ type: 'start', revision }) !== current;
        },
        [updateRefreshState],
    );
    const startNormalRequest = useCallback(() => {
        const current = refreshStateRef.current;
        const next = updateRefreshState({ type: 'start-normal' });

        return next === current ? null : next.activeNormalRequestId;
    }, [updateRefreshState]);

    return (
        <>
            <button
                type="button"
                data-testid="toggle-panel"
                onClick={() => setIsPanelMounted((current) => !current)}
            >
                Panelを切り替える
            </button>
            <button
                type="button"
                data-testid="save-update-a"
                onClick={() => {
                    setProjectOverrides({
                        'mock-project-001': createSavedOverride('保存済み会社A'),
                    });
                    updateRefreshState({ type: 'request' });
                }}
            >
                保存更新A
            </button>
            <button
                type="button"
                data-testid="save-update-b"
                onClick={() => {
                    setProjectOverrides({
                        'mock-project-001': createSavedOverride('保存済み会社B'),
                    });
                    updateRefreshState({ type: 'request' });
                }}
            >
                保存更新B
            </button>
            <button
                type="button"
                data-testid="apply-normal-result"
                onClick={() =>
                    setProjectList((current) => ({
                        ...current,
                        sort: 'registered_asc',
                    }))
                }
            >
                通常取得結果を反映
            </button>
            {isPanelMounted ? (
                <LumiLaboProjectListPanel
                    projectList={projectList}
                    projectOverrides={projectOverrides}
                    deletedProjectIds={[]}
                    projectListRefreshRevision={refreshState.requestedRevision}
                    activeRefreshRevision={refreshState.activeRevision}
                    activeNormalRequestId={refreshState.activeNormalRequestId}
                    lastSuccessfulRefreshRevision={refreshState.successfulRevision}
                    failedRefreshRequest={refreshState.failedRefresh}
                    onProjectListRefreshStart={startRefresh}
                    onProjectListRefreshSuccess={(revision) =>
                        updateRefreshState({ type: 'success', revision })
                    }
                    onProjectListRefreshFailure={(revision, requestData) =>
                        updateRefreshState({
                            type: 'failure',
                            revision,
                            requestData,
                        })
                    }
                    onProjectListNormalRequestStart={startNormalRequest}
                    onProjectListNormalRequestFinish={(requestId) =>
                        updateRefreshState({
                            type: 'finish-normal',
                            requestId,
                        })
                    }
                    onOpenProjectDetail={vi.fn()}
                    onBack={vi.fn()}
                    backTargetId="project-top"
                />
            ) : null}
        </>
    );
}

function getRouterOptions(index: number): RouterGetOptions {
    return vi.mocked(router.get).mock.calls[index]?.[2] as RouterGetOptions;
}

function getRouterRequestData(index: number): LumiLaboProjectListRequestData {
    return vi.mocked(router.get).mock.calls[index]?.[1] as LumiLaboProjectListRequestData;
}

describe('LumiLaboProjectListPanel lifecycle', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.mocked(router.get).mockReset();
        listHeight = 500;
        rowHeight = 100;
        TestResizeObserver.instances.clear();
        vi.stubGlobal('ResizeObserver', TestResizeObserver);
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
            function getBoundingClientRect(this: HTMLElement) {
                const element = this;
                const height = element.hasAttribute('aria-busy')
                    ? listHeight
                    : element.getAttribute('aria-hidden') === 'true'
                      ? rowHeight
                      : 0;

                return {
                    bottom: height,
                    height,
                    left: 0,
                    right: 0,
                    toJSON: () => ({}),
                    top: 0,
                    width: 0,
                    x: 0,
                    y: 0,
                } as DOMRect;
            },
        );
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        (
            globalThis as typeof globalThis & {
                IS_REACT_ACT_ENVIRONMENT?: boolean;
            }
        ).IS_REACT_ACT_ENVIRONMENT = true;
    });

    afterEach(async () => {
        await act(async () => {
            root.unmount();
        });
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        container.remove();
    });

    async function renderHarness(props: LifecycleHarnessProps): Promise<void> {
        await act(async () => {
            root.render(<LifecycleHarness {...props} />);
        });
    }

    async function clickTestButton(testId: string): Promise<void> {
        const button = container.querySelector<HTMLButtonElement>(
            `[data-testid="${testId}"]`,
        );

        expect(button).not.toBeNull();
        await act(async () => {
            button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
    }

    async function selectRegisteredAscending(): Promise<void> {
        const select = container.querySelector<HTMLSelectElement>('select');

        expect(select).not.toBeNull();
        await act(async () => {
            const valueSetter = Object.getOwnPropertyDescriptor(
                HTMLSelectElement.prototype,
                'value',
            )?.set;

            valueSetter?.call(select, 'registered_asc');
            select?.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    it('starts a required revision once on mount, does not duplicate active or successful revisions on remount, and ignores unmounted child state', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);

        await renderHarness({
            initialPanelMounted: false,
            initialRefreshRevision: 1,
        });
        await clickTestButton('toggle-panel');

        expect(router.get).toHaveBeenCalledTimes(1);

        await clickTestButton('toggle-panel');
        await clickTestButton('toggle-panel');

        expect(router.get).toHaveBeenCalledTimes(1);

        await clickTestButton('toggle-panel');
        await act(async () => {
            getRouterOptions(0).onSuccess?.();
        });
        await clickTestButton('toggle-panel');

        expect(router.get).toHaveBeenCalledTimes(1);
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('keeps a failed revision and its original request data across a real remount before retrying', async () => {
        await renderHarness({ initialRefreshRevision: 1 });

        const failedRequestData = getRouterRequestData(0);

        await act(async () => {
            getRouterOptions(0).onError?.();
        });
        await clickTestButton('toggle-panel');
        await clickTestButton('toggle-panel');

        const retryButton = Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent === '再試行',
        );

        expect(retryButton).toBeDefined();
        await act(async () => {
            retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(router.get).toHaveBeenCalledTimes(2);
        expect(getRouterRequestData(1)).toEqual(failedRequestData);
    });

    it('waits for a normal request before one coalesced refresh with the latest override and measured per_page', async () => {
        await renderHarness({});
        await selectRegisteredAscending();

        expect(router.get).toHaveBeenCalledTimes(1);
        expect(getRouterRequestData(0)).toMatchObject({
            sort: 'registered_asc',
            per_page: 5,
        });

        await clickTestButton('apply-normal-result');
        await clickTestButton('save-update-a');
        await clickTestButton('save-update-b');
        listHeight = 600;
        await act(async () => {
            TestResizeObserver.triggerAll();
        });

        expect(router.get).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain('一覧を更新しています');

        await act(async () => {
            getRouterOptions(0).onFinish?.();
        });

        expect(router.get).toHaveBeenCalledTimes(2);
        expect(getRouterRequestData(1)).toEqual(
            expect.objectContaining({
                sort: 'registered_asc',
                per_page: 6,
                overrides: [
                    expect.objectContaining({
                        id: 'mock-project-001',
                        company_name: '保存済み会社B',
                    }),
                ],
            }),
        );

        await act(async () => {
            getRouterOptions(1).onSuccess?.();
        });

        expect(router.get).toHaveBeenCalledTimes(2);
    });
});
