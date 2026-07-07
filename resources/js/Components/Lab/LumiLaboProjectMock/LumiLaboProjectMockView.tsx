import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    FilePlus2,
    FolderKanban,
    Home,
    Layers3,
    List,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import {
    lumiLaboGlobalTabs,
    lumiLaboProjectBackLabel,
    lumiLaboProjectItem,
    lumiLaboProjectTabs,
    lumiLaboTopReturnLabel,
} from './mockData';
import type {
    LumiLaboMockGlobalTabId,
    LumiLaboMockProjectTabId,
    LumiLaboMockScreen,
    LumiLaboMockTab,
} from './types';

const projectTabIcons = {
    top: Home,
    register: FilePlus2,
    list: List,
} satisfies Record<LumiLaboMockProjectTabId, LucideIcon>;

export default function LumiLaboProjectMockView() {
    const [activeScreen, setActiveScreen] =
        useState<LumiLaboMockScreen>('top');
    const [activeProjectTabId, setActiveProjectTabId] =
        useState<LumiLaboMockProjectTabId>('top');

    const activeGlobalTabId: LumiLaboMockGlobalTabId =
        activeScreen === 'select' ? 'select' : 'top';

    const selectGlobalTab = (tabId: LumiLaboMockGlobalTabId) => {
        setActiveScreen(tabId);
    };

    const openProject = () => {
        setActiveProjectTabId('top');
        setActiveScreen('project');
    };

    return (
        <article className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fffdf2] text-black">
            {activeScreen === 'project' ? (
                <FileTagBar
                    tabs={lumiLaboProjectTabs}
                    activeTabId={activeProjectTabId}
                    onSelectTab={setActiveProjectTabId}
                />
            ) : (
                <FileTagBar
                    tabs={lumiLaboGlobalTabs}
                    activeTabId={activeGlobalTabId}
                    onSelectTab={selectGlobalTab}
                />
            )}

            <main className="min-h-0 flex-1 overflow-hidden bg-white">
                {activeScreen === 'top' ? (
                    <TopPanel onStart={() => setActiveScreen('select')} />
                ) : null}

                {activeScreen === 'select' ? (
                    <SelectPanel
                        onOpenProject={openProject}
                        onBackToTop={() => setActiveScreen('top')}
                    />
                ) : null}

                {activeScreen === 'project' ? (
                    <ProjectEntryPanel
                        activeProjectTabId={activeProjectTabId}
                        onBack={() => setActiveScreen('select')}
                        onSelectProjectTab={setActiveProjectTabId}
                    />
                ) : null}
            </main>
        </article>
    );
}

function FileTagBar<TId extends string>({
    tabs,
    activeTabId,
    onSelectTab,
}: {
    tabs: readonly LumiLaboMockTab<TId>[];
    activeTabId: TId;
    onSelectTab: (tabId: TId) => void;
}) {
    return (
        <nav className="flex-none overflow-hidden border-b border-yellow-200 bg-[#fff7c7] px-2 pt-2">
            <div className="flex gap-1 overflow-x-auto overscroll-x-contain">
                {tabs.map((tab) => {
                    const isActive = activeTabId === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            aria-pressed={isActive}
                            className={getFileTagClasses(isActive)}
                            onClick={() => onSelectTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

function TopPanel({ onStart }: { onStart: () => void }) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-5 py-6 sm:py-8">
            <div className="mx-auto grid min-h-full w-full max-w-sm content-center justify-items-center gap-5">
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-yellow-300 bg-yellow-100 text-yellow-900 shadow-sm shadow-yellow-900/10">
                    <Sparkles className="h-10 w-10" aria-hidden />
                </span>
                <h1 className="text-center text-4xl font-black leading-tight text-black">
                    LumiLabo
                </h1>
                <button
                    type="button"
                    className="min-h-14 w-full rounded-md border border-yellow-500 bg-yellow-300 px-6 text-lg font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    onClick={onStart}
                >
                    Start
                </button>
            </div>
        </section>
    );
}

function SelectPanel({
    onOpenProject,
    onBackToTop,
}: {
    onOpenProject: () => void;
    onBackToTop: () => void;
}) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-5 py-6 sm:py-8">
            <div className="mx-auto grid min-h-full w-full max-w-sm content-center gap-3">
                <button
                    type="button"
                    className="grid min-h-24 w-full place-items-center gap-2 rounded-md border border-yellow-500 bg-yellow-300 px-6 py-5 text-2xl font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    onClick={onOpenProject}
                >
                    <FolderKanban
                        className="h-10 w-10 text-yellow-900"
                        aria-hidden
                    />
                    <span>{lumiLaboProjectItem.label}</span>
                </button>
                <button
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-base font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    onClick={onBackToTop}
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                    <span>{lumiLaboTopReturnLabel}</span>
                </button>
            </div>
        </section>
    );
}

function ProjectEntryPanel({
    activeProjectTabId,
    onBack,
    onSelectProjectTab,
}: {
    activeProjectTabId: LumiLaboMockProjectTabId;
    onBack: () => void;
    onSelectProjectTab: (tabId: LumiLaboMockProjectTabId) => void;
}) {
    // スマホ横置きでは縦幅を優先し、案件TOPの戻る導線まで見える密度にする。
    return (
        <section className="h-full min-h-0 overflow-y-auto px-5 py-5 [@media(orientation:landscape)_and_(max-height:480px)]:py-2 sm:py-8">
            <div className="mx-auto grid min-h-full w-full max-w-sm content-center justify-items-center gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:max-w-xl [@media(orientation:landscape)_and_(max-height:480px)]:grid-cols-[auto_minmax(0,1fr)] [@media(orientation:landscape)_and_(max-height:480px)]:items-center [@media(orientation:landscape)_and_(max-height:480px)]:justify-items-stretch [@media(orientation:landscape)_and_(max-height:480px)]:gap-x-3 [@media(orientation:landscape)_and_(max-height:480px)]:gap-y-2">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300 bg-yellow-100 text-yellow-900 shadow-sm shadow-yellow-900/10 [@media(orientation:landscape)_and_(max-height:480px)]:h-10 [@media(orientation:landscape)_and_(max-height:480px)]:w-10">
                    <Layers3 className="h-8 w-8 [@media(orientation:landscape)_and_(max-height:480px)]:h-5 [@media(orientation:landscape)_and_(max-height:480px)]:w-5" aria-hidden />
                </span>
                <h1 className="text-center text-3xl font-black leading-tight text-black [@media(orientation:landscape)_and_(max-height:480px)]:text-left [@media(orientation:landscape)_and_(max-height:480px)]:text-2xl">
                    {lumiLaboProjectItem.label}
                </h1>
                <div className="grid w-full gap-2 [@media(orientation:landscape)_and_(max-height:480px)]:col-span-2 [@media(orientation:landscape)_and_(max-height:480px)]:grid-cols-3 [@media(orientation:landscape)_and_(max-height:480px)]:gap-1.5">
                    {lumiLaboProjectTabs.map((tab) => {
                        const Icon = projectTabIcons[tab.id];
                        const isActive = activeProjectTabId === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                aria-pressed={isActive}
                                className={getProjectEntryButtonClasses(isActive)}
                                onClick={() => onSelectProjectTab(tab.id)}
                            >
                                <Icon className="h-5 w-5" aria-hidden />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
                {activeProjectTabId === 'top' ? (
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px [@media(orientation:landscape)_and_(max-height:480px)]:col-span-2 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10 [@media(orientation:landscape)_and_(max-height:480px)]:text-base"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectBackLabel}</span>
                    </button>
                ) : null}
            </div>
        </section>
    );
}

function getFileTagClasses(isActive: boolean): string {
    return classNames(
        'min-h-8 min-w-24 flex-none rounded-t-md border border-b-0 px-3 py-1.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
        isActive
            ? 'border-yellow-400 bg-white text-black shadow-sm'
            : 'border-yellow-200 bg-yellow-100 text-yellow-950 hover:bg-yellow-50',
    );
}

function getProjectEntryButtonClasses(isActive: boolean): string {
    return classNames(
        'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border px-5 text-lg font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10 [@media(orientation:landscape)_and_(max-height:480px)]:px-3 [@media(orientation:landscape)_and_(max-height:480px)]:text-base',
        isActive
            ? 'border-yellow-600 bg-yellow-300 text-black shadow-sm shadow-yellow-900/20'
            : 'border-neutral-300 bg-white text-black hover:border-yellow-500 hover:bg-yellow-50',
    );
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
