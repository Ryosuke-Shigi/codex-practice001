import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    BarChart3,
    BookOpenText,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Code2,
    CreditCard,
    GitBranch,
    PieChart,
} from 'lucide-react';

import MermaidDiagram from '@/Components/Common/Visualizations/Diagrams/MermaidDiagram';

import {
    codingModeIds,
    codingModeLabels,
    type CodingCalendarDay,
    type CodingElement,
    type CodingExampleCard,
    type CodingModeId,
    type CodingRow,
    type CodingSection,
    type CodingSectionMode,
    type CodingTone,
    type CodingWorkflowChart,
} from './codingIdeaBoardData';

const modeIcons = {
    overview: BookOpenText,
    elements: ClipboardList,
    workflow: GitBranch,
    example: CalendarDays,
} satisfies Record<CodingModeId, LucideIcon>;

export default function CodingIdeaBoardPanel({
    section,
    activeModeId,
    onSelectMode,
}: {
    section: CodingSection;
    activeModeId: CodingModeId;
    onSelectMode: (modeId: CodingModeId) => void;
}) {
    const activeMode = section.modes[activeModeId];

    return (
        <CodingModeContent
            section={section}
            mode={activeMode}
            activeModeId={activeModeId}
            onSelectMode={onSelectMode}
        />
    );
}

function ModeNavigator({
    activeModeId,
    onSelectMode,
}: {
    activeModeId: CodingModeId;
    onSelectMode: (modeId: CodingModeId) => void;
}) {
    return (
        <nav
            className="flex gap-1.5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1"
            aria-label="codingタブ表示モード"
        >
            {codingModeIds.map((modeId) => {
                const Icon = modeIcons[modeId];
                const isActive = modeId === activeModeId;

                return (
                    <button
                        key={modeId}
                        type="button"
                        className={getModeButtonClasses(
                            modeId,
                            isActive,
                        )}
                        aria-pressed={isActive}
                        onClick={() => onSelectMode(modeId)}
                    >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {codingModeLabels[modeId]}
                        {isActive ? (
                            <CheckCircle2
                                className="h-3.5 w-3.5"
                                aria-hidden
                            />
                        ) : null}
                    </button>
                );
            })}
        </nav>
    );
}

function CodingModeContent({
    section,
    mode,
    activeModeId,
    onSelectMode,
}: {
    section: CodingSection;
    mode: CodingSectionMode;
    activeModeId: CodingModeId;
    onSelectMode: (modeId: CodingModeId) => void;
}) {
    const toneClasses = getToneClasses(section.tone);

    return (
        <section
            className={classNames(
                'rounded-lg border p-3 text-slate-950 shadow-sm',
                toneClasses.panel,
            )}
        >
            <div className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-500">
                            {section.label} / {section.title}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-950">
                            {mode.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                            {mode.lead}
                        </p>
                    </div>
                    {mode.callout ? (
                        <aside className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-slate-950 sm:w-64">
                            <p className="text-xs font-semibold text-amber-800">
                                {mode.callout.label}
                            </p>
                            <p className="mt-1 text-sm leading-5 text-slate-800">
                                {mode.callout.detail}
                            </p>
                        </aside>
                    ) : null}
                </div>

                <ModeNavigator
                    activeModeId={activeModeId}
                    onSelectMode={onSelectMode}
                />
            </div>

            <PointGrid points={mode.points} />

            {mode.elements ? <ElementGrid elements={mode.elements} /> : null}
            {mode.rows ? <CodingRows rows={mode.rows} /> : null}
            {mode.workflows ? (
                <WorkflowStack workflows={mode.workflows} />
            ) : null}
            {mode.examples ? (
                <ExampleCards examples={mode.examples} />
            ) : null}
            {mode.calendarDays ? (
                <CalendarExample days={mode.calendarDays} />
            ) : null}
            {mode.codeLines ? <CodeLines lines={mode.codeLines} /> : null}
        </section>
    );
}

function PointGrid({ points }: { points: string[] }) {
    return (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {points.map((point) => (
                <div
                    key={point}
                    className="flex min-w-0 items-start gap-2 rounded-md border border-slate-200 bg-white p-3 text-slate-950 shadow-sm"
                >
                    <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-md bg-cyan-100 text-cyan-700">
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="text-sm leading-6 text-slate-800">
                        {point}
                    </p>
                </div>
            ))}
        </div>
    );
}

function ElementGrid({ elements }: { elements: CodingElement[] }) {
    return (
        <dl className="mt-3 grid gap-2 lg:grid-cols-2">
            {elements.map((element) => {
                const Icon = getElementIcon(element.name);

                return (
                    <div
                        key={element.name}
                        className="min-w-0 rounded-md border border-slate-200 bg-white p-3 text-slate-950 shadow-sm"
                    >
                        <dt className="flex min-w-0 items-center gap-2 font-mono text-xs font-semibold text-slate-950">
                            <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-md bg-sky-100 text-sky-700">
                                <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="truncate">{element.name}</span>
                        </dt>
                        <dd className="mt-2 text-sm leading-6 text-slate-700">
                            {element.detail}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}

function CodingRows({ rows }: { rows: CodingRow[] }) {
    return (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {rows.map((row) => {
                const toneClasses = getToneClasses(row.tone ?? 'neutral');
                const Icon = getToneIcon(row.tone ?? 'neutral');

                return (
                    <div
                        key={`${row.label}-${row.value}`}
                        className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[minmax(7rem,0.32fr)_minmax(0,1fr)]"
                    >
                        <div
                            className={classNames(
                                'flex min-w-0 items-center gap-2 px-3 py-2 text-sm font-semibold',
                                toneClasses.label,
                            )}
                        >
                            <span
                                className={classNames(
                                    'inline-flex h-7 w-7 flex-none items-center justify-center rounded-md',
                                    toneClasses.icon,
                                )}
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0 truncate">
                                {row.label}
                            </span>
                        </div>
                        <div className="min-w-0 px-3 py-2">
                            <p className="text-sm leading-6 text-slate-800">
                                {row.value}
                            </p>
                            {row.detail ? (
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                    {row.detail}
                                </p>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function WorkflowStack({
    workflows,
}: {
    workflows: CodingWorkflowChart[];
}) {
    return (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {workflows.map((workflow) => (
                <article
                    key={workflow.title}
                    className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 text-slate-950 shadow-sm"
                >
                    <p className="mb-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-950">
                        <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-md bg-violet-100 text-violet-700">
                            <GitBranch className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 truncate">
                            {workflow.title}
                        </span>
                    </p>
                    <MermaidDiagram
                        chart={workflow.chart}
                        className="min-w-0 [&>button]:!border-slate-200 [&>button]:!bg-white [&_svg]:mx-auto [&_svg]:!max-w-full"
                        previewMaxHeight="21rem"
                    />
                    <div className="mt-3 grid gap-2">
                        {workflow.notes.map((note) => (
                            <p
                                key={note}
                                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
                            >
                                {note}
                            </p>
                        ))}
                    </div>
                </article>
            ))}
        </div>
    );
}

function ExampleCards({ examples }: { examples: CodingExampleCard[] }) {
    return (
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {examples.map((example) => {
                const toneClasses = getToneClasses(example.tone ?? 'neutral');
                const Icon = getExampleIcon(example);

                return (
                    <article
                        key={`${example.label}-${example.title}`}
                        className={classNames(
                            'min-w-0 rounded-md border p-3 shadow-sm',
                            toneClasses.item,
                        )}
                    >
                        <div className="flex min-w-0 items-start gap-2">
                            <span
                                className={classNames(
                                    'inline-flex h-8 w-8 flex-none items-center justify-center rounded-md',
                                    toneClasses.icon,
                                )}
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-500">
                                    {example.label}
                                </p>
                                <h5 className="mt-1 text-sm font-semibold text-slate-950">
                                    {example.title}
                                </h5>
                            </div>
                        </div>
                        {example.amount ? (
                            <p className="mt-2 font-mono text-sm font-semibold text-slate-950">
                                amount {example.amount}
                            </p>
                        ) : null}
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                            {example.meta}
                        </p>
                    </article>
                );
            })}
        </div>
    );
}

function CalendarExample({ days }: { days: CodingCalendarDay[] }) {
    return (
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {days.map((day) => (
                <article
                    key={day.date}
                    className="min-w-0 rounded-md border border-slate-200 bg-white p-3 text-slate-950 shadow-sm"
                >
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                            <CalendarDays className="h-4 w-4" aria-hidden />
                        </span>
                        {day.date}
                    </p>
                    <div className="mt-3 grid gap-2">
                        {day.cards.map((card) => (
                            <div
                                key={`${day.date}-${card.type}-${card.title}-${card.role}`}
                                className={classNames(
                                    'min-w-0 rounded-md border px-2.5 py-2',
                                    getCalendarToneClasses(card.tone),
                                )}
                            >
                                <div className="flex min-w-0 items-center justify-between gap-2">
                                    <span className="text-xs font-semibold">
                                        {card.type}
                                    </span>
                                    <span className="font-mono text-xs font-semibold">
                                        {card.amount}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                                    {card.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    {card.role} / {card.tone}
                                </p>
                            </div>
                        ))}
                        {day.overflowLabel ? (
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-center text-xs font-semibold text-slate-700">
                                {day.overflowLabel}
                            </div>
                        ) : null}
                    </div>
                </article>
            ))}
        </div>
    );
}

function CodeLines({ lines }: { lines: string[] }) {
    return (
        <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-950 shadow-sm">
            <code>{lines.join('\n')}</code>
        </pre>
    );
}

function getModeButtonClasses(modeId: CodingModeId, isActive: boolean) {
    const styles = {
        overview: {
            active: 'border-sky-300 bg-sky-100 text-sky-950',
            idle: 'border-sky-200 bg-white text-sky-800 hover:bg-sky-50',
        },
        elements: {
            active: 'border-emerald-300 bg-emerald-100 text-emerald-950',
            idle: 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50',
        },
        workflow: {
            active: 'border-violet-300 bg-violet-100 text-violet-950',
            idle: 'border-violet-200 bg-white text-violet-800 hover:bg-violet-50',
        },
        example: {
            active: 'border-amber-300 bg-amber-100 text-amber-950',
            idle: 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50',
        },
    } satisfies Record<
        CodingModeId,
        { active: string; idle: string }
    >;

    return classNames(
        'inline-flex min-h-8 flex-none items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
        isActive ? styles[modeId].active : styles[modeId].idle,
    );
}

function getToneClasses(tone: CodingTone) {
    if (tone === 'income' || tone === 'success') {
        return {
            panel: 'border-emerald-200 bg-emerald-50',
            label: 'bg-emerald-50 text-emerald-950',
            item: 'border-emerald-200 bg-white text-slate-950',
            icon: 'bg-emerald-100 text-emerald-700',
        };
    }

    if (tone === 'expense') {
        return {
            panel: 'border-rose-200 bg-rose-50',
            label: 'bg-rose-50 text-rose-950',
            item: 'border-rose-200 bg-white text-slate-950',
            icon: 'bg-rose-100 text-rose-700',
        };
    }

    if (tone === 'billing' || tone === 'warning') {
        return {
            panel: 'border-amber-200 bg-amber-50',
            label: 'bg-amber-50 text-amber-950',
            item: 'border-amber-200 bg-white text-slate-950',
            icon: 'bg-amber-100 text-amber-700',
        };
    }

    if (tone === 'calendar') {
        return {
            panel: 'border-sky-200 bg-sky-50',
            label: 'bg-sky-50 text-sky-950',
            item: 'border-sky-200 bg-white text-slate-950',
            icon: 'bg-sky-100 text-sky-700',
        };
    }

    if (tone === 'caution') {
        return {
            panel: 'border-yellow-200 bg-yellow-50',
            label: 'bg-yellow-50 text-yellow-950',
            item: 'border-yellow-200 bg-white text-slate-950',
            icon: 'bg-yellow-100 text-yellow-700',
        };
    }

    return {
        panel: 'border-slate-200 bg-slate-50',
        label: 'bg-slate-50 text-slate-950',
        item: 'border-slate-200 bg-white text-slate-950',
        icon: 'bg-slate-100 text-slate-700',
    };
}

function getCalendarToneClasses(
    tone: CodingCalendarDay['cards'][number]['tone'],
) {
    if (tone === 'success') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-950';
    }

    if (tone === 'warning') {
        return 'border-amber-200 bg-amber-50 text-amber-950';
    }

    if (tone === 'caution') {
        return 'border-yellow-200 bg-yellow-50 text-yellow-950';
    }

    return 'border-sky-200 bg-sky-50 text-sky-950';
}

function getToneIcon(tone: CodingTone): LucideIcon {
    if (tone === 'expense' || tone === 'caution') {
        return AlertTriangle;
    }

    if (tone === 'income' || tone === 'success') {
        return CreditCard;
    }

    if (tone === 'billing' || tone === 'warning') {
        return ClipboardList;
    }

    if (tone === 'calendar') {
        return CalendarDays;
    }

    return CheckCircle2;
}

function getElementIcon(name: string): LucideIcon {
    const normalizedName = name.toLowerCase();

    if (normalizedName.includes('date') || normalizedName.includes('期日')) {
        return CalendarDays;
    }

    if (
        normalizedName.includes('amount') ||
        normalizedName.includes('金額')
    ) {
        return CreditCard;
    }

    if (
        normalizedName.includes('id') ||
        normalizedName.includes('key') ||
        normalizedName.includes('type')
    ) {
        return Code2;
    }

    return ClipboardList;
}

function getExampleIcon(example: CodingExampleCard): LucideIcon {
    if (example.amount) {
        return CreditCard;
    }

    if (example.title.includes('月') || example.meta.includes('集計')) {
        return BarChart3;
    }

    if (example.meta.includes('構成')) {
        return PieChart;
    }

    return CheckCircle2;
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
