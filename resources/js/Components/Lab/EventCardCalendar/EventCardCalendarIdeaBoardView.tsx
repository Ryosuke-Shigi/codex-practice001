import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    BookOpenText,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    CreditCard,
} from 'lucide-react';
import { useRef, useState, type RefObject } from 'react';

import {
    eventCardCalendarIdeaTabs,
    type EventCardCalendarTabId,
    type IdeaBoardTab,
    type IdeaBoardTopic,
} from './ideaBoardData';

const tabIcons = {
    concept: BookOpenText,
    events: CalendarClock,
    cards: CreditCard,
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

export default function EventCardCalendarIdeaBoardView() {
    const [activeTabId, setActiveTabId] =
        useState<EventCardCalendarTabId>('concept');
    const [activeTopicByTab, setActiveTopicByTab] =
        useState(initialTopicByTab);
    const topicNavRef = useRef<HTMLDivElement>(null);

    const activeTab =
        eventCardCalendarIdeaTabs.find((tab) => tab.id === activeTabId) ??
        eventCardCalendarIdeaTabs[0];
    const activeTopic =
        activeTab.topics.find(
            (topic) => topic.id === activeTopicByTab[activeTab.id],
        ) ?? activeTab.topics[0];

    const handleTopicSelect = (topicId: string) => {
        setActiveTopicByTab((current) => ({
            ...current,
            [activeTab.id]: topicId,
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
                    <TopicContent activeTopic={activeTopic} />
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
            aria-label="Eventカードカレンダー IDEA BOARD 上位タブ"
        >
            {eventCardCalendarIdeaTabs.map((tab) => {
                const Icon = tabIcons[tab.id];
                const isActive = tab.id === activeTabId;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        className={classNames(
                            'inline-flex min-h-8 flex-none items-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100',
                            isActive
                                ? 'border-emerald-200/70 bg-emerald-200/18 text-white'
                                : 'border-white/12 bg-white/6 text-slate-200 hover:bg-white/12',
                        )}
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
                            className={classNames(
                                'flex min-h-8 w-28 flex-none items-center justify-between gap-1.5 rounded-md border px-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 sm:w-36',
                                isActive
                                    ? 'border-cyan-200/70 bg-cyan-200/16 text-white'
                                    : 'border-white/12 bg-slate-950/26 text-slate-200 hover:bg-white/10',
                            )}
                            aria-pressed={isActive}
                            onClick={() => onSelectTopic(topic.id)}
                        >
                            <span className="min-w-0 truncate">
                                {topic.label}
                            </span>
                            {isActive ? (
                                <CheckCircle2
                                    className="h-3.5 w-3.5 flex-none text-cyan-100"
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

function TopicContent({ activeTopic }: { activeTopic: IdeaBoardTopic }) {
    const visiblePoints = activeTopic.points.slice(0, 2);
    const visibleBlocks = activeTopic.blocks?.slice(0, 1);

    return (
        <article className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-white/12 bg-slate-900/68">
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
                <div className="grid gap-3">
                    <section className="rounded-lg border border-white/12 bg-slate-950/46 p-3">
                        <h4 className="text-lg font-semibold text-white">
                            {activeTopic.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-200/84">
                            {activeTopic.lead}
                        </p>

                        <div className="mt-3 grid gap-2">
                            {visiblePoints.map((point) => (
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

                    {visibleBlocks?.map((block) => (
                        <section
                            key={block.title}
                            className="rounded-lg border border-cyan-200/18 bg-cyan-300/8 p-3"
                        >
                            <h4 className="text-base font-semibold text-cyan-50">
                                {block.title}
                            </h4>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {block.items.slice(0, 4).map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-md border border-cyan-100/14 bg-slate-950/34 px-3 py-2 text-sm leading-6 text-slate-100/84"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </article>
    );
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
