import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    BookOpenText,
    ClipboardList,
    Code2,
    FileText,
    FolderKanban,
    GitBranch,
    Network,
} from 'lucide-react';
import { useState } from 'react';

import {
    getIdeaBoardTagById,
    getIdeaBoardTabById,
    ideaBoardTabs,
    initialActiveTagIds,
    type IdeaBoardBlock,
    type IdeaBoardCard,
    type IdeaBoardFlowStep,
    type IdeaBoardGraphBar,
    type IdeaBoardTab,
    type IdeaBoardTabId,
    type IdeaBoardTag,
    type IdeaBoardTone,
} from './ideaBoardData';

const tabIcons = {
    overview: BookOpenText,
    flow: GitBranch,
    feature: ClipboardList,
    screens: FileText,
    diagram: Network,
    graph: BarChart3,
    code: Code2,
} satisfies Record<IdeaBoardTabId, LucideIcon>;

// 表示ComponentはタブとタグのUI状態だけを担当し、案件の業務判断は扱わない。
export default function LumiLabProjectIdeaBoardView() {
    const [activeTabId, setActiveTabId] =
        useState<IdeaBoardTabId>('overview');
    const [activeTagIds, setActiveTagIds] =
        useState<Record<IdeaBoardTabId, string>>(initialActiveTagIds);
    const activeTab = getIdeaBoardTabById(activeTabId);
    const activeTag = getIdeaBoardTagById(
        activeTab.id,
        activeTagIds[activeTab.id],
    );

    return (
        <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-300 bg-white text-black shadow-xl shadow-neutral-900/10">
            <header className="flex flex-none items-center gap-3 border-b border-yellow-200 bg-white px-3 py-2 [@media(max-height:480px)]:py-1 sm:px-4 sm:py-3">
                <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-yellow-300 bg-yellow-100 text-yellow-900">
                    <FolderKanban className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-yellow-800 [@media(max-height:480px)]:sr-only">
                        LumiLab / ルミラボ IDEA BOARD
                    </p>
                    <h1 className="mt-1 text-xl font-semibold leading-tight text-black [@media(max-height:480px)]:text-lg sm:text-3xl">
                        LumiLab 案件システム IDEA BOARD
                    </h1>
                </div>
            </header>

            <TopTabBar activeTabId={activeTab.id} onSelectTab={setActiveTabId} />

            <FileTagBar
                activeTagId={activeTag.id}
                tab={activeTab}
                onSelectTag={(tagId) =>
                    setActiveTagIds((current) => ({
                        ...current,
                        [activeTab.id]: tagId,
                    }))
                }
            />

            <div className="min-h-0 flex-1 overflow-hidden bg-neutral-50 p-2 sm:p-3">
                <TabPanel tab={activeTab} tag={activeTag} />
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
            className="flex-none overflow-hidden border-b border-neutral-200 bg-white px-2 py-1.5 [@media(max-height:480px)]:py-1 sm:px-3 sm:py-2"
            aria-label="LumiLab 案件システム IDEA BOARD 上位タブ"
        >
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 sm:grid sm:grid-cols-4 sm:gap-1.5 sm:overflow-visible sm:pb-0 lg:grid-cols-7">
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
                            <span className="flex min-w-0 items-center justify-center gap-2 whitespace-nowrap">
                                <Icon className="h-5 w-5 flex-none" aria-hidden />
                                <span>{tab.label}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

function FileTagBar({
    activeTagId,
    tab,
    onSelectTag,
}: {
    activeTagId: string;
    tab: IdeaBoardTab;
    onSelectTag: (tagId: string) => void;
}) {
    return (
        <nav
            className="flex-none overflow-hidden border-b border-neutral-200 bg-yellow-50 px-2 pt-1.5 sm:px-3"
            aria-label={`${tab.label} 内の薄いファイルタグ`}
        >
            <div className="flex gap-1 overflow-x-auto overscroll-x-contain pb-0">
                {tab.tags.map((tag) => {
                    const isActive = activeTagId === tag.id;

                    return (
                        <button
                            key={tag.id}
                            type="button"
                            aria-pressed={isActive}
                            className={getFileTagClasses(isActive)}
                            onClick={() => onSelectTag(tag.id)}
                        >
                            {tag.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

function TabPanel({ tab, tag }: { tab: IdeaBoardTab; tag: IdeaBoardTag }) {
    return (
        <section
            role="tabpanel"
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-black"
        >
            <div className="flex-none border-b border-neutral-200 bg-white px-3 py-2 [@media(max-height:480px)]:py-1 sm:px-4 sm:py-3">
                <p className="text-sm font-semibold text-yellow-800">{tab.kicker}</p>
                <h2 className="mt-1 text-lg font-semibold leading-tight text-black sm:text-2xl">
                    {tag.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-700 sm:text-base sm:leading-7">
                    {tag.lead}
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                <p className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm leading-6 text-neutral-800 sm:text-base sm:leading-7">
                    {tab.lead}
                </p>
                <div className="space-y-4">
                    {tag.blocks.map((block) => (
                        <ContentBlock key={`${tag.id}-${block.title}`} block={block} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ContentBlock({ block }: { block: IdeaBoardBlock }) {
    return (
        <section className="border-b border-neutral-200 pb-4 last:border-b-0 last:pb-0">
            <div className="mb-3">
                <h3 className="text-lg font-semibold leading-tight text-black">
                    {block.title}
                </h3>
                <p className="mt-1 text-base leading-7 text-neutral-800">
                    {block.lead}
                </p>
            </div>

            {block.type === 'cards' ? <CardGrid cards={block.cards} /> : null}
            {block.type === 'list' ? <ItemList items={block.items} /> : null}
            {block.type === 'flow' ? <FlowChart steps={block.steps} /> : null}
            {block.type === 'diagram' ? <Diagram groups={block.groups} /> : null}
            {block.type === 'graph' ? (
                <ConceptGraph caption={block.caption} bars={block.bars} />
            ) : null}
            {block.type === 'screens' ? <ScreenList screens={block.screens} /> : null}
            {block.type === 'code' ? <CodeNotes notes={block.notes} /> : null}

            {block.note ? (
                <p className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold leading-6 text-amber-950">
                    {block.note}
                </p>
            ) : null}
        </section>
    );
}

function CardGrid({ cards }: { cards: readonly IdeaBoardCard[] }) {
    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
                const toneClasses = getToneClasses(card.tone ?? 'slate');

                return (
                    <article
                        key={card.title}
                        className={classNames(
                            'min-w-0 rounded-md border bg-white p-3',
                            toneClasses.border,
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
                        <p className="mt-2 text-base leading-7 text-neutral-800">
                            {card.body}
                        </p>
                    </article>
                );
            })}
        </div>
    );
}

function ItemList({ items }: { items: readonly string[] }) {
    return (
        <ul className="grid gap-2 md:grid-cols-2">
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

function FlowChart({ steps }: { steps: readonly IdeaBoardFlowStep[] }) {
    return (
        <ol className="grid gap-2">
            {steps.map((step, index) => (
                <li key={step.label} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_2rem] sm:items-center">
                    <FlowStep step={step} index={index} />
                    {index < steps.length - 1 ? (
                        <span className="hidden text-center text-xl font-semibold text-yellow-700 sm:block" aria-hidden>
                            ↓
                        </span>
                    ) : null}
                </li>
            ))}
        </ol>
    );
}

function FlowStep({ step, index }: { step: IdeaBoardFlowStep; index: number }) {
    const toneClasses = getToneClasses(step.state === 'candidate' ? 'amber' : 'lemon');

    return (
        <article className={classNames('rounded-md border bg-white p-3', toneClasses.border)}>
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-yellow-200 text-sm font-semibold text-black">
                    {index + 1}
                </span>
                <h4 className="text-base font-semibold leading-7 text-black">
                    {step.label}
                </h4>
                {step.badge ? (
                    <span className={classNames('inline-flex min-h-7 items-center rounded-md border px-2 text-sm font-semibold', toneClasses.badge)}>
                        {step.badge}
                    </span>
                ) : null}
            </div>
            <p className="mt-2 text-base leading-7 text-neutral-800">
                {step.description}
            </p>
        </article>
    );
}

function Diagram({ groups }: { groups: readonly { title: string; description: string; nodes: readonly IdeaBoardCard[] }[] }) {
    return (
        <div className="grid gap-3 lg:grid-cols-2">
            {groups.map((group) => (
                <section key={group.title} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                    <h4 className="text-base font-semibold leading-7 text-black">
                        {group.title}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-neutral-700 sm:text-base sm:leading-7">
                        {group.description}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {group.nodes.map((node) => {
                            const toneClasses = getToneClasses(node.tone ?? 'slate');

                            return (
                                <article
                                    key={node.title}
                                    className={classNames('rounded-md border bg-white p-3', toneClasses.border)}
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h5 className="text-base font-semibold leading-7 text-black">
                                            {node.title}
                                        </h5>
                                        {node.badge ? (
                                            <span className={classNames('inline-flex min-h-7 items-center rounded-md border px-2 text-sm font-semibold', toneClasses.badge)}>
                                                {node.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-neutral-800 sm:text-base sm:leading-7">
                                        {node.body}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}

function ConceptGraph({
    caption,
    bars,
}: {
    caption: string;
    bars: readonly IdeaBoardGraphBar[];
}) {
    return (
        <div className="rounded-md border border-neutral-200 bg-white p-3">
            <p className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm font-semibold leading-6 text-neutral-800">
                {caption}
            </p>
            <div className="mt-3 grid gap-3">
                {bars.map((bar) => {
                    const toneClasses = getToneClasses(bar.tone ?? 'slate');
                    const style = { width: `${bar.value}%` } satisfies CSSProperties;

                    return (
                        <div key={bar.label} className="grid gap-1.5">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="text-base font-semibold leading-7 text-black">
                                    {bar.label}
                                </h4>
                                <span className="text-sm font-semibold text-neutral-600">
                                    イメージ
                                </span>
                            </div>
                            <div className="h-4 overflow-hidden rounded-md bg-neutral-100" aria-hidden>
                                <div className={classNames('h-full rounded-md', toneClasses.bar)} style={style} />
                            </div>
                            <p className="text-sm leading-6 text-neutral-700 sm:text-base sm:leading-7">
                                {bar.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ScreenList({ screens }: { screens: readonly { title: string; role: string; mockFocus: readonly string[]; boundary: string }[] }) {
    return (
        <div className="grid gap-2 lg:grid-cols-2">
            {screens.map((screen) => (
                <article key={screen.title} className="rounded-md border border-neutral-200 bg-white p-3">
                    <h4 className="text-base font-semibold leading-7 text-black">
                        {screen.title}
                    </h4>
                    <p className="mt-2 text-base leading-7 text-neutral-800">
                        {screen.role}
                    </p>
                    <ul className="mt-3 grid gap-1.5">
                        {screen.mockFocus.map((focus) => (
                            <li key={focus} className="rounded-md bg-yellow-50 px-3 py-2 text-sm leading-6 text-neutral-800 sm:text-base sm:leading-7">
                                {focus}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold leading-6 text-neutral-800">
                        {screen.boundary}
                    </p>
                </article>
            ))}
        </div>
    );
}

function CodeNotes({ notes }: { notes: readonly { title: string; description: string; items: readonly string[] }[] }) {
    return (
        <div className="grid gap-2 lg:grid-cols-3">
            {notes.map((note) => (
                <article key={note.title} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                    <h4 className="text-base font-semibold leading-7 text-black">
                        {note.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-neutral-700 sm:text-base sm:leading-7">
                        {note.description}
                    </p>
                    <ul className="mt-3 grid gap-1.5">
                        {note.items.map((item) => (
                            <li key={item} className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-neutral-800 sm:text-base sm:leading-7">
                                {item}
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </div>
    );
}

function getTabButtonClasses(isActive: boolean): string {
    return classNames(
        'flex min-h-11 min-w-32 flex-none items-center justify-center gap-2 rounded-md border px-3 py-2 text-left text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 [@media(max-height:480px)]:min-h-10 sm:w-full sm:min-w-0',
        isActive
            ? 'border-yellow-700 bg-yellow-300 text-black shadow-md shadow-yellow-900/20 ring-2 ring-yellow-500'
            : 'border-neutral-200 bg-white text-neutral-800 hover:border-yellow-500 hover:bg-neutral-50',
    );
}

function getFileTagClasses(isActive: boolean): string {
    return classNames(
        'min-h-8 min-w-24 flex-none rounded-t-md border border-b-0 px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
        isActive
            ? 'border-yellow-400 bg-white text-black shadow-sm'
            : 'border-yellow-200 bg-yellow-100 text-yellow-950 hover:bg-yellow-50',
    );
}

function getToneClasses(tone: IdeaBoardTone): {
    border: string;
    badge: string;
    bar: string;
} {
    const classes = {
        amber: {
            border: 'border-amber-300',
            badge: 'border-amber-300 bg-white text-amber-950',
            bar: 'bg-amber-400',
        },
        emerald: {
            border: 'border-emerald-300',
            badge: 'border-emerald-300 bg-white text-emerald-950',
            bar: 'bg-emerald-500',
        },
        lemon: {
            border: 'border-yellow-300',
            badge: 'border-yellow-300 bg-white text-yellow-950',
            bar: 'bg-yellow-400',
        },
        rose: {
            border: 'border-rose-300',
            badge: 'border-rose-300 bg-white text-rose-950',
            bar: 'bg-rose-400',
        },
        sky: {
            border: 'border-sky-300',
            badge: 'border-sky-300 bg-white text-sky-950',
            bar: 'bg-sky-400',
        },
        slate: {
            border: 'border-neutral-300',
            badge: 'border-neutral-300 bg-white text-neutral-900',
            bar: 'bg-neutral-400',
        },
    } satisfies Record<IdeaBoardTone, { border: string; badge: string; bar: string }>;

    return classes[tone];
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
