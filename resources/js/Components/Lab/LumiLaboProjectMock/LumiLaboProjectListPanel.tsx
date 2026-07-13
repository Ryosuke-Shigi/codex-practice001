import { router } from "@inertiajs/react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { lumiLaboProjectBackLabel } from "./mockData";
import type {
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectList,
    LumiLaboMockProjectListItem,
} from "./types";

type LumiLaboProjectListPanelProps = {
    projectList: LumiLaboMockProjectList;
    projectOverrides: Readonly<
        Record<string, LumiLaboMockProjectDetailDraft | undefined>
    >;
    deletedProjectIds: readonly string[];
    projectListRefreshRevision: number;
    activeRefreshRevision: number | null;
    activeNormalRequestId: number | null;
    lastSuccessfulRefreshRevision: number;
    failedRefreshRequest: LumiLaboProjectListFailedRefresh | null;
    onProjectListRefreshStart: (revision: number) => boolean;
    onProjectListRefreshSuccess: (revision: number) => void;
    onProjectListRefreshFailure: (
        revision: number,
        requestData: LumiLaboProjectListRequestData,
    ) => void;
    onProjectListNormalRequestStart: () => number | null;
    onProjectListNormalRequestFinish: (requestId: number) => void;
    onOpenProjectDetail: (project: LumiLaboMockProjectListItem) => void;
    onBack: () => void;
    backTargetId: string;
};

export type LumiLaboProjectListQuery = {
    keyword: string;
    sort: LumiLaboMockProjectList["sort"];
    page: number;
    perPage: number;
};

export const LUMILABO_PROJECT_LIST_PARTIAL_PROPS = ["projectList"];
export const LUMILABO_PROJECT_LIST_MAX_PER_PAGE = 20;

export type LumiLaboProjectListRequestData = {
    keyword: string | undefined;
    sort: LumiLaboMockProjectList["sort"];
    page: number;
    per_page: number;
    deleted_ids: string[];
    overrides: Array<{
        id: string;
        company_name: string;
        contact_name: string;
        address: string;
        memo: string;
    }>;
};

export type LumiLaboProjectListRequestCallbacks = {
    onSuccess?: () => void;
    onFailure?: (requestData: LumiLaboProjectListRequestData) => void;
};

export type LumiLaboProjectListFailedRefresh = {
    revision: number;
    requestData: LumiLaboProjectListRequestData;
};

export function getNextLumiLaboProjectListRefreshRevision(
    requestedRevision: number,
    lastSuccessfulRevision: number,
    activeRevision: number | null,
    activeNormalRequestId: number | null,
    failedRevision: number | null,
): number | null {
    if (
        requestedRevision <= lastSuccessfulRevision ||
        activeRevision !== null ||
        activeNormalRequestId !== null ||
        failedRevision !== null
    ) {
        return null;
    }

    return requestedRevision;
}

export function createLumiLaboProjectListRequestCallbacks(
    requestData: LumiLaboProjectListRequestData,
    callbacks: LumiLaboProjectListRequestCallbacks = {},
) {
    return {
        onSuccess: () => callbacks.onSuccess?.(),
        onError: () => callbacks.onFailure?.(requestData),
        onCancel: () => callbacks.onFailure?.(requestData),
    };
}

export function createLumiLaboProjectListRequestData(
    query: LumiLaboProjectListQuery,
    deletedProjectIds: readonly string[],
    projectOverrides: Readonly<
        Record<string, LumiLaboMockProjectDetailDraft | undefined>
    > = {},
): LumiLaboProjectListRequestData {
    return {
        keyword: query.keyword === "" ? undefined : query.keyword,
        sort: query.sort,
        page: query.page,
        per_page: query.perPage,
        deleted_ids: [...deletedProjectIds],
        overrides: Object.entries(projectOverrides).flatMap(
            ([projectId, projectOverride]) =>
                projectOverride === undefined
                    ? []
                    : [
                          {
                              id: projectId,
                              company_name: projectOverride.companyName,
                              contact_name: projectOverride.contactName,
                              address: projectOverride.address,
                              memo: projectOverride.memo,
                          },
                      ],
        ),
    };
}

export function visitLumiLaboProjectListRefresh(
    action: string,
    requestData: LumiLaboProjectListRequestData,
    callbacks: LumiLaboProjectListRequestCallbacks,
): void {
    router.get(action, requestData, {
        only: LUMILABO_PROJECT_LIST_PARTIAL_PROPS,
        preserveState: true,
        preserveScroll: true,
        replace: true,
        ...createLumiLaboProjectListRequestCallbacks(requestData, callbacks),
    });
}


export function calculateLumiLaboProjectListPerPage(
    listHeight: number,
    rowHeight: number,
): number | null {
    if (listHeight <= 0 || rowHeight <= 0) {
        return null;
    }

    return Math.min(
        LUMILABO_PROJECT_LIST_MAX_PER_PAGE,
        Math.max(1, Math.floor(listHeight / rowHeight)),
    );
}
export function shouldReloadLumiLaboProjectList(
    previousPerPage: number | null,
    nextPerPage: number | null,
): boolean {
    return nextPerPage !== null && nextPerPage !== previousPerPage;
}
export default function LumiLaboProjectListPanel({
    projectList,
    projectOverrides,
    deletedProjectIds,
    projectListRefreshRevision,
    activeRefreshRevision,
    activeNormalRequestId,
    lastSuccessfulRefreshRevision,
    failedRefreshRequest,
    onProjectListRefreshStart,
    onProjectListRefreshSuccess,
    onProjectListRefreshFailure,
    onProjectListNormalRequestStart,
    onProjectListNormalRequestFinish,
    onOpenProjectDetail,
    onBack,
    backTargetId,
}: LumiLaboProjectListPanelProps) {
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState(projectList.keyword);
    const [isLoading, setIsLoading] = useState(false);
    const [isMeasurementReady, setIsMeasurementReady] = useState(
        projectList.isReady,
    );
    const projectListRef = useRef(projectList);
    const deletedProjectIdsRef = useRef(deletedProjectIds);
    const projectOverridesRef = useRef(projectOverrides);
    const measuredPerPageRef = useRef<number | null>(projectList.perPage);
    const pendingPerPageRef = useRef<number | null>(null);
    const activeNormalRequestIdRef = useRef<number | null>(null);
    const isMountedRef = useRef(false);
    const listRegionRef = useRef<HTMLDivElement>(null);
    const rowMeasurementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        projectListRef.current = projectList;
    }, [projectList]);

    useEffect(() => {
        deletedProjectIdsRef.current = deletedProjectIds;
    }, [deletedProjectIds]);

    useEffect(() => {
        projectOverridesRef.current = projectOverrides;
    }, [projectOverrides]);

    const visitProjectList = useCallback(
        (requestData: LumiLaboProjectListRequestData): boolean => {
            const requestId = onProjectListNormalRequestStart();

            if (requestId === null) {
                return false;
            }

            activeNormalRequestIdRef.current = requestId;
            setIsLoading(true);
            router.get(projectListRef.current.action, requestData, {
                only: LUMILABO_PROJECT_LIST_PARTIAL_PROPS,
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => {
                    onProjectListNormalRequestFinish(requestId);

                    if (
                        activeNormalRequestIdRef.current !== requestId
                    ) {
                        return;
                    }

                    activeNormalRequestIdRef.current = null;

                    if (isMountedRef.current) {
                        setIsLoading(false);
                    }
                },
            });

            return true;
        },
        [
            onProjectListNormalRequestFinish,
            onProjectListNormalRequestStart,
        ],
    );

    const visitProjectListRefresh = useCallback(
        (
            requestData: LumiLaboProjectListRequestData,
            callbacks: LumiLaboProjectListRequestCallbacks,
        ) => {
            visitLumiLaboProjectListRefresh(
                projectListRef.current.action,
                requestData,
                callbacks,
            );
        },
        [],
    );

    const reloadProjectList = useCallback(
        (changes: Partial<LumiLaboProjectListQuery>): boolean => {
            const current = projectListRef.current;
            const perPage = changes.perPage ?? measuredPerPageRef.current;

            if (perPage === null) {
                return false;
            }

            const nextQuery: LumiLaboProjectListQuery = {
                keyword: changes.keyword ?? current.keyword,
                sort: changes.sort ?? current.sort,
                page: changes.page ?? current.currentPage,
                perPage,
            };

            const started = visitProjectList(
                createLumiLaboProjectListRequestData(
                    nextQuery,
                    deletedProjectIdsRef.current,
                    projectOverridesRef.current,
                ),
            );

            if (
                started &&
                changes.perPage !== undefined &&
                pendingPerPageRef.current === perPage
            ) {
                pendingPerPageRef.current = null;
            }

            return started;
        },
        [visitProjectList],
    );

    const measurePerPage = useCallback(() => {
        const listRegion = listRegionRef.current;
        const rowMeasurement = rowMeasurementRef.current;

        if (listRegion === null || rowMeasurement === null) {
            return;
        }

        const perPage = calculateLumiLaboProjectListPerPage(
            listRegion.getBoundingClientRect().height,
            rowMeasurement.getBoundingClientRect().height,
        );

        if (perPage === null) {
            return;
        }

        setIsMeasurementReady(true);

        if (
            !shouldReloadLumiLaboProjectList(
                measuredPerPageRef.current,
                perPage,
            )
        ) {
            return;
        }

        measuredPerPageRef.current = perPage;
        pendingPerPageRef.current = perPage;
        reloadProjectList({ perPage, page: 1 });
    }, [reloadProjectList]);

    useEffect(() => {
        const observer = new ResizeObserver(measurePerPage);
        const listRegion = listRegionRef.current;
        const rowMeasurement = rowMeasurementRef.current;

        if (listRegion !== null) {
            observer.observe(listRegion);
        }

        if (rowMeasurement !== null) {
            observer.observe(rowMeasurement);
        }

        measurePerPage();

        return () => observer.disconnect();
    }, [measurePerPage]);

    const startProjectListRefresh = useCallback(
        (
            revision: number,
            retryRequestData?: LumiLaboProjectListRequestData,
        ) => {
            const perPage = measuredPerPageRef.current;

            if (perPage === null) {
                return;
            }

            const current = projectListRef.current;
            const requestData =
                retryRequestData ??
                createLumiLaboProjectListRequestData(
                    {
                        keyword: current.keyword,
                        sort: current.sort,
                        page: current.currentPage,
                        perPage,
                    },
                    deletedProjectIdsRef.current,
                    projectOverridesRef.current,
                );

            if (!onProjectListRefreshStart(revision)) {
                return;
            }

            if (pendingPerPageRef.current === requestData.per_page) {
                pendingPerPageRef.current = null;
            }

            visitProjectListRefresh(requestData, {
                onSuccess: () => {
                    onProjectListRefreshSuccess(revision);
                },
                onFailure: () => {
                    onProjectListRefreshFailure(revision, requestData);
                },
            });
        },
        [
            onProjectListRefreshFailure,
            onProjectListRefreshStart,
            onProjectListRefreshSuccess,
            visitProjectListRefresh,
        ],
    );

    useEffect(() => {
        if (measuredPerPageRef.current === null) {
            return;
        }

        const nextRevision = getNextLumiLaboProjectListRefreshRevision(
            projectListRefreshRevision,
            lastSuccessfulRefreshRevision,
            activeRefreshRevision,
            activeNormalRequestId,
            failedRefreshRequest?.revision ?? null,
        );

        if (nextRevision === null) {
            return;
        }

        startProjectListRefresh(nextRevision);
    }, [
        activeRefreshRevision,
        activeNormalRequestId,
        failedRefreshRequest,
        lastSuccessfulRefreshRevision,
        projectListRefreshRevision,
        startProjectListRefresh,
    ]);

    useEffect(() => {
        const pendingPerPage = pendingPerPageRef.current;

        if (pendingPerPage === null) {
            return;
        }

        reloadProjectList({ perPage: pendingPerPage, page: 1 });
    }, [
        activeNormalRequestId,
        activeRefreshRevision,
        failedRefreshRequest,
        lastSuccessfulRefreshRevision,
        projectListRefreshRevision,
        reloadProjectList,
    ]);

    const retryProjectListRefresh = () => {
        if (
            failedRefreshRequest === null ||
            activeRefreshRevision !== null ||
            activeNormalRequestId !== null
        ) {
            return;
        }

        startProjectListRefresh(
            failedRefreshRequest.revision,
            failedRefreshRequest.requestData,
        );
    };

    const hasPendingProjectListRefresh =
        projectListRefreshRevision > lastSuccessfulRefreshRevision;
    const isProjectListRequestLocked =
        activeRefreshRevision !== null ||
        activeNormalRequestId !== null ||
        failedRefreshRequest !== null ||
        hasPendingProjectListRefresh;
    const isListLoading =
        isLoading ||
        !isMeasurementReady ||
        !projectList.isReady ||
        activeRefreshRevision !== null ||
        activeNormalRequestId !== null ||
        (hasPendingProjectListRefresh && failedRefreshRequest === null);
    const isSearchSubmitDisabled =
        isLoading || isProjectListRequestLocked;

    const openSearchDialog = () => {
        setSearchKeyword(projectList.keyword);
        setIsSearchDialogOpen(true);
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const started =
            !isSearchSubmitDisabled &&
            reloadProjectList({ keyword: searchKeyword, page: 1 });

        if (started) {
            setIsSearchDialogOpen(false);
        }
    };

    const clearSearch = () => reloadProjectList({ keyword: "", page: 1 });

    return (
        <section className="h-full min-h-0 px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
                <header className="grid gap-1">
                    <p className="text-sm font-black text-yellow-800">案件</p>
                    <h1 className="text-2xl font-black leading-tight text-black sm:text-3xl">
                        案件一覧
                    </h1>
                </header>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                    <label className="grid min-w-0 gap-1.5 text-base font-black text-neutral-800">
                        <span>登録日順</span>
                        <select
                            aria-label="登録日順"
                            className="min-h-12 min-w-0 rounded-md border border-neutral-300 bg-white px-3 text-base font-black text-black outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100"
                            value={projectList.sort}
                            disabled={isListLoading || failedRefreshRequest !== null}
                            onChange={(event) =>
                                reloadProjectList({
                                    sort: event.target
                                        .value as LumiLaboMockProjectList["sort"],
                                    page: 1,
                                })
                            }
                        >
                            <option value="registered_desc">新しい順</option>
                            <option value="registered_asc">古い順</option>
                        </select>
                    </label>

                    <button
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-yellow-500 bg-yellow-100 px-4 text-base font-black text-yellow-950 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500"
                        disabled={isListLoading || failedRefreshRequest !== null}
                        onClick={openSearchDialog}
                    >
                        <Search className="h-5 w-5" aria-hidden />
                        検索
                    </button>
                </div>

                {projectList.keyword !== "" ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-base font-black text-neutral-900">
                        <span>検索条件：{projectList.keyword}</span>
                        <button
                            type="button"
                            className="underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:text-neutral-500"
                            disabled={isListLoading || failedRefreshRequest !== null}
                            onClick={clearSearch}
                        >
                            解除
                        </button>
                    </div>
                ) : null}

                <div
                    ref={listRegionRef}
                    aria-busy={isListLoading}
                    className="relative min-h-0 flex-1 overflow-y-auto rounded-md border border-neutral-300 bg-white shadow-sm"
                >
                    <div
                        ref={rowMeasurementRef}
                        aria-hidden
                        className="invisible absolute inset-x-0 flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-3 text-left text-black"
                        style={{ containerType: "inline-size" }}
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-lg font-black">
                                案件一覧の計測用会社名
                            </span>
                            <span className="hidden truncate text-base font-bold text-neutral-700 [@container(min-width:36rem)]:block">
                                担当者：案件一覧の計測用担当者名
                            </span>
                        </span>
                        <time className="shrink-0 text-base font-black text-neutral-800">
                            2026/07/12
                        </time>
                        <ChevronRight
                            className="h-5 w-5 shrink-0"
                            aria-hidden
                        />
                    </div>

                    {failedRefreshRequest !== null ? (
                        <div
                            role="alert"
                            className="grid gap-3 px-4 py-6 text-base font-black text-red-800"
                        >
                            <p>一覧の更新に失敗しました。もう一度お試しください。</p>
                            <button
                                type="button"
                                className="inline-flex min-h-12 w-fit items-center justify-center rounded-md border border-red-700 bg-white px-4 text-base font-black text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-500"
                                disabled={
                                    isLoading || activeRefreshRevision !== null
                                }
                                onClick={retryProjectListRefresh}
                            >
                                再試行
                            </button>
                        </div>
                    ) : isListLoading ? (
                        <p
                            role="status"
                            className="px-4 py-6 text-base font-black text-yellow-900"
                        >
                            {projectList.isReady
                                ? "一覧を更新しています"
                                : "一覧の表示件数を計測しています"}
                        </p>
                    ) : projectList.items.length > 0 ? (
                        <div className="divide-y divide-neutral-200">
                            {projectList.items.map((project) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    aria-label={`${project.companyName}の案件詳細を開く`}
                                    style={{ containerType: "inline-size" }}
                                    className="group flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-3 text-left text-black transition hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500 disabled:cursor-not-allowed"
                                    disabled={isListLoading || failedRefreshRequest !== null}
                                    onClick={() => onOpenProjectDetail(project)}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-lg font-black">
                                            {project.companyName}
                                        </span>
                                        <span className="hidden truncate text-base font-bold text-neutral-700 [@container(min-width:36rem)]:block">
                                            担当者：{project.contactName}
                                        </span>
                                    </span>
                                    <time className="shrink-0 text-base font-black text-neutral-800">
                                        {project.registeredDate}
                                    </time>
                                    <ChevronRight
                                        className="h-5 w-5 shrink-0 text-yellow-800 transition group-hover:translate-x-0.5"
                                        aria-hidden
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p
                            role="status"
                            className="px-4 py-6 text-base font-black text-neutral-700"
                        >
                            表示できる案件はありません
                        </p>
                    )}
                </div>

                <div className="min-h-12">
                    {!isListLoading &&
                    failedRefreshRequest === null &&
                    projectList.isReady &&
                    projectList.showPagination ? (
                        <nav
                            aria-label="案件一覧のページ移動"
                            className="flex items-center justify-between gap-3"
                        >
                            <button
                                type="button"
                                className="inline-flex min-h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
                                disabled={
                                    isListLoading || !projectList.hasPrevious
                                }
                                onClick={() =>
                                    projectList.previousPage !== null &&
                                    reloadProjectList({
                                        page: projectList.previousPage,
                                    })
                                }
                            >
                                ＜＜
                            </button>
                            <button
                                type="button"
                                className="inline-flex min-h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
                                disabled={isListLoading || !projectList.hasNext}
                                onClick={() =>
                                    projectList.nextPage !== null &&
                                    reloadProjectList({
                                        page: projectList.nextPage,
                                    })
                                }
                            >
                                ＞＞
                            </button>
                        </nav>
                    ) : null}
                </div>

                <button
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px sm:max-w-sm"
                    data-lumilabo-back-target={backTargetId}
                    onClick={onBack}
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                    <span>{lumiLaboProjectBackLabel}</span>
                </button>
            </div>

            {isSearchDialogOpen ? (
                <ProjectSearchDialog
                    keyword={searchKeyword}
                    isSubmitDisabled={isSearchSubmitDisabled}
                    onChangeKeyword={setSearchKeyword}
                    onClose={() => setIsSearchDialogOpen(false)}
                    onSubmit={submitSearch}
                />
            ) : null}
        </section>
    );
}

type ProjectSearchDialogProps = {
    keyword: string;
    isSubmitDisabled: boolean;
    onChangeKeyword: (keyword: string) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ProjectSearchDialog({
    keyword,
    isSubmitDisabled,
    onChangeKeyword,
    onClose,
    onSubmit,
}: ProjectSearchDialogProps) {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="lumilabo-project-search-title"
                className="w-full max-w-lg rounded-md border border-neutral-300 bg-white p-5 shadow-xl"
                onSubmit={onSubmit}
            >
                <div className="flex items-start justify-between gap-4">
                    <h2
                        id="lumilabo-project-search-title"
                        className="text-xl font-black text-black"
                    >
                        案件を検索
                    </h2>
                </div>
                <label className="mt-5 grid gap-2 text-base font-black text-neutral-800">
                    <span>キーワード</span>
                    <input
                        autoFocus
                        value={keyword}
                        onChange={(event) =>
                            onChangeKeyword(event.target.value)
                        }
                        className="min-h-14 rounded-md border border-neutral-300 px-3 text-lg font-bold text-black outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                </label>
                <div className="mt-5 grid gap-3 sm:hidden">
                    <button
                        type="submit"
                        className="min-h-12 rounded-md border border-yellow-500 bg-yellow-100 px-4 text-lg font-black text-yellow-950 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500"
                        disabled={isSubmitDisabled}
                    >
                        検索
                    </button>
                    <button
                        type="button"
                        className="min-h-12 rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                        onClick={onClose}
                    >
                        閉じる
                    </button>
                </div>
                <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2">
                    <button
                        type="button"
                        className="min-h-12 rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                        onClick={onClose}
                    >
                        閉じる
                    </button>
                    <button
                        type="submit"
                        className="min-h-12 rounded-md border border-yellow-500 bg-yellow-100 px-4 text-lg font-black text-yellow-950 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500"
                        disabled={isSubmitDisabled}
                    >
                        検索
                    </button>
                </div>
            </form>
        </div>
    );
}
