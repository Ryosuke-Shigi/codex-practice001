import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
    lumiLaboProjectBackLabel,
    lumiLaboProjectTopBackAccessibleLabel,
} from './mockData';
import type {
    LumiLaboMockProjectDetailDraft,
    LumiLaboMockProjectList,
    LumiLaboMockProjectListItem,
} from './types';

type LumiLaboProjectListPanelProps = {
    projectList: LumiLaboMockProjectList;
    projectOverrides: Readonly<
        Record<string, LumiLaboMockProjectDetailDraft | undefined>
    >;
    deletedProjectIds: readonly string[];
    onOpenProjectDetail: (project: LumiLaboMockProjectListItem) => void;
    onBack: () => void;
    backTargetId: string;
};

type LumiLaboProjectListSort = 'registered_desc' | 'registered_asc';

type ProjectSearchDialogProps = {
    keyword: string;
    onChangeKeyword: (keyword: string) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const LUMILABO_PROJECT_LIST_MAX_PER_PAGE = 20;

const INITIAL_PER_PAGE = 4;

export function filterAndSortLumiLaboProjects(
    items: readonly LumiLaboMockProjectListItem[],
    overrides: Readonly<
        Record<string, LumiLaboMockProjectDetailDraft | undefined>
    >,
    deletedIds: readonly string[],
    keyword: string,
    sort: LumiLaboProjectListSort,
): LumiLaboMockProjectListItem[] {
    const deleted = new Set(deletedIds);
    const terms = keyword
        .trim()
        .split(/[\s　]+/u)
        .filter(Boolean);

    return items
        .map((item, order) => ({
            ...item,
            ...overrides[item.id],
            order,
        }))
        .filter((item) => !deleted.has(item.id))
        .filter((item) =>
            terms.every((term) =>
                [
                    item.companyName,
                    item.contactName,
                    item.address,
                    item.memo,
                ].some((value) => value.includes(term)),
            ),
        )
        .sort((first, second) => {
            const dateComparison = first.registeredDate.localeCompare(
                second.registeredDate,
            );

            return (
                (sort === 'registered_desc'
                    ? -dateComparison
                    : dateComparison) ||
                first.order - second.order
            );
        })
        .map(({ order: _order, ...item }) => item);
}

export function paginateLumiLaboProjects(
    projects: readonly LumiLaboMockProjectListItem[],
    requestedPage: number,
    perPage: number,
) {
    const totalPages = Math.max(1, Math.ceil(projects.length / perPage));
    const currentPage =
        projects.length === 0 ? 1 : Math.min(requestedPage, totalPages);

    return {
        currentPage,
        totalPages,
        items: projects.slice(
            (currentPage - 1) * perPage,
            currentPage * perPage,
        ),
    };
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
    const [searchKeyword, setSearchKeyword] = useState('');
    const [keyword, setKeyword] = useState('');
    const [sort, setSort] =
        useState<LumiLaboProjectListSort>('registered_desc');
    const [perPage, setPerPage] = useState(INITIAL_PER_PAGE);
    const [page, setPage] = useState(1);
    const listRegionRef = useRef<HTMLDivElement>(null);
    const rowMeasurementRef = useRef<HTMLDivElement>(null);
    const projects = useMemo(
        () =>
            filterAndSortLumiLaboProjects(
                projectList.items,
                projectOverrides,
                deletedProjectIds,
                keyword,
                sort,
            ),
        [projectList.items, projectOverrides, deletedProjectIds, keyword, sort],
    );
    const pagination = paginateLumiLaboProjects(projects, page, perPage);

    useEffect(() => {
        if (page !== pagination.currentPage) {
            setPage(pagination.currentPage);
        }
    }, [page, pagination.currentPage]);

    useEffect(() => {
        const listRegion = listRegionRef.current;
        const rowMeasurement = rowMeasurementRef.current;

        if (
            listRegion === null ||
            rowMeasurement === null ||
            typeof ResizeObserver === 'undefined'
        ) {
            return;
        }

        const measurePerPage = () => {
            const listHeight = listRegion.getBoundingClientRect().height;
            const rowHeight = rowMeasurement.getBoundingClientRect().height;

            if (listHeight <= 0 || rowHeight <= 0) {
                return;
            }

            setPerPage(
                Math.min(
                    LUMILABO_PROJECT_LIST_MAX_PER_PAGE,
                    Math.max(1, Math.floor(listHeight / rowHeight)),
                ),
            );
        };

        const observer = new ResizeObserver(measurePerPage);
        observer.observe(listRegion);
        observer.observe(rowMeasurement);
        measurePerPage();

        return () => observer.disconnect();
    }, []);

    const openSearchDialog = () => {
        setSearchKeyword(keyword);
        setIsSearchDialogOpen(true);
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setKeyword(
            searchKeyword
                .trim()
                .split(/[\s　]+/u)
                .filter(Boolean)
                .join(' '),
        );
        setPage(1);
        setIsSearchDialogOpen(false);
    };

    const clearSearch = () => {
        setKeyword('');
        setSearchKeyword('');
        setPage(1);
    };

    return (
        <section className="h-full min-h-0 px-4 py-4 sm:px-6 sm:py-6 [@media(orientation:landscape)_and_(max-height:480px)]:py-2">
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:gap-2">
                <header className="grid gap-1">
                    <p className="text-sm font-black text-yellow-800 [@media(orientation:landscape)_and_(max-height:480px)]:hidden">
                        案件
                    </p>
                    <h1 className="text-2xl font-black leading-tight text-black sm:text-3xl [@media(orientation:landscape)_and_(max-height:480px)]:text-xl">
                        案件一覧
                    </h1>
                </header>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 [@media(orientation:landscape)_and_(max-height:480px)]:gap-2">
                    <label className="grid min-w-0 gap-1.5 text-base font-black text-neutral-800">
                        <span className="[@media(orientation:landscape)_and_(max-height:480px)]:sr-only">
                            登録日順
                        </span>
                        <select
                            aria-label="登録日順"
                            className="min-h-12 min-w-0 rounded-md border border-neutral-300 bg-white px-3 text-base font-black text-black outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10"
                            value={sort}
                            onChange={(event) => {
                                setSort(
                                    event.target
                                        .value as LumiLaboProjectListSort,
                                );
                                setPage(1);
                            }}
                        >
                            <option value="registered_desc">新しい順</option>
                            <option value="registered_asc">古い順</option>
                        </select>
                    </label>

                    <button
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-yellow-500 bg-yellow-100 px-4 text-base font-black text-yellow-950 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10"
                        onClick={openSearchDialog}
                    >
                        <Search className="h-5 w-5" aria-hidden />
                        検索
                    </button>
                </div>

                {keyword !== '' ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-base font-black text-neutral-900">
                        <span>検索条件：{keyword}</span>
                        <button
                            type="button"
                            className="underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:text-neutral-500"
                            onClick={clearSearch}
                        >
                            解除
                        </button>
                    </div>
                ) : null}

                <div
                    ref={listRegionRef}
                    className="relative min-h-0 flex-1 overflow-y-auto rounded-md border border-neutral-300 bg-white shadow-sm [@media(orientation:landscape)_and_(max-height:480px)]:min-h-12"
                >
                    <div
                        ref={rowMeasurementRef}
                        aria-hidden
                        className="invisible absolute inset-x-0 flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-3 text-left text-black [@media(orientation:landscape)_and_(max-height:480px)]:min-h-12 [@media(orientation:landscape)_and_(max-height:480px)]:gap-2 [@media(orientation:landscape)_and_(max-height:480px)]:px-3 [@media(orientation:landscape)_and_(max-height:480px)]:py-2"
                        style={{ containerType: 'inline-size' }}
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

                    {pagination.items.length > 0 ? (
                        <div className="divide-y divide-neutral-200">
                            {pagination.items.map((project) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    aria-label={`${project.companyName}の案件詳細を開く`}
                                    style={{ containerType: 'inline-size' }}
                                    className="group flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-3 text-left text-black transition hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow-500 disabled:cursor-not-allowed [@media(orientation:landscape)_and_(max-height:480px)]:min-h-12 [@media(orientation:landscape)_and_(max-height:480px)]:gap-2 [@media(orientation:landscape)_and_(max-height:480px)]:px-3 [@media(orientation:landscape)_and_(max-height:480px)]:py-2"
                                    onClick={() =>
                                        onOpenProjectDetail(project)
                                    }
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

                <div className="min-h-12 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10">
                    {pagination.totalPages > 1 ? (
                        <nav
                            aria-label="案件一覧のページ移動"
                            className="flex items-center justify-between gap-3"
                        >
                            <button
                                type="button"
                                className="inline-flex min-h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10"
                                disabled={pagination.currentPage === 1}
                                onClick={() =>
                                    setPage(pagination.currentPage - 1)
                                }
                            >
                                ＜＜
                            </button>
                            <button
                                type="button"
                                className="inline-flex min-h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10"
                                disabled={
                                    pagination.currentPage ===
                                    pagination.totalPages
                                }
                                onClick={() =>
                                    setPage(pagination.currentPage + 1)
                                }
                            >
                                ＞＞
                            </button>
                        </nav>
                    ) : null}
                </div>

                <button
                    type="button"
                    aria-label={lumiLaboProjectTopBackAccessibleLabel}
                    title={lumiLaboProjectTopBackAccessibleLabel}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px sm:max-w-sm [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10"
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
                    onChangeKeyword={setSearchKeyword}
                    onClose={() => setIsSearchDialogOpen(false)}
                    onSubmit={submitSearch}
                />
            ) : null}
        </section>
    );
}

function ProjectSearchDialog({
    keyword,
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
                    >
                        検索
                    </button>
                </div>
            </form>
        </div>
    );
}
