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
    lumiLaboProjectActionTabs,
    lumiLaboProjectBackLabel,
    lumiLaboProjectItem,
    lumiLaboProjectRegisterPanel,
    lumiLaboProjectTabs,
    lumiLaboTopReturnLabel,
} from './mockData';
import type {
    LumiLaboMockGlobalTabId,
    LumiLaboMockProjectTabId,
    LumiLaboMockProjectRegisterField,
    LumiLaboMockScreen,
    LumiLaboMockTab,
} from './types';

const projectTabIcons = {
    top: Home,
    register: FilePlus2,
    list: List,
} satisfies Record<LumiLaboMockProjectTabId, LucideIcon>;

type ProjectActionTabId = Exclude<LumiLaboMockProjectTabId, 'top'>;

type FileTagBarProps<TId extends string> = {
    tabs: readonly LumiLaboMockTab<TId>[];
    activeTabId: string;
    ariaLabel: string;
    onSelectTab: (tabId: TId) => void;
};

type ProjectEntryPanelProps = {
    onBack: () => void;
    onSelectProjectTab: (tabId: ProjectActionTabId) => void;
};

type BackActionProps = {
    onBack: () => void;
};

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
                    ariaLabel="案件内画面"
                    onSelectTab={setActiveProjectTabId}
                />
            ) : (
                <FileTagBar
                    tabs={lumiLaboGlobalTabs}
                    activeTabId={activeGlobalTabId}
                    ariaLabel="LumiLabo MOCK画面"
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

                {activeScreen === 'project' && activeProjectTabId === 'top' ? (
                    <ProjectEntryPanel
                        onBack={() => setActiveScreen('select')}
                        onSelectProjectTab={(tabId) =>
                            setActiveProjectTabId(tabId)
                        }
                    />
                ) : null}

                {activeScreen === 'project' && activeProjectTabId === 'register' ? (
                    <ProjectRegisterPanel
                        onBack={() => setActiveScreen('select')}
                    />
                ) : null}

                {activeScreen === 'project' && activeProjectTabId === 'list' ? (
                    <ProjectListPanel onBack={() => setActiveScreen('select')} />
                ) : null}
            </main>
        </article>
    );
}

function FileTagBar<TId extends string>({
    tabs,
    activeTabId,
    ariaLabel,
    onSelectTab,
}: FileTagBarProps<TId>) {
    return (
        <nav
            aria-label={ariaLabel}
            className="flex-none overflow-hidden border-b border-yellow-200 bg-[#fff7c7] px-2 pt-2"
        >
            <div className="flex gap-1 overflow-x-auto overscroll-x-contain">
                {tabs.map((tab) => {
                    const isActive = activeTabId === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            aria-pressed={isActive}
                            aria-current={isActive ? 'page' : undefined}
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
            <div className="mx-auto grid min-h-full w-full max-w-sm content-start justify-items-center gap-5 pt-8 sm:content-center sm:pt-0">
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
            <div className="mx-auto grid min-h-full w-full max-w-sm content-start gap-3 pt-8 sm:content-center sm:pt-0">
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
    onBack,
    onSelectProjectTab,
}: ProjectEntryPanelProps) {
    // モバイル縦は上寄せ、スマホ横は二列化して通常ボタンと戻るを見切れさせない。
    return (
        <section className="h-full min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-8 [@media(orientation:landscape)_and_(max-height:480px)]:py-3">
            <div className="mx-auto grid min-h-full w-full max-w-sm content-start justify-items-center gap-4 pt-6 sm:content-center sm:pt-0 [@media(orientation:landscape)_and_(max-height:480px)]:max-w-xl [@media(orientation:landscape)_and_(max-height:480px)]:content-center [@media(orientation:landscape)_and_(max-height:480px)]:grid-cols-[auto_minmax(0,1fr)] [@media(orientation:landscape)_and_(max-height:480px)]:items-center [@media(orientation:landscape)_and_(max-height:480px)]:justify-items-stretch [@media(orientation:landscape)_and_(max-height:480px)]:gap-x-3 [@media(orientation:landscape)_and_(max-height:480px)]:gap-y-2">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300 bg-yellow-100 text-yellow-900 shadow-sm shadow-yellow-900/10 [@media(orientation:landscape)_and_(max-height:480px)]:h-10 [@media(orientation:landscape)_and_(max-height:480px)]:w-10">
                    <Layers3 className="h-8 w-8 [@media(orientation:landscape)_and_(max-height:480px)]:h-5 [@media(orientation:landscape)_and_(max-height:480px)]:w-5" aria-hidden />
                </span>
                <h1 className="text-center text-3xl font-black leading-tight text-black [@media(orientation:landscape)_and_(max-height:480px)]:text-left [@media(orientation:landscape)_and_(max-height:480px)]:text-2xl">
                    {lumiLaboProjectItem.label}
                </h1>
                <div className="grid w-full gap-2 [@media(orientation:landscape)_and_(max-height:480px)]:col-span-2 [@media(orientation:landscape)_and_(max-height:480px)]:grid-cols-2 [@media(orientation:landscape)_and_(max-height:480px)]:gap-1.5">
                    {lumiLaboProjectActionTabs.map((tab) => {
                        const Icon = projectTabIcons[tab.id];

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={getProjectEntryButtonClasses()}
                                onClick={() => onSelectProjectTab(tab.id)}
                            >
                                <Icon className="h-5 w-5" aria-hidden />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px [@media(orientation:landscape)_and_(max-height:480px)]:col-span-2 [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10 [@media(orientation:landscape)_and_(max-height:480px)]:text-base"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                    <span>{lumiLaboProjectBackLabel}</span>
                </button>
            </div>
        </section>
    );
}

function ProjectListPanel({ onBack }: BackActionProps) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-4 py-4 [@media(orientation:landscape)_and_(max-height:480px)]:py-3 sm:px-6 sm:py-6">
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                <header className="grid gap-1">
                    <p className="text-sm font-black text-yellow-800">
                        {lumiLaboProjectItem.label}
                    </p>
                    <h1 className="text-2xl font-black leading-tight text-black sm:text-3xl">
                        案件一覧
                    </h1>
                </header>

                <div className="flex min-h-36 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-6 text-black">
                    <div className="grid justify-items-center gap-2">
                        <List className="h-8 w-8" aria-hidden />
                        <p className="text-lg font-black">案件一覧</p>
                    </div>
                </div>

                <div className="mt-auto grid gap-2 pt-1 sm:max-w-sm">
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectBackLabel}</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

function ProjectRegisterPanel({ onBack }: BackActionProps) {
    return (
        <section className="h-full min-h-0 overflow-y-auto px-4 py-4 [@media(orientation:landscape)_and_(max-height:480px)]:py-3 sm:px-6 sm:py-6">
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-4 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                <header className="grid gap-1">
                    <p className="text-sm font-black text-yellow-800">
                        {lumiLaboProjectItem.label}
                    </p>
                    <h1 className="text-2xl font-black leading-tight text-black sm:text-3xl">
                        {lumiLaboProjectRegisterPanel.title}
                    </h1>
                </header>

                <div className="grid gap-4 md:grid-cols-2 [@media(orientation:landscape)_and_(max-height:480px)]:gap-3">
                    {lumiLaboProjectRegisterPanel.fields.map((field) => (
                        <ProjectRegisterField key={field.id} field={field} />
                    ))}
                </div>

                <div className="mt-auto grid gap-2 pt-1 sm:max-w-sm">
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-yellow-600 bg-yellow-300 px-5 text-lg font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                    >
                        <FilePlus2 className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectRegisterPanel.primaryActionLabel}</span>
                    </button>
                    <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-lg font-black text-black transition hover:border-yellow-500 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" aria-hidden />
                        <span>{lumiLaboProjectBackLabel}</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

function ProjectRegisterField({
    field,
}: {
    field: LumiLaboMockProjectRegisterField;
}) {
    const controlId = `lumilabo-project-register-${field.id}`;
    return (
        <div
            className={classNames(
                'grid gap-2',
                field.control === 'textarea' ? 'md:col-span-2' : undefined,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <label
                    htmlFor={controlId}
                    className="text-base font-black text-black"
                >
                    {field.label}
                </label>
                <span
                    className={classNames(
                        'shrink-0 rounded-md border px-2 py-1 text-xs font-black',
                        field.requirementLabel === '必須'
                            ? 'border-yellow-500 bg-yellow-100 text-yellow-900'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-600',
                    )}
                >
                    {field.requirementLabel}
                </span>
            </div>

            {field.control === 'textarea' ? (
                <textarea
                    id={controlId}
                    name={field.id}
                    rows={field.rows}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className={classNames(
                        getProjectRegisterControlClasses(),
                        'resize-none leading-relaxed',
                    )}
                />
            ) : (
                <input
                    id={controlId}
                    name={field.id}
                    type="text"
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className={getProjectRegisterControlClasses()}
                />
            )}
        </div>
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

function getProjectEntryButtonClasses(): string {
    return 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-yellow-600 bg-yellow-300 px-5 text-lg font-black text-black shadow-sm shadow-yellow-900/20 transition hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 active:translate-y-px [@media(orientation:landscape)_and_(max-height:480px)]:min-h-10 [@media(orientation:landscape)_and_(max-height:480px)]:px-3 [@media(orientation:landscape)_and_(max-height:480px)]:text-base';
}

function getProjectRegisterControlClasses(): string {
    return 'min-h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-3 text-base font-semibold text-black placeholder:text-neutral-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300';
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
