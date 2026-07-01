import { AlertTriangle, BarChart3, PieChart } from 'lucide-react';

import type { IdeaBoardVisualKind } from './ideaBoardData';

type VisualPanelProps = {
    topicId: string;
    visualKind: IdeaBoardVisualKind;
};

const dailyIncomeBars = [
    { label: '1日', value: '38%', amount: '8万' },
    { label: '2日', value: '62%', amount: '14万' },
    { label: '3日', value: '46%', amount: '10万' },
    { label: '4日', value: '78%', amount: '18万' },
];

const monthlyExpenseBars = [
    { label: '4月', value: '44%', amount: '42万' },
    { label: '5月', value: '70%', amount: '68万' },
    { label: '6月', value: '58%', amount: '55万' },
    { label: '7月', value: '82%', amount: '79万' },
];

const invoiceStatusBars = [
    { label: '請求済', value: '84%', style: 'bg-amber-300' },
    { label: '期限前', value: '62%', style: 'bg-cyan-300' },
    { label: '期限超過', value: '38%', style: 'bg-rose-300' },
];

export function IdeaBoardVisualPanel({
    topicId,
    visualKind,
}: VisualPanelProps) {
    if (visualKind === 'none') {
        return null;
    }

    return <VisualizationPreviewMock topicId={topicId} />;
}

function VisualizationPreviewMock({ topicId }: { topicId: string }) {
    if (topicId === 'event-filtered-summary') {
        return <EventFilteredRatioMock />;
    }

    if (topicId === 'unpaid-leak') {
        return <UnpaidSummaryMock />;
    }

    if (topicId === 'expense-chart') {
        return (
            <section className="rounded-lg border border-white/12 bg-white/6 p-3">
                <BarTrendMock title="出金カード集計" bars={monthlyExpenseBars} />
            </section>
        );
    }

    if (topicId === 'invoice-chart') {
        return (
            <section className="rounded-lg border border-white/12 bg-white/6 p-3">
                <InvoiceStatusMock />
            </section>
        );
    }

    return (
        <section className="rounded-lg border border-white/12 bg-white/6 p-3">
            <BarTrendMock title="入金カード集計" bars={dailyIncomeBars} />
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

function InvoiceStatusMock() {
    return (
        <div className="rounded-md border border-white/10 bg-slate-950/30 p-3">
            <p className="text-sm font-semibold text-white">
                請求カード状態
            </p>
            <div className="mt-3 grid gap-2">
                {invoiceStatusBars.map((bar) => (
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

function EventFilteredRatioMock() {
    return (
        <section className="grid gap-3 rounded-lg border border-white/12 bg-white/6 p-3 sm:grid-cols-2">
            <PieMock
                title="イベント別入金カード"
                detail="月額保守 / 顧問料 / その他"
                gradient="conic-gradient(#6ee7b7 0 48%, #67e8f9 48% 76%, #c4b5fd 76% 100%)"
            />
            <PieMock
                title="イベント別出金カード"
                detail="固定費 / 外注費 / 交通費"
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
                ['請求漏れ候補', '4件'],
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
                <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 flex-none"
                    aria-hidden
                />
                <span>
                    未入金は入金カード、請求漏れは請求カードの状態から見る。
                </span>
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
                    <PieChart
                        className="h-3.5 w-3.5 flex-none text-cyan-100"
                        aria-hidden
                    />
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
