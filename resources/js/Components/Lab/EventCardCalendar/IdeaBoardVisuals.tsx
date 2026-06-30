import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    CreditCard,
    FileCheck2,
    Hammer,
    Handshake,
    MapPin,
    PackageCheck,
    PieChart,
    ReceiptText,
    Truck,
    Wallet,
    Wrench,
} from 'lucide-react';

import type { IdeaBoardVisualKind } from './ideaBoardData';

type VisualPanelProps = {
    topicId: string;
    visualKind: IdeaBoardVisualKind;
};

type Tone = {
    card: string;
    badge: string;
    icon: string;
};

const conceptFlowSteps: Array<{
    title: string;
    detail: string;
    Icon: LucideIcon;
    tone: Tone;
}> = [
    {
        title: 'Event',
        detail: '訪問 / 施工 / 納品',
        Icon: CalendarDays,
        tone: {
            card: 'border-sky-200/24 bg-sky-300/10',
            badge: 'bg-sky-200/16 text-sky-50',
            icon: 'text-sky-100',
        },
    },
    {
        title: '追加UI',
        detail: '条件と生成予定',
        Icon: ClipboardList,
        tone: {
            card: 'border-emerald-200/24 bg-emerald-300/10',
            badge: 'bg-emerald-200/16 text-emerald-50',
            icon: 'text-emerald-100',
        },
    },
    {
        title: '収支カード',
        detail: '請求 / 入金 / 出金',
        Icon: CreditCard,
        tone: {
            card: 'border-amber-200/26 bg-amber-300/10',
            badge: 'bg-amber-200/16 text-amber-50',
            icon: 'text-amber-100',
        },
    },
    {
        title: 'カレンダー',
        detail: '日付軸で見る',
        Icon: CalendarDays,
        tone: {
            card: 'border-cyan-200/24 bg-cyan-300/10',
            badge: 'bg-cyan-200/16 text-cyan-50',
            icon: 'text-cyan-100',
        },
    },
    {
        title: '可視化',
        detail: '集計と差分',
        Icon: BarChart3,
        tone: {
            card: 'border-rose-200/24 bg-rose-300/10',
            badge: 'bg-rose-200/16 text-rose-50',
            icon: 'text-rose-100',
        },
    },
];

const eventExamples: Array<{
    title: string;
    detail: string;
    Icon: LucideIcon;
    accent: string;
}> = [
    {
        title: '訪問',
        detail: 'A社 訪問予定',
        Icon: MapPin,
        accent: 'border-sky-200/24 bg-sky-300/10 text-sky-50',
    },
    {
        title: '施工',
        detail: '現場作業日',
        Icon: Hammer,
        accent: 'border-amber-200/24 bg-amber-300/10 text-amber-50',
    },
    {
        title: '納品',
        detail: 'B社 納品作業',
        Icon: PackageCheck,
        accent: 'border-emerald-200/24 bg-emerald-300/10 text-emerald-50',
    },
    {
        title: '契約',
        detail: '契約確認Event',
        Icon: Handshake,
        accent: 'border-violet-200/24 bg-violet-300/10 text-violet-50',
    },
    {
        title: '作業',
        detail: '定例タスク',
        Icon: Wrench,
        accent: 'border-cyan-200/24 bg-cyan-300/10 text-cyan-50',
    },
    {
        title: '現場対応',
        detail: '対応メモ起点',
        Icon: Truck,
        accent: 'border-rose-200/24 bg-rose-300/10 text-rose-50',
    },
];

const financeCards = [
    {
        title: '請求カード',
        detail: '請求日 / 期限 / 請求状態',
        Icon: ReceiptText,
        style: 'border-amber-200/28 bg-amber-300/10 text-amber-50',
    },
    {
        title: '入金カード',
        detail: '入金予定日 / 入金日 / 入金状態',
        Icon: Wallet,
        style: 'border-emerald-200/28 bg-emerald-300/10 text-emerald-50',
    },
    {
        title: '出金カード',
        detail: '出金予定日 / 出金日 / 支払状態',
        Icon: CircleDollarSign,
        style: 'border-rose-200/28 bg-rose-300/10 text-rose-50',
    },
];

const calendarLaneDays = [
    {
        day: '3(月)',
        cards: [
            {
                label: 'Event実施',
                title: 'A社 訪問',
                style: 'border-sky-200/26 bg-sky-300/10 text-sky-50',
            },
            {
                label: '請求期限',
                title: '訪問費 請求',
                style: 'border-amber-200/26 bg-amber-300/10 text-amber-50',
            },
        ],
    },
    {
        day: '4(火)',
        cards: [
            {
                label: '出金予定',
                title: '交通費',
                style: 'border-rose-200/26 bg-rose-300/10 text-rose-50',
            },
        ],
    },
    {
        day: '5(水)',
        cards: [
            {
                label: 'Event実施',
                title: 'B社 納品',
                style: 'border-sky-200/26 bg-sky-300/10 text-sky-50',
            },
        ],
    },
    {
        day: '6(木)',
        cards: [
            {
                label: '入金予定',
                title: 'A社 入金',
                style: 'border-emerald-200/26 bg-emerald-300/10 text-emerald-50',
            },
            {
                label: 'Eventなし',
                title: 'サーバ代',
                style: 'border-violet-200/26 bg-violet-300/10 text-violet-50',
            },
        ],
    },
    {
        day: '7(金)',
        cards: [
            {
                label: '請求期限',
                title: 'B社 請求',
                style: 'border-amber-200/26 bg-amber-300/10 text-amber-50',
            },
        ],
    },
    {
        day: '8(土)',
        cards: [
            {
                label: '入金予定',
                title: '単発入金',
                style: 'border-emerald-200/26 bg-emerald-300/10 text-emerald-50',
            },
        ],
    },
];

const dailyIncomeBars = [
    { label: '1日', value: '38%', amount: '8万' },
    { label: '2日', value: '62%', amount: '14万' },
    { label: '3日', value: '46%', amount: '10万' },
    { label: '4日', value: '78%', amount: '18万' },
];

const monthlyIncomeBars = [
    { label: '4月', value: '44%', amount: '42万' },
    { label: '5月', value: '70%', amount: '68万' },
    { label: '6月', value: '58%', amount: '55万' },
    { label: '7月', value: '82%', amount: '79万' },
];

const yearlyIncomeBars = [
    { label: '2023', value: '52%', amount: '510万' },
    { label: '2024', value: '70%', amount: '690万' },
    { label: '2025', value: '64%', amount: '630万' },
    { label: '2026', value: '86%', amount: '840万' },
];

const comparisonBars = [
    { label: '請求', value: '84%', style: 'bg-amber-300' },
    { label: '入金', value: '62%', style: 'bg-emerald-300' },
    { label: '出金', value: '38%', style: 'bg-rose-300' },
];

export function IdeaBoardVisualPanel({
    topicId,
    visualKind,
}: VisualPanelProps) {
    if (visualKind === 'concept-flow') {
        return <ConceptFlowDiagram />;
    }

    if (visualKind === 'event-examples') {
        return <EventExampleGrid />;
    }

    if (visualKind === 'card-relations') {
        return <CardRelationDiagram />;
    }

    if (visualKind === 'calendar-preview') {
        return <CalendarPreviewMock />;
    }

    return <VisualizationPreviewMock topicId={topicId} />;
}

function ConceptFlowDiagram() {
    return (
        <section className="rounded-lg border border-white/12 bg-white/6 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                {conceptFlowSteps.map((step, index) => {
                    const Icon = step.Icon;
                    const isLast = index === conceptFlowSteps.length - 1;

                    return (
                        <div
                            key={step.title}
                            className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"
                        >
                            <div
                                className={classNames(
                                    'min-w-0 flex-1 rounded-md border p-2.5',
                                    step.tone.card,
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={classNames(
                                            'grid h-8 w-8 flex-none place-items-center rounded-md',
                                            step.tone.badge,
                                        )}
                                    >
                                        <Icon
                                            className={classNames(
                                                'h-4 w-4',
                                                step.tone.icon,
                                            )}
                                            aria-hidden
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white">
                                            {step.title}
                                        </p>
                                        <p className="truncate text-xs text-slate-200/72">
                                            {step.detail}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {isLast ? null : (
                                <ArrowRight
                                    className="mx-auto h-4 w-4 flex-none rotate-90 text-slate-300/70 sm:rotate-0"
                                    aria-hidden
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function EventExampleGrid() {
    return (
        <section className="grid gap-3 rounded-lg border border-white/12 bg-white/6 p-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.38fr)]">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {eventExamples.map((event) => {
                    const Icon = event.Icon;

                    return (
                        <div
                            key={event.title}
                            className={classNames(
                                'rounded-md border p-2.5',
                                event.accent,
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 flex-none" aria-hidden />
                                <p className="text-sm font-semibold">
                                    {event.title}
                                </p>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-100/74">
                                {event.detail}
                            </p>
                        </div>
                    );
                })}
            </div>
            <div className="grid gap-2 rounded-md border border-emerald-200/22 bg-emerald-300/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100/82">
                    Eventカードの位置
                </p>
                <p className="text-sm font-semibold text-white">
                    お金そのものではなく、収支カード生成の起点
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-50/78">
                    <CalendarDays className="h-4 w-4 flex-none" aria-hidden />
                    <span>実施日や施工日はEvent側に置く</span>
                </div>
            </div>
        </section>
    );
}

function CardRelationDiagram() {
    return (
        <section className="grid gap-3 rounded-lg border border-white/12 bg-white/6 p-3">
            <div className="grid gap-2 md:grid-cols-[minmax(0,0.82fr)_auto_minmax(0,1.18fr)] md:items-stretch">
                <div className="grid gap-2">
                    <RelationCard
                        title="Event起因"
                        detail="訪問 / 施工 / 納品から収支カードを作る"
                        Icon={CalendarDays}
                        className="border-sky-200/28 bg-sky-300/10 text-sky-50"
                    />
                    <RelationCard
                        title="Eventなし"
                        detail="固定費、交通費、単発入金も直接作る"
                        Icon={FileCheck2}
                        className="border-violet-200/28 bg-violet-300/10 text-violet-50"
                    />
                </div>
                <div className="grid place-items-center">
                    <ArrowRight
                        className="h-5 w-5 rotate-90 text-cyan-100/82 md:rotate-0"
                        aria-hidden
                    />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                    {financeCards.map((card) => (
                        <RelationCard
                            key={card.title}
                            title={card.title}
                            detail={card.detail}
                            Icon={card.Icon}
                            className={card.style}
                        />
                    ))}
                </div>
            </div>
            <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                    <FlowLine label="Event → 請求 → 入金" />
                    <FlowLine label="Event → 出金" />
                    <FlowLine label="Eventなし → 請求 / 入金 / 出金" />
                    <FlowLine label="請求カードと入金カードは別カード" />
                </div>
                <div className="rounded-md border border-cyan-200/18 bg-cyan-300/8 p-3 text-xs leading-5 text-cyan-50/82">
                    カードはEvent起因だけではない。Eventなしの収支カードも正式ルートとして扱い、入金カードに施工日や実施日を直接持たせない。
                </div>
            </div>
        </section>
    );
}

function RelationCard({
    title,
    detail,
    Icon,
    className,
}: {
    title: string;
    detail: string;
    Icon: LucideIcon;
    className: string;
}) {
    return (
        <div className={classNames('rounded-md border p-2.5', className)}>
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 flex-none" aria-hidden />
                <p className="text-sm font-semibold">{title}</p>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-100/72">{detail}</p>
        </div>
    );
}

function FlowLine({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-950/28 px-2.5 py-2 text-xs font-semibold text-slate-100/78">
            <ArrowRight className="h-3.5 w-3.5 flex-none text-cyan-100" aria-hidden />
            <span>{label}</span>
        </div>
    );
}

function CalendarPreviewMock() {
    return (
        <section className="grid gap-3 rounded-lg border border-white/12 bg-white/6 p-3">
            <div className="flex flex-wrap items-center gap-2">
                {[
                    'Event実施日',
                    '請求期限日',
                    '入金予定日',
                    '出金予定日',
                ].map((axis) => (
                    <span
                        key={axis}
                        className="rounded-md border border-white/12 bg-slate-950/28 px-2 py-1 text-xs font-semibold text-slate-100/80"
                    >
                        {axis}
                    </span>
                ))}
            </div>
            <div className="min-w-0 overflow-x-auto pb-1">
                <div className="flex min-h-[260px] min-w-max gap-2">
                    {calendarLaneDays.map((date) => (
                        <div
                            key={date.day}
                            className="flex w-40 flex-none flex-col rounded-md border border-white/10 bg-slate-950/30"
                        >
                            <div className="border-b border-white/10 px-2.5 py-2">
                                <p className="text-sm font-semibold text-white">
                                    {date.day}
                                </p>
                            </div>
                            <div className="grid flex-1 content-start gap-2 p-2">
                                {date.cards.map((card) => (
                                    <div
                                        key={`${date.day}-${card.label}-${card.title}`}
                                        className={classNames(
                                            'rounded-md border p-2',
                                            card.style,
                                        )}
                                    >
                                        <p className="text-[10px] font-semibold">
                                            {card.label}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold leading-5 text-white">
                                            {card.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div
                className="rounded-md border border-emerald-200/18 bg-emerald-300/8 p-2 text-xs leading-5 text-emerald-50/78"
            >
                日を横一列のレーンとして並べ、各日の中にEventカードや収支カードを縦に積む。
            </div>
        </section>
    );
}

function VisualizationPreviewMock({ topicId }: { topicId: string }) {
    if (topicId === 'pie-chart') {
        return <PieRatioMock />;
    }

    if (topicId === 'unpaid') {
        return <UnpaidSummaryMock />;
    }

    if (topicId === 'monthly-summary') {
        return (
            <section className="grid gap-3 rounded-lg border border-white/12 bg-white/6 p-3 lg:grid-cols-2">
                <BarTrendMock title="月別入金額" bars={monthlyIncomeBars} />
                <ComparisonMock />
            </section>
        );
    }

    if (topicId === 'yearly-summary') {
        return (
            <section className="rounded-lg border border-white/12 bg-white/6 p-3">
                <BarTrendMock title="年別入金額" bars={yearlyIncomeBars} />
            </section>
        );
    }

    return (
        <section className="rounded-lg border border-white/12 bg-white/6 p-3">
            <BarTrendMock
                title={topicId === 'daily-summary' ? '日別入金額' : '棒グラフ候補'}
                bars={topicId === 'daily-summary' ? dailyIncomeBars : monthlyIncomeBars}
            />
        </section>
    );
}

function BarTrendMock({
    title,
    bars,
}: {
    title: string;
    bars: Array<{ label: string; value: string; amount: string }>;
}) {
    return (
        <div className="rounded-md border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{title}</p>
                <BarChart3 className="h-4 w-4 text-emerald-100" aria-hidden />
            </div>
            <div className="mt-3 grid gap-2">
                {bars.map((bar) => (
                    <div
                        key={bar.label}
                        className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-2"
                    >
                        <span className="text-xs font-semibold text-slate-200/78">
                            {bar.label}
                        </span>
                        <div className="h-6 overflow-hidden rounded-md border border-emerald-100/20 bg-slate-950/70">
                            <div
                                className="flex h-full min-w-8 items-center justify-end rounded-md px-2 text-[10px] font-semibold text-slate-950"
                                style={{
                                    width: bar.value,
                                    background:
                                        'linear-gradient(90deg, #34d399 0%, #a7f3d0 100%)',
                                }}
                            >
                                {bar.value}
                            </div>
                        </div>
                        <span className="text-right text-xs font-semibold text-emerald-50">
                            {bar.amount}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ComparisonMock() {
    return (
        <div className="rounded-md border border-white/10 bg-slate-950/30 p-3">
            <p className="text-sm font-semibold text-white">
                請求 / 入金 / 出金比較
            </p>
            <div className="mt-3 grid gap-2">
                {comparisonBars.map((bar) => (
                    <div key={bar.label} className="grid gap-1">
                        <div className="flex justify-between text-xs text-slate-200/78">
                            <span>{bar.label}</span>
                            <span>{bar.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                            <div
                                className={classNames(
                                    'h-2 rounded-full',
                                    bar.style,
                                )}
                                style={{ width: bar.value }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PieRatioMock() {
    return (
        <section className="grid gap-3 rounded-lg border border-white/12 bg-white/6 p-3 sm:grid-cols-2">
            <PieMock
                title="入金元別"
                detail="A社 / B社 / その他"
                gradient="conic-gradient(#6ee7b7 0 48%, #67e8f9 48% 76%, #c4b5fd 76% 100%)"
            />
            <PieMock
                title="出金カテゴリ別"
                detail="固定費 / 交通費 / 雑費"
                gradient="conic-gradient(#fb7185 0 36%, #fbbf24 36% 68%, #94a3b8 68% 100%)"
            />
        </section>
    );
}

function UnpaidSummaryMock() {
    return (
        <section className="grid gap-3 rounded-lg border border-white/12 bg-white/6 p-3 sm:grid-cols-3">
            {[
                ['未入金額', '31万'],
                ['未請求件数', '4件'],
                ['予定と実績の差', '2件'],
            ].map(([label, value]) => (
                <div
                    key={label}
                    className="rounded-md border border-rose-200/18 bg-rose-300/8 p-3"
                >
                    <p className="text-xs font-semibold text-rose-100/76">
                        {label}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                        {value}
                    </p>
                </div>
            ))}
            <div className="flex items-start gap-2 rounded-md border border-amber-200/18 bg-amber-300/8 p-3 text-xs leading-5 text-amber-50/78 sm:col-span-3">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
                <span>予定と実績は混ぜず、請求カードと入金カードの関係から読む。</span>
            </div>
        </section>
    );
}

function PieMock({
    title,
    detail,
    gradient,
}: {
    title: string;
    detail: string;
    gradient: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-md border border-white/10 bg-slate-950/30 p-3">
            <div
                className="h-14 w-14 flex-none rounded-full"
                style={{ background: gradient }}
                aria-hidden
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <PieChart className="h-3.5 w-3.5 flex-none text-cyan-100" aria-hidden />
                    <p className="text-sm font-semibold text-white">{title}</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-200/72">
                    {detail}
                </p>
            </div>
        </div>
    );
}

function classNames(
    ...classes: Array<string | false | null | undefined>
): string {
    return classes.filter(Boolean).join(' ');
}
