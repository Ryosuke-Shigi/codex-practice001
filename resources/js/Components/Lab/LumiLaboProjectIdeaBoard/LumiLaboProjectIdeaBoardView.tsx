import type { LucideIcon } from 'lucide-react';
import {
    BookOpenText,
    ClipboardList,
    Code2,
    FileText,
    FolderKanban,
} from 'lucide-react';
import { useState } from 'react';

import {
    getIdeaBoardTabById,
    ideaBoardTabs,
    type IdeaBoardCard,
    type IdeaBoardTab,
    type IdeaBoardTabId,
    type IdeaBoardTone,
} from './ideaBoardData';

const tabIcons = {
    top: BookOpenText,
    project: FolderKanban,
    projectCreate: ClipboardList,
    projectList: FileText,
    coding: Code2,
} satisfies Record<IdeaBoardTabId, LucideIcon>;

export default function LumiLaboProjectIdeaBoardView() {
    const [activeTabId, setActiveTabId] =
        useState<IdeaBoardTabId>('top');
    const activeTab = getIdeaBoardTabById(activeTabId);

    return (
        <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-300 bg-white text-black shadow-xl shadow-neutral-900/10">
            <header className="flex-none border-b border-neutral-200 bg-white px-3 py-3 sm:px-4">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-yellow-800">IDEA BOARD</p>
                    <h1 className="mt-1 text-2xl font-semibold leading-tight text-black sm:text-3xl">
                        LumiLabo 案件システム IDEA BOARD
                    </h1>
                </div>
            </header>

            <TopTabBar activeTabId={activeTab.id} onSelectTab={setActiveTabId} />

            <div className="min-h-0 flex-1 overflow-hidden bg-neutral-50 p-2 sm:p-3">
                <TabPanel tab={activeTab} />
            </div>
        </article>
    );
}

function TopTabBar({
    activeTabId,
    onSelectTab,
}: {
    activeTabId: IdeaBoardTabId;
    onSelectTab: (tabId: IdeaBoardTabId) => void;
}) {
    return (
        <nav
            className="flex-none border-b border-neutral-200 bg-white px-2 py-2 sm:px-3"
            aria-label="LumiLabo 案件システム IDEA BOARD タブ"
        >
            <div className="grid gap-1.5 sm:grid-cols-5">
                {ideaBoardTabs.map((tab) => {
                    const Icon = tabIcons[tab.id];
                    const isActive = activeTabId === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={getTabButtonClasses(isActive)}
                            onClick={() => onSelectTab(tab.id)}
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <Icon className="h-5 w-5 flex-none" aria-hidden />
                                <span className="min-w-0 truncate">{tab.label}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

function TabPanel({ tab }: { tab: IdeaBoardTab }) {
    return (
        <section
            role="tabpanel"
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-black"
        >
            <div className="flex-none border-b border-neutral-200 bg-white px-3 py-3 sm:px-4">
                <div className="grid gap-1 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-end">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-yellow-800">{tab.kicker}</p>
                        <h2 className="mt-1 text-xl font-semibold leading-tight text-black sm:text-2xl">
                            {tab.title}
                        </h2>
                    </div>
                    <p className="text-base leading-7 text-neutral-800 lg:text-right">
                        {tab.lead}
                    </p>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
                <div className="grid gap-2 lg:grid-cols-2">
                    {tab.sections.map((section) => (
                        <section
                            key={section.title}
                            className="min-w-0 rounded-lg border border-neutral-200 bg-white"
                        >
                            <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                                <h3 className="text-lg font-semibold leading-tight text-black">
                                    {section.title}
                                </h3>
                                <p className="mt-1 text-base leading-7 text-neutral-800">
                                    {section.lead}
                                </p>
                            </div>

                            <div className="p-2 sm:p-3">
                                {section.cards ? (
                                    <CompactCardRows cards={section.cards} />
                                ) : null}

                                {section.items ? (
                                    <CompactItemList items={section.items} />
                                ) : null}

                                {section.note ? (
                                    <p className="mt-2 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold leading-6 text-amber-950">
                                        {section.note}
                                    </p>
                                ) : null}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CompactCardRows({ cards }: { cards: readonly IdeaBoardCard[] }) {
    return (
        <div className="overflow-hidden rounded-md border border-neutral-200">
            {cards.map((card, index) => {
                const toneClasses = getToneClasses(card.tone ?? 'slate');

                return (
                    <article
                        key={`${card.title}-${index}`}
                        className={classNames(
                            'grid min-w-0 gap-2 border-b border-neutral-200 px-3 py-2 last:border-b-0 md:grid-cols-[minmax(8rem,0.32fr)_minmax(0,1fr)] md:items-start',
                            toneClasses.panel,
                        )}
                    >
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold leading-7 text-black">
                                {card.title}
                            </h4>
                            {card.badge ? (
                                <span className={classNames('inline-flex min-h-7 items-center rounded-md border px-2 text-sm font-semibold', toneClasses.badge)}>
                                    {card.badge}
                                </span>
                            ) : null}
                        </div>
                        <p className="text-base leading-7 text-neutral-800">
                            {card.body}
                        </p>
                    </article>
                );
            })}
        </div>
    );
}

function CompactItemList({ items }: { items: readonly string[] }) {
    return (
        <ul className="grid gap-1.5 sm:grid-cols-2">
            {items.map((item) => (
                <li
                    key={item}
                    className="min-w-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-base leading-7 text-black"
                >
                    {item}
                </li>
            ))}
        </ul>
    );
}

function getTabButtonClasses(isActive: boolean): string {
    return classNames(
        'flex min-h-11 w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-left text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
        isActive
            ? 'border-yellow-700 bg-yellow-300 text-black shadow-md shadow-yellow-900/20 ring-2 ring-yellow-500'
            : 'border-neutral-200 bg-white text-neutral-800 hover:border-yellow-500 hover:bg-neutral-50',
    );
}

function getToneClasses(tone: IdeaBoardTone): {
    panel: string;
    badge: string;
} {
    const classes = {
        amber: {
            panel: 'bg-white',
            badge: 'border-amber-300 bg-white text-amber-950',
        },
        emerald: {
            panel: 'bg-white',
            badge: 'border-emerald-300 bg-white text-emerald-950',
        },
        lemon: {
            panel: 'bg-white',
            badge: 'border-yellow-300 bg-white text-yellow-950',
        },
        rose: {
            panel: 'bg-white',
            badge: 'border-rose-300 bg-white text-rose-950',
        },
        sky: {
            panel: 'bg-white',
            badge: 'border-sky-300 bg-white text-sky-950',
        },
        slate: {
            panel: 'bg-white',
            badge: 'border-neutral-300 bg-white text-neutral-900',
        },
    } satisfies Record<IdeaBoardTone, { panel: string; badge: string }>;

    return classes[tone];
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
