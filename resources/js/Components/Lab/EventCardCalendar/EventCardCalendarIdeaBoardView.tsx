import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    BookOpenText,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Code2,
    CreditCard,
} from 'lucide-react';
import { useRef, useState, type RefObject } from 'react';

import CodingIdeaBoardPanel from './CodingIdeaBoardPanel';
import { IdeaBoardVisualPanel } from './IdeaBoardVisuals';
import {
    codingSections,
    type CodingModeId,
    type CodingSection,
} from './codingIdeaBoardData';
import {
    eventCardCalendarIdeaTabs,
    type EventCardCalendarTabId,
    type IdeaBoardBlockTone,
    type IdeaBoardTab,
    type IdeaBoardTopic,
} from './ideaBoardData';

const tabIcons = {
    concept: BookOpenText,
    events: CalendarClock,
    cards: CreditCard,
    coding: Code2,
    flow: ClipboardList,
    calendar: CalendarDays,
    visualization: BarChart3,
} satisfies Record<EventCardCalendarTabId, LucideIcon>;

const initialTopicByTab = eventCardCalendarIdeaTabs.reduce(
    (topics, tab) => ({
        ...topics,
        [tab.id]: tab.topics[0].id,
    }),
    {} as Record<EventCardCalendarTabId, string>,
);

const initialCodingModeBySection = codingSections.reduce(
    (modes, section) => ({
        ...modes,
        [section.id]: 'overview',
    }),
    {} as Record<CodingSection['id'], CodingModeId>,
);

export default function EventCardCalendarIdeaBoardView() {
    const [activeTabId, setActiveTabId] =
        useState<EventCardCalendarTabId>('concept');
    const [activeTopicByTab, setActiveTopicByTab] =
        useState(initialTopicByTab);
    const [activeCodingModeBySection, setActiveCodingModeBySection] =
        useState(initialCodingModeBySection);
    const topicNavRef = useRef<HTMLDivElement>(null);

    const activeTab =
        eventCardCalendarIdeaTabs.find((tab) => tab.id === activeTabId) ??
        eventCardCalendarIdeaTabs[0];
    const activeTopic =
        activeTab.topics.find(
            (topic) => topic.id === activeTopicByTab[activeTab.id],
        ) ?? activeTab.topics[0];
    const activeCodingSection =
        codingSections.find((section) => section.id === activeTopic.id) ??
        codingSections[0];

    const handleTopicSelect = (topicId: string) => {
        setActiveTopicByTab((current) => ({
            ...current,
            [activeTab.id]: topicId,
        }));
    };

    const handleCodingModeSelect = (modeId: CodingModeId) => {
        setActiveCodingModeBySection((current) => ({
            ...current,
            [activeCodingSection.id]: modeId,
        }));
    };

    return (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/14 bg-slate-950/82 text-slate-100 shadow-2xl shadow-black/35">
            <TopTabBar
                activeTabId={activeTab.id}
                onSelectTab={setActiveTabId}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TopicNavigator
                    activeTab={activeTab}
                    activeTopic={activeTopic}
                    onSelectTopic={handleTopicSelect}
                    topicNavRef={topicNavRef}
                />

                <div className="min-h-0 flex-1 p-2 pt-0">
                    <TopicContent
                        activeTab={activeTab}
                        activeTopic={activeTopic}
                        activeCodingSection={activeCodingSection}
                        activeCodingModeId={
                            activeCodingModeBySection[activeCodingSection.id]
                        }
                        onSelectCodingMode={handleCodingModeSelect}
                    />
                </div>
            </div>
        </section>
    );
}

function TopTabBar({
    activeTabId,
    onSelectTab,
}: {
    activeTabId: EventCardCalendarTabId;
    onSelectTab: (tabId: EventCardCalendarTabId) => void;
}) {
    return (
        <nav
            className="flex flex-none gap-1.5 overflow-x-auto border-b border-white/10 px-2 py-1"
            aria-label="イベント・カードカレンダー IDEA BOARD 上位タブ"
        >
            {eventCardCalendarIdeaTabs.map((tab) => {
                const Icon = tabIcons[tab.id];
                const isActive = tab.id === activeTabId;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        className={getTabButtonClasses(tab.id, isActive)}
                        aria-pressed={isActive}
                        onClick={() => onSelectTab(tab.id)}
                    >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}

function TopicNavigator({
    activeTab,
    activeTopic,
    onSelectTopic,
    topicNavRef,
}: {
    activeTab: IdeaBoardTab;
    activeTopic: IdeaBoardTopic;
    onSelectTopic: (topicId: string) => void;
    topicNavRef: RefObject<HTMLDivElement | null>;
}) {
    return (
        <aside className="flex-none border-b border-white/10 bg-white/5 px-2 py-1.5">
            <div
                ref={topicNavRef}
                tabIndex={-1}
                className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 outline-none"
                aria-label={`${activeTab.label}の目次ボタン`}
            >
                {activeTab.topics.map((topic) => {
                    const isActive = topic.id === activeTopic.id;

                    return (
                        <button
                            key={topic.id}
                            type="button"
                            className={getTopicButtonClasses(
                                activeTab.id,
                                topic.id,
                                isActive,
                            )}
                            aria-pressed={isActive}
                            onClick={() => onSelectTopic(topic.id)}
                        >
                            <span className="min-w-0 truncate">
                                {topic.label}
                            </span>
                            {isActive ? (
                                <CheckCircle2
                                    className="h-3.5 w-3.5 flex-none"
                                    aria-hidden
                                />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

function TopicContent({
    activeTab,
    activeTopic,
    activeCodingSection,
    activeCodingModeId,
    onSelectCodingMode,
}: {
    activeTab: IdeaBoardTab;
    activeTopic: IdeaBoardTopic;
    activeCodingSection: CodingSection;
    activeCodingModeId: CodingModeId;
    onSelectCodingMode: (modeId: CodingModeId) => void;
}) {
    return (
        <article
            className={classNames(
                'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border',
                activeTab.id === 'coding'
                    ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
                    : 'border-white/12 bg-slate-900/68',
            )}
        >
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
                <div className="grid gap-3">
                    {activeTab.id === 'coding' ? (
                        <CodingIdeaBoardPanel
                            section={activeCodingSection}
                            activeModeId={activeCodingModeId}
                            onSelectMode={onSelectCodingMode}
                        />
                    ) : (
                        <>
                            <TabSummaryPanel
                                label={activeTab.label}
                                summary={activeTab.summary}
                            />

                            <IdeaBoardVisualPanel
                                topicId={activeTopic.id}
                                visualKind={activeTab.visualKind}
                            />

                            <section className="rounded-lg border border-white/12 bg-slate-950/46 p-3">
                                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                                    <div className="min-w-0">
                                        <h4 className="text-lg font-semibold text-white">
                                            {activeTopic.title}
                                        </h4>
                                        <p className="mt-2 text-sm leading-6 text-slate-200/84">
                                            {activeTopic.lead}
                                        </p>
                                    </div>
                                    {activeTopic.callout ? (
                                        <TopicCallout
                                            callout={activeTopic.callout}
                                        />
                                    ) : null}
                                </div>

                                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                                    {activeTopic.points.map((point) => (
                                        <div
                                            key={point}
                                            className="flex min-w-0 items-start gap-2 rounded-md border border-white/10 bg-white/6 p-2"
                                        >
                                            <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-md bg-emerald-200" />
                                            <p className="text-sm leading-6 text-slate-100/88">
                                                {point}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {activeTopic.blocks?.map((block) => {
                                const toneClasses = getBlockToneClasses(
                                    block.tone,
                                );

                                return (
                                    <section
                                        key={block.title}
                                        className={classNames(
                                            'rounded-lg border p-3',
                                            toneClasses.section,
                                        )}
                                    >
                                        <h4
                                            className={classNames(
                                                'text-base font-semibold',
                                                toneClasses.title,
                                            )}
                                        >
                                            {block.title}
                                        </h4>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                            {block.items.map((item) => (
                                                <div
                                                    key={item}
                                                    className={classNames(
                                                        'rounded-md border px-3 py-2 text-sm leading-6 text-slate-100/84',
                                                        toneClasses.item,
                                                    )}
                                                >
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

function TabSummaryPanel({
    label,
    summary,
}: {
    label: string;
    summary: string;
}) {
    return (
        <section className="rounded-lg border border-emerald-200/16 bg-emerald-300/8 px-3 py-2">
            <p className="text-xs font-semibold text-emerald-100/82">
                {label}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-100/84">
                {summary}
            </p>
        </section>
    );
}

function TopicCallout({
    callout,
}: {
    callout: NonNullable<IdeaBoardTopic['callout']>;
}) {
    return (
        <aside className="rounded-md border border-amber-200/22 bg-amber-300/10 px-3 py-2 sm:w-64">
            <p className="text-xs font-semibold text-amber-100/82">
                {callout.label}
            </p>
            <p className="mt-1 text-sm leading-5 text-white/88">
                {callout.detail}
            </p>
        </aside>
    );
}

function getTabButtonClasses(
    tabId: EventCardCalendarTabId,
    isActive: boolean,
) {
    return getToneButtonClasses(
        getTabTone(tabId),
        isActive,
        'inline-flex min-h-8 flex-none items-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300',
    );
}

function getTopicButtonClasses(
    tabId: EventCardCalendarTabId,
    topicId: string,
    isActive: boolean,
) {
    return getToneButtonClasses(
        getTopicTone(tabId, topicId),
        isActive,
        'flex min-h-8 w-28 flex-none items-center justify-between gap-1.5 rounded-md border px-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:w-36',
    );
}

type ButtonTone =
    | 'emerald'
    | 'sky'
    | 'violet'
    | 'amber'
    | 'cyan'
    | 'blue'
    | 'rose';

function getTabTone(tabId: EventCardCalendarTabId) {
    const tones = {
        concept: 'emerald',
        events: 'sky',
        cards: 'violet',
        coding: 'amber',
        flow: 'cyan',
        calendar: 'blue',
        visualization: 'rose',
    } as const satisfies Record<EventCardCalendarTabId, ButtonTone>;

    return tones[tabId];
}

function getTopicTone(tabId: EventCardCalendarTabId, topicId: string) {
    if (tabId !== 'coding') {
        return getTabTone(tabId);
    }

    const tones: Partial<Record<string, ButtonTone>> = {
        core: 'sky',
        income: 'emerald',
        expense: 'rose',
        billing: 'amber',
        calendar: 'blue',
    };

    return tones[topicId] ?? 'amber';
}

function getToneButtonClasses(
    tone: ButtonTone,
    isActive: boolean,
    base: string,
) {
    const styles = {
        emerald: {
            active: 'border-emerald-300 bg-emerald-100 text-emerald-950',
            idle: 'border-emerald-200/70 bg-emerald-50/10 text-emerald-50 hover:bg-emerald-100 hover:text-emerald-950',
        },
        sky: {
            active: 'border-sky-300 bg-sky-100 text-sky-950',
            idle: 'border-sky-200/70 bg-sky-50/10 text-sky-50 hover:bg-sky-100 hover:text-sky-950',
        },
        violet: {
            active: 'border-violet-300 bg-violet-100 text-violet-950',
            idle: 'border-violet-200/70 bg-violet-50/10 text-violet-50 hover:bg-violet-100 hover:text-violet-950',
        },
        amber: {
            active: 'border-amber-300 bg-amber-100 text-amber-950',
            idle: 'border-amber-200/70 bg-amber-50/10 text-amber-50 hover:bg-amber-100 hover:text-amber-950',
        },
        cyan: {
            active: 'border-cyan-300 bg-cyan-100 text-cyan-950',
            idle: 'border-cyan-200/70 bg-cyan-50/10 text-cyan-50 hover:bg-cyan-100 hover:text-cyan-950',
        },
        blue: {
            active: 'border-blue-300 bg-blue-100 text-blue-950',
            idle: 'border-blue-200/70 bg-blue-50/10 text-blue-50 hover:bg-blue-100 hover:text-blue-950',
        },
        rose: {
            active: 'border-rose-300 bg-rose-100 text-rose-950',
            idle: 'border-rose-200/70 bg-rose-50/10 text-rose-50 hover:bg-rose-100 hover:text-rose-950',
        },
    } satisfies Record<ButtonTone, { active: string; idle: string }>;

    return classNames(base, isActive ? styles[tone].active : styles[tone].idle);
}

function getBlockToneClasses(tone: IdeaBoardBlockTone = 'neutral') {
    if (tone === 'income') {
        return {
            section: 'border-emerald-200/18 bg-emerald-300/8',
            title: 'text-emerald-50',
            item: 'border-emerald-100/14 bg-emerald-950/22',
        };
    }

    if (tone === 'expense') {
        return {
            section: 'border-rose-200/18 bg-rose-300/8',
            title: 'text-rose-50',
            item: 'border-rose-100/14 bg-rose-950/20',
        };
    }

    if (tone === 'invoice') {
        return {
            section: 'border-amber-200/18 bg-amber-300/8',
            title: 'text-amber-50',
            item: 'border-amber-100/14 bg-amber-950/20',
        };
    }

    if (tone === 'event') {
        return {
            section: 'border-sky-200/18 bg-sky-300/8',
            title: 'text-sky-50',
            item: 'border-sky-100/14 bg-sky-950/20',
        };
    }

    if (tone === 'link') {
        return {
            section: 'border-violet-200/18 bg-violet-300/8',
            title: 'text-violet-50',
            item: 'border-violet-100/14 bg-violet-950/20',
        };
    }

    return {
        section: 'border-cyan-200/18 bg-cyan-300/8',
        title: 'text-cyan-50',
        item: 'border-cyan-100/14 bg-slate-950/34',
    };
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
