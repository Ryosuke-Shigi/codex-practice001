import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import type {
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectList,
    LumiLaboMockProjectListItem,
    LumiLaboMockViewport,
} from './types';

type LumiLaboProjectListPanelProps = {
    projectList: LumiLaboMockProjectList;
    projectOverrides: Readonly<
        Record<string, LumiLaboMockProjectDetailDraft | undefined>
    >;
    deletedProjectIds: ReadonlySet<string>;
    onOpenProjectDetail: (project: LumiLaboMockProjectListItem) => void;
    onBack: () => void;
    backTargetId: string;
};

type ProjectListQuery = {
    keyword: string;
    sort: LumiLaboMockProjectList['sort'];
    page: number;
    viewport: LumiLaboMockViewport;
};

export const LUMILABO_PROJECT_LIST_PARTIAL_PROPS = ['projectList'];

export function resolveLumiLaboMockViewport(
    innerWidth: number,
    innerHeight: number,
): LumiLaboMockViewport {
    if (innerWidth < 768 || innerHeight <= 480) {
        return 'mobile';
    }

    return innerWidth < 1280 ? 'tablet' : 'desktop';
}

export default function LumiLaboProjectListPanel({
    projectList,
    projectOverrides,
    deletedProjectIds,
    onOpenProjectDetail,
    onBack,
    backTargetId,
}: LumiLaboProjectListPanelProps) {
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState(projectList.keyword);
    const [isLoading, setIsLoading] = useState(false);
    const projectListRef = useRef(projectList);
    const viewportRef = useRef<LumiLaboMockViewport>(projectList.viewport);

    useEffect(() => {
        projectListRef.current = projectList;
    }, [projectList]);

    const reloadProjectList = useCallback((changes: Partial<ProjectListQuery>) => {
        const current = projectListRef.current;
        const nextQuery: ProjectListQuery = {
            keyword: changes.keyword ?? current.keyword,
            sort: changes.sort ?? current.sort,
            page: changes.page ?? current.currentPage,
            viewport: changes.viewport ?? current.viewport,
        };

        router.get(
            current.action,
            {
                keyword:
                    nextQuery.keyword === '' ? undefined : nextQuery.keyword,
                sort: nextQuery.sort,
                page: nextQuery.page,
                viewport: nextQuery.viewport,
            },
            {
                only: LUMILABO_PROJECT_LIST_PARTIAL_PROPS,
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
    }, []);

    useEffect(() => {
        const syncViewport = () => {
            const nextViewport = resolveLumiLaboMockViewport(
                window.innerWidth,
                window.innerHeight,
            );

            if (nextViewport === viewportRef.current) {
                return;
            }

            viewportRef.current = nextViewport;
            reloadProjectList({ viewport: nextViewport, page: 1 });
        };

        syncViewport();
        window.addEventListener('resize', syncViewport);

        return () => window.removeEventListener('resize', syncViewport);
    }, [reloadProjectList]);

    const visibleItems = useMemo(
        () =>
            projectList.items
                .filter((project) => !deletedProjectIds.has(project.id))
                .map((project) => ({
                    ...project,
                    ...projectOverrides[project.id],
                })),
        [deletedProjectIds, projectList.items, projectOverrides],
    );

    const openSearchDialog = () => {
        setSearchKeyword(projectList.keyword);
        setIsSearchDialogOpen(true);
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        reloadProjectList({ keyword: searchKeyword, page: 1 });
        setIsSearchDialogOpen(false);
    };

    const clearSearch = () => reloadProjectList({ keyword: '', page: 1 });

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
                            disabled={isLoading}
                            onChange={(event) =>
                                reloadProjectList({
                                    sort: event.target.value as LumiLaboMockProjectList['sort'],
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
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-neutral-900 bg-neutral-900 px-4 text-base font-black text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-400"
                        disabled={isLoading}
                        onClick={openSearchDialog}
                    >
                        <Search className="h-5 w-5" aria-hidden />
                        検索
                    </button>
                </div>

                {projectList.keyword !== '' ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-base font-black text-neutral-900">
                        <span>検索条件：{projectList.keyword}</span>
                        <button
                            type="button"
                            className="underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:text-neutral-500"
                            disabled={isLoading}
                            onClick={clearSearch}
                        >
                            解除
                        </button>
                    </div>
                ) : null}

                <div
                    aria-busy={isLoading}
                    className="min-h-0 flex-1 overflow-y-auto rounded-md border border-neutral-300 bg-white shadow-sm"
                >
                    {isLoading ? (
                        <p
                            role="status"
                            className="border-b border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-black text-yellow-900"
                        >
                            一覧を更新しています
                        </p>
                    ) : null}

                    {visibleItems.length > 0 ? (
                        <div className="divide-y divide-neutral-200">
                            {visibleItems.map((project) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    aria-label={`${project.companyName}の案件詳細を開く`}
                                    className="group flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-3 text-left text-black transition hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500 disabled:cursor-not-allowed"
                                    disabled={isLoading}
                                    onClick={() => onOpenProjectDetail(project)}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-lg font-black">
                                            {project.companyName}
                                        </span>
                                        {projectList.viewport !== 'mobile' ? (
                                            <span className="hidden truncate text-base font-bold text-neutral-700 md:block">
                                                担当者：{project.contactName}
                                            </span>
                                        ) : null}
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

                {projectList.showPagination ? (
                    <nav
                        aria-label="案件一覧のページ移動"
                        className="flex items-center justify-between gap-3"
                    >
                        <button
                            type="button"
                            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
                            disabled={isLoading || !projectList.hasPrevious}
                            onClick={() =>
                                projectList.previousPage !== null &&
                                reloadProjectList({
                                    page: projectList.previousPage,
                                })
                            }
                        >
                            <ChevronLeft className="h-5 w-5" aria-hidden />
                            ＜＜
                        </button>
                        <button
                            type="button"
                            className="inline-flex min-h-12 items-center justify-center gap-1 rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
                            disabled={isLoading || !projectList.hasNext}
                            onClick={() =>
                                projectList.nextPage !== null &&
                                reloadProjectList({ page: projectList.nextPage })
                            }
                        >
                            ＞＞
                            <ChevronRight className="h-5 w-5" aria-hidden />
                        </button>
                    </nav>
                ) : null}

                <button
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px sm:max-w-sm"
                    data-lumilabo-back-target={backTargetId}
                    onClick={onBack}
                >
                    案件TOPへ戻る
                </button>
            </div>

            {isSearchDialogOpen ? (
                <ProjectSearchDialog
                    keyword={searchKeyword}
                    isLoading={isLoading}
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
    isLoading: boolean;
    onChangeKeyword: (keyword: string) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ProjectSearchDialog({
    keyword,
    isLoading,
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
                    <button
                        type="button"
                        aria-label="検索を閉じる"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-black hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                        disabled={isLoading}
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                </div>
                <label className="mt-5 grid gap-2 text-base font-black text-neutral-800">
                    <span>キーワード</span>
                    <input
                        autoFocus
                        value={keyword}
                        onChange={(event) => onChangeKeyword(event.target.value)}
                        className="min-h-14 rounded-md border border-neutral-300 px-3 text-lg font-bold text-black outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                </label>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        className="min-h-12 rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                        disabled={isLoading}
                        onClick={onClose}
                    >
                        閉じる
                    </button>
                    <button
                        type="submit"
                        className="min-h-12 rounded-md bg-neutral-900 px-4 text-lg font-black text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-400"
                        disabled={isLoading}
                    >
                        検索
                    </button>
                </div>
            </form>
        </div>
    );
}
