/**
 * DanceShortsAnalyzer MOCK の Page Component です。
 *
 * Search / Analyze の UI 契約を仮データで確認するページであり、Product の DB検索や snapshot 計算は行いません。
 */
import type { EChartsOption } from 'echarts';
import type { FormEvent, ReactNode } from 'react';

import { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';

import EChartsViewer from '@/Components/Common/Visualizations/Charts/EChartsViewer';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

const danceShortsAnalyzerReturn = getStageProjectReturnLink(
    'dance-shorts-analyzer',
);

type AnalyzerField = 'search' | 'analyze';
type AnalyzerMetric = 'views' | 'likes' | 'comments';
type AnalyzerPeriod = 'day' | 'week' | 'month' | 'all';
type SnapshotSlot = '0〜12時' | '12〜24時';

type MockVideo = {
    id: string;
    title: string;
    channelTitle: string;
    region: string;
    thumbnailUrl: string;
    viewsIncrease: number;
    likesIncrease: number;
    commentsIncrease: number;
    viewsPerHour: number;
    likesPerHour: number;
    commentsPerHour: number;
};

type PeriodSnapshot = {
    label: string;
    tableLabel: string;
    slot: SnapshotSlot;
    ratio: number;
};

const maxSelectedVideos = 5;

const mockVideos: MockVideo[] = [
    {
        id: 'jp-studio-mirror',
        title: '放課後スタジオのミラー振付',
        channelTitle: 'Tokyo Step Notes',
        region: 'JP',
        thumbnailUrl: '/images/dance-shorts-radar/mock-jp.svg',
        viewsIncrease: 13880,
        likesIncrease: 820,
        commentsIncrease: 74,
        viewsPerHour: 1156,
        likesPerHour: 68,
        commentsPerHour: 6,
    },
    {
        id: 'kr-formation-switch',
        title: 'Formation Switch Practice',
        channelTitle: 'Seoul Practice Grid',
        region: 'KR',
        thumbnailUrl: '/images/dance-shorts-radar/mock-kr.svg',
        viewsIncrease: 12840,
        likesIncrease: 790,
        commentsIncrease: 63,
        viewsPerHour: 1070,
        likesPerHour: 66,
        commentsPerHour: 5,
    },
    {
        id: 'us-rooftop-pair',
        title: 'Rooftop Pair Challenge',
        channelTitle: 'Weekend Motion',
        region: 'US',
        thumbnailUrl: '/images/dance-shorts-radar/mock-us.svg',
        viewsIncrease: 11820,
        likesIncrease: 610,
        commentsIncrease: 58,
        viewsPerHour: 985,
        likesPerHour: 51,
        commentsPerHour: 5,
    },
    {
        id: 'jp-cross-step',
        title: 'Cross Step Loop Shorts',
        channelTitle: 'Eight Count Lab',
        region: 'JP',
        thumbnailUrl: '/images/dance-shorts-radar/mock-jp.svg',
        viewsIncrease: 9840,
        likesIncrease: 540,
        commentsIncrease: 41,
        viewsPerHour: 820,
        likesPerHour: 45,
        commentsPerHour: 3,
    },
    {
        id: 'kr-practice-room',
        title: 'Practice Room Hand Wave',
        channelTitle: 'Seoul Motion Clip',
        region: 'KR',
        thumbnailUrl: '/images/dance-shorts-radar/mock-kr.svg',
        viewsIncrease: 9320,
        likesIncrease: 508,
        commentsIncrease: 39,
        viewsPerHour: 777,
        likesPerHour: 42,
        commentsPerHour: 3,
    },
    {
        id: 'us-sidewalk-sync',
        title: 'Sidewalk Sync Shorts',
        channelTitle: 'Street Pop Unit',
        region: 'US',
        thumbnailUrl: '/images/dance-shorts-radar/mock-us.svg',
        viewsIncrease: 8920,
        likesIncrease: 486,
        commentsIncrease: 34,
        viewsPerHour: 743,
        likesPerHour: 41,
        commentsPerHour: 3,
    },
    {
        id: 'jp-night-tutorial',
        title: 'Night Tutorial Count',
        channelTitle: 'Mirror Lesson JP',
        region: 'JP',
        thumbnailUrl: '/images/dance-shorts-radar/mock-jp.svg',
        viewsIncrease: 7560,
        likesIncrease: 390,
        commentsIncrease: 28,
        viewsPerHour: 630,
        likesPerHour: 33,
        commentsPerHour: 2,
    },
    {
        id: 'kr-pop-hook',
        title: 'Pop Hook Short Routine',
        channelTitle: 'K Move Draft',
        region: 'KR',
        thumbnailUrl: '/images/dance-shorts-radar/mock-kr.svg',
        viewsIncrease: 7140,
        likesIncrease: 362,
        commentsIncrease: 27,
        viewsPerHour: 595,
        likesPerHour: 30,
        commentsPerHour: 2,
    },
    {
        id: 'us-countdown-duo',
        title: 'Countdown Duo Move',
        channelTitle: 'Motion Weekend',
        region: 'US',
        thumbnailUrl: '/images/dance-shorts-radar/mock-us.svg',
        viewsIncrease: 6720,
        likesIncrease: 340,
        commentsIncrease: 24,
        viewsPerHour: 560,
        likesPerHour: 28,
        commentsPerHour: 2,
    },
    {
        id: 'jp-garage-bounce',
        title: 'Garage Bounce Drill',
        channelTitle: 'Step Garage',
        region: 'JP',
        thumbnailUrl: '/images/dance-shorts-radar/mock-jp.svg',
        viewsIncrease: 6180,
        likesIncrease: 298,
        commentsIncrease: 21,
        viewsPerHour: 515,
        likesPerHour: 25,
        commentsPerHour: 2,
    },
    {
        id: 'kr-line-check',
        title: 'Line Check Practice',
        channelTitle: 'Seoul Line Lab',
        region: 'KR',
        thumbnailUrl: '/images/dance-shorts-radar/mock-kr.svg',
        viewsIncrease: 5840,
        likesIncrease: 276,
        commentsIncrease: 19,
        viewsPerHour: 487,
        likesPerHour: 23,
        commentsPerHour: 2,
    },
    {
        id: 'us-turn-clean',
        title: 'Turn Clean Up Shorts',
        channelTitle: 'Clip Dance Room',
        region: 'US',
        thumbnailUrl: '/images/dance-shorts-radar/mock-us.svg',
        viewsIncrease: 5480,
        likesIncrease: 251,
        commentsIncrease: 18,
        viewsPerHour: 457,
        likesPerHour: 21,
        commentsPerHour: 2,
    },
];

const metricTabs: {
    key: AnalyzerMetric;
    label: string;
    increaseKey: keyof Pick<
        MockVideo,
        'viewsIncrease' | 'likesIncrease' | 'commentsIncrease'
    >;
    perHourKey: keyof Pick<
        MockVideo,
        'viewsPerHour' | 'likesPerHour' | 'commentsPerHour'
    >;
}[] = [
    {
        key: 'views',
        label: '視聴数',
        increaseKey: 'viewsIncrease',
        perHourKey: 'viewsPerHour',
    },
    {
        key: 'likes',
        label: '高評価数',
        increaseKey: 'likesIncrease',
        perHourKey: 'likesPerHour',
    },
    {
        key: 'comments',
        label: 'コメント数',
        increaseKey: 'commentsIncrease',
        perHourKey: 'commentsPerHour',
    },
];

const periodTabs: {
    key: AnalyzerPeriod;
    label: string;
}[] = [
    {
        key: 'day',
        label: '日',
    },
    {
        key: 'week',
        label: '週',
    },
    {
        key: 'month',
        label: '月',
    },
    {
        key: 'all',
        label: 'ALL',
    },
];

const dayInMilliseconds = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * dayInMilliseconds);
}

function isSameDate(leftDate: Date, rightDate: Date): boolean {
    return leftDate.toDateString() === rightDate.toDateString();
}

function formatMonthDay(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDayOfMonth(date: Date): string {
    return `${date.getDate()}`;
}

function startOfCurrentWeek(date: Date): Date {
    const day = date.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;

    return addDays(date, -daysFromMonday);
}

function resolvePreferredSnapshot(date: Date, now: Date): {
    slot: SnapshotSlot;
    ratio: number;
} {
    if (isSameDate(date, now) && now.getHours() < 12) {
        return {
            slot: '0〜12時',
            ratio: 0.64,
        };
    }

    return {
        slot: '12〜24時',
        ratio: 1,
    };
}

function formatSnapshotTableLabel(date: Date, slot: SnapshotSlot): string {
    return `${formatMonthDay(date)} ${slot === '12〜24時' ? '12-24' : '0-12'}`;
}

function buildPeriodSnapshots(period: AnalyzerPeriod, now = new Date()): PeriodSnapshot[] {
    if (period === 'day') {
        return [
            {
                label: `${formatMonthDay(now)} 0〜12`,
                tableLabel: '0〜12時',
                slot: '0〜12時',
                ratio: 0.64,
            },
            {
                label: `${formatMonthDay(now)} 12〜24`,
                tableLabel: '12〜24時',
                slot: '12〜24時',
                ratio: 1,
            },
        ];
    }

    if (period === 'week') {
        const startDate = startOfCurrentWeek(now);
        const days = Math.max(
            1,
            Math.floor((now.getTime() - startDate.getTime()) / dayInMilliseconds) + 1,
        );

        return Array.from({ length: days }, (_, index) => {
            const date = addDays(startDate, index);
            const snapshot = resolvePreferredSnapshot(date, now);

            return {
                label: formatMonthDay(date),
                tableLabel: formatSnapshotTableLabel(date, snapshot.slot),
                slot: snapshot.slot,
                ratio: snapshot.ratio * (0.72 + index * 0.05),
            };
        });
    }

    if (period === 'month') {
        const dayOfMonth = now.getDate();
        const length = Math.min(6, dayOfMonth);

        return Array.from({ length }, (_, index) => {
            const date = addDays(now, -(length - 1 - index));
            const snapshot = resolvePreferredSnapshot(date, now);

            return {
                label: formatDayOfMonth(date),
                tableLabel: formatSnapshotTableLabel(date, snapshot.slot),
                slot: snapshot.slot,
                ratio: snapshot.ratio * (0.54 + index * 0.08),
            };
        });
    }

    return [-35, -28, -21, -14, -7, 0].map((days, index) => {
        const date = addDays(now, days);
        const snapshot = resolvePreferredSnapshot(date, now);

        return {
            label: formatMonthDay(date),
            tableLabel: formatSnapshotTableLabel(date, snapshot.slot),
            slot: snapshot.slot,
            ratio: snapshot.ratio * (0.36 + index * 0.11),
        };
    });
}

function resolveMetricDefinition(metric: AnalyzerMetric) {
    return metricTabs.find((item) => item.key === metric) ?? metricTabs[0];
}

function metricValue(
    video: MockVideo,
    metric: AnalyzerMetric,
    snapshot: PeriodSnapshot,
    perHour = false,
): number {
    const metricDefinition = resolveMetricDefinition(metric);
    const key = perHour
        ? metricDefinition.perHourKey
        : metricDefinition.increaseKey;

    return Math.round(Number(video[key]) * snapshot.ratio);
}

function buildChartOption(
    metric: AnalyzerMetric,
    selectedVideos: MockVideo[],
    snapshots: PeriodSnapshot[],
): EChartsOption {
    const metricDefinition = resolveMetricDefinition(metric);
    const seriesValues = selectedVideos.map((video) => ({
        name: video.title,
        values: snapshots.map((snapshot) =>
            metricValue(video, metricDefinition.key, snapshot),
        ),
    }));
    const chartValues = seriesValues.flatMap((series) => series.values);
    const yAxisMin = Math.min(...chartValues);
    const yAxisMax = Math.max(...chartValues);

    return {
        backgroundColor: 'transparent',
        color: ['#60a5fa', '#22c55e', '#f97316', '#a78bfa', '#facc15'],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            borderColor: 'rgba(96, 165, 250, 0.32)',
            textStyle: {
                color: '#f8fafc',
            },
        },
        legend: {
            show: false,
        },
        grid: {
            left: 8,
            right: 8,
            top: 4,
            bottom: 4,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            boundaryGap: true,
            data: snapshots.map((snapshot) => snapshot.label),
            axisLabel: {
                color: '#bfdbfe',
                fontSize: 10,
                hideOverlap: false,
                interval: 0,
                margin: 8,
            },
            axisTick: {
                show: true,
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(191, 219, 254, 0.28)',
                },
            },
        },
        yAxis: {
            type: 'value',
            min: yAxisMin,
            max: yAxisMax,
            axisLabel: {
                color: '#bfdbfe',
                fontSize: 10,
                formatter: (value: number) => {
                    if (Math.abs(value) >= 1000000) {
                        return `${Math.round(value / 10000)}万`;
                    }

                    if (Math.abs(value) >= 1000) {
                        return `${Math.round(value / 1000)}k`;
                    }

                    return `${value}`;
                },
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(191, 219, 254, 0.14)',
                },
            },
        },
        series: [
            ...seriesValues.map((series) => ({
                name: series.name,
                type: 'line' as const,
                smooth: true,
                symbolSize: 7,
                lineStyle: {
                    width: 3,
                },
                data: series.values,
            })),
        ],
    };
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat('ja-JP').format(value);
}

function FieldPanel({ children }: { children: ReactNode }) {
    return (
        <section className="min-h-0 min-w-0 flex-1 overflow-x-hidden rounded-lg border border-white/16 bg-slate-950/58 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-4">
            {children}
        </section>
    );
}

function SelectedSummaryField({
    videos,
    onToggleVideo,
}: {
    videos: MockVideo[];
    onToggleVideo?: (videoId: string) => void;
}) {
    return (
        <section className="min-w-0 rounded-lg border border-white/14 bg-slate-950/46 px-3 py-2 backdrop-blur-xl">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="shrink-0 sm:w-24">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100/76">
                        Selected
                    </p>
                    <p className="text-xs font-bold text-white">
                        {videos.length} / {maxSelectedVideos}
                    </p>
                </div>
                <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex min-w-max gap-2">
                        {videos.length > 0 ? (
                            videos.map((video) => (
                                <button
                                    key={video.id}
                                    type="button"
                                    disabled={!onToggleVideo}
                                    onClick={() => onToggleVideo?.(video.id)}
                                    className="flex min-h-14 w-44 shrink-0 items-center gap-2 rounded-lg border-4 border-blue-100 bg-blue-600/55 p-1.5 text-left shadow-[0_0_0_2px_rgba(147,197,253,0.34),0_12px_26px_rgba(29,78,216,0.28)] transition hover:bg-blue-500/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-default disabled:hover:bg-blue-600/55"
                                >
                                    <img
                                        src={video.thumbnailUrl}
                                        alt=""
                                        loading="lazy"
                                        className="h-10 w-14 shrink-0 rounded-md object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold leading-4 text-white">
                                            {video.region}
                                        </p>
                                        <p className="line-clamp-2 text-[11px] leading-3 text-blue-100/82">
                                            {video.title}
                                        </p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-lg border border-white/14 bg-white/8 px-3 py-2 text-xs font-semibold text-slate-200/76">
                                未選択
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function SearchField({
    selectedVideoIds,
    onToggleVideo,
}: {
    selectedVideoIds: string[];
    onToggleVideo: (videoId: string) => void;
}) {
    const [keyword, setKeyword] = useState('');
    const [searchedKeyword, setSearchedKeyword] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const searchResults = useMemo(() => {
        const normalizedKeyword = searchedKeyword.trim().toLowerCase();

        if (!hasSearched || normalizedKeyword === '') {
            return mockVideos;
        }

        return mockVideos.filter((video) =>
            [
                video.title,
                video.channelTitle,
                video.region,
            ].some((value) =>
                value.toLowerCase().includes(normalizedKeyword),
            ),
        );
    }, [hasSearched, searchedKeyword]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSearchedKeyword(keyword);
        setHasSearched(true);
    };

    return (
        <FieldPanel>
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-x-hidden">
                <form
                    className="flex min-w-0 flex-col gap-2 sm:flex-row"
                    onSubmit={handleSearch}
                >
                    <input
                        aria-label="キーワード"
                        placeholder="キーワード入力"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/16 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300/70 focus:border-blue-200"
                    />
                    <button
                        type="submit"
                        className="min-h-10 rounded-lg border border-blue-200/35 bg-blue-500 px-5 text-sm font-bold text-white transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
                    >
                        Search
                    </button>
                </form>

                <div className="flex items-center justify-between gap-3 text-xs text-slate-200/78">
                    <span>最大 {maxSelectedVideos} 件まで選択できます。</span>
                    <span>
                        {selectedVideoIds.length} / {maxSelectedVideos}
                        {hasSearched ? ` ・ ${searchResults.length}件` : ''}
                    </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                    <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {searchResults.map((video, index) => {
                            const isSelected = selectedVideoIds.includes(video.id);
                            const canSelect =
                                isSelected ||
                                selectedVideoIds.length < maxSelectedVideos;

                            return (
                                <button
                                    key={video.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    disabled={!canSelect}
                                    onClick={() => onToggleVideo(video.id)}
                                    className={[
                                        'min-w-0 rounded-lg border bg-white/8 p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-45',
                                        isSelected
                                            ? 'border-4 border-blue-100 bg-blue-600/58 shadow-[0_0_0_2px_rgba(147,197,253,0.36),0_12px_28px_rgba(29,78,216,0.3)]'
                                            : 'border-white/12 hover:border-white/28 hover:bg-white/12',
                                    ].join(' ')}
                                >
                                    <div className="flex min-w-0 gap-2">
                                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-white/12 bg-slate-800">
                                            {index < 6 ? (
                                                <img
                                                    src={video.thumbnailUrl}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-blue-100">
                                                    LOADING
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-white">
                                                {video.title}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-blue-100/76">
                                                {video.channelTitle}
                                            </p>
                                            <p className="mt-2 text-xs font-semibold text-slate-200/78">
                                                {video.region} / +{formatNumber(video.viewsIncrease)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {searchResults.length === 0 && (
                        <div className="rounded-lg border border-white/14 bg-white/8 px-3 py-6 text-center text-sm font-semibold text-slate-200/78">
                            該当するモックデータはありません
                        </div>
                    )}
                </div>
            </div>
        </FieldPanel>
    );
}

function ThumbnailField({ videos }: { videos: MockVideo[] }) {
    return (
        <div className="thumbnailRail min-w-0 overflow-x-auto overflow-y-hidden pb-1 max-sm:landscape:overflow-x-hidden max-sm:landscape:overflow-y-auto max-sm:landscape:pb-0">
            <div className="flex min-w-max gap-1.5 max-sm:landscape:min-w-0 max-sm:landscape:flex-col">
                {videos.map((video, index) => (
                    <div
                        key={video.id}
                        className={[
                            'w-16 shrink-0 rounded-md border bg-white/8 p-0.5 max-sm:landscape:w-full',
                            index === 0
                                ? 'border-blue-300'
                                : 'border-white/14',
                        ].join(' ')}
                    >
                        <img
                            src={video.thumbnailUrl}
                            alt=""
                            loading="lazy"
                            className="aspect-video w-full rounded-md object-cover max-sm:landscape:aspect-square"
                        />
                        <p className="mt-0.5 truncate text-[10px] font-bold leading-3 text-white">
                            {video.region}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PeriodTabsField({
    activePeriod,
    onChangePeriod,
}: {
    activePeriod: AnalyzerPeriod;
    onChangePeriod: (period: AnalyzerPeriod) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {periodTabs.map((period) => {
                const isActive = activePeriod === period.key;

                return (
                    <button
                        key={period.key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChangePeriod(period.key)}
                        className={[
                            'min-h-6 rounded-md border px-2 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100',
                            isActive
                                ? 'border-blue-100 bg-blue-500 text-white'
                                : 'border-white/16 bg-white/8 text-blue-50 hover:bg-white/14',
                        ].join(' ')}
                    >
                        {period.label}
                    </button>
                );
            })}
        </div>
    );
}

function MetricTabsField({
    activeMetric,
    onChangeMetric,
}: {
    activeMetric: AnalyzerMetric;
    onChangeMetric: (metric: AnalyzerMetric) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {metricTabs.map((metric) => {
                const isActive = activeMetric === metric.key;

                return (
                    <button
                        key={metric.key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChangeMetric(metric.key)}
                        className={[
                            'min-h-8 rounded-full border px-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 sm:text-sm',
                            isActive
                                ? 'border-blue-200 bg-blue-500 text-white'
                                : 'border-white/16 bg-white/8 text-blue-50 hover:bg-white/14',
                        ].join(' ')}
                    >
                        {metric.label}
                    </button>
                );
            })}
        </div>
    );
}

function ChartField({
    activeMetric,
    selectedVideos,
    snapshots,
}: {
    activeMetric: AnalyzerMetric;
    selectedVideos: MockVideo[];
    snapshots: PeriodSnapshot[];
}) {
    const longestLabelLength = Math.max(
        ...snapshots.map((snapshot) => snapshot.label.length),
    );
    const labelWidth = longestLabelLength * 8 + 18;
    const chartMinWidth = Math.max(320, snapshots.length * labelWidth + 16);

    return (
        <div className="shrink-0 overflow-x-auto rounded-lg border border-white/14 bg-slate-950/50 p-1.5">
            <div style={{ minWidth: `${chartMinWidth}px` }}>
                <EChartsViewer
                    option={buildChartOption(
                        activeMetric,
                        selectedVideos,
                        snapshots,
                    )}
                    height="clamp(240px, 42dvh, 380px)"
                    renderer="svg"
                />
            </div>
        </div>
    );
}

function MetricTable({
    title,
    selectedVideos,
    activeMetric,
    snapshots,
    perHour = false,
}: {
    title: string;
    selectedVideos: MockVideo[];
    activeMetric: AnalyzerMetric;
    snapshots: PeriodSnapshot[];
    perHour?: boolean;
}) {
    return (
        <section className="min-w-0">
            <h2 className="mb-1 text-xs font-bold text-white">{title}</h2>
            <div className="rounded-lg border border-white/14 bg-slate-950/50">
                <table className="w-full table-fixed border-collapse text-left text-[9px] text-slate-100 sm:text-[10px]">
                    <colgroup>
                        <col className="w-[30%]" />
                        {selectedVideos.map((video) => (
                            <col key={video.id} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr className="border-b border-white/10 text-blue-100">
                            <th className="px-0.5 py-0.5 font-bold leading-[1.05]">区間</th>
                            {selectedVideos.map((video) => (
                                <th key={video.id} className="px-0.5 py-0.5 text-center align-top font-bold">
                                    <span className="line-clamp-2 break-words leading-[1.05]">
                                        {video.title}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {snapshots.map((snapshot) => (
                            <tr key={snapshot.tableLabel} className="border-b border-white/8 last:border-b-0">
                                <th className="break-words px-0.5 py-0.5 align-top font-bold leading-[1.05] text-slate-200/82">
                                    {snapshot.tableLabel}
                                </th>
                                {selectedVideos.map((video) => {
                                    return (
                                        <td key={video.id} className="break-words px-0.5 py-0.5 text-center align-top font-semibold leading-[1.05]">
                                            {formatNumber(metricValue(
                                                video,
                                                activeMetric,
                                                snapshot,
                                                perHour,
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function IncreaseTableField({
    activeMetric,
    selectedVideos,
    snapshots,
}: {
    activeMetric: AnalyzerMetric;
    selectedVideos: MockVideo[];
    snapshots: PeriodSnapshot[];
}) {
    return (
        <MetricTable
            title="増加量"
            selectedVideos={selectedVideos}
            activeMetric={activeMetric}
            snapshots={snapshots}
        />
    );
}

function IncreasePerHourTableField({
    activeMetric,
    selectedVideos,
    snapshots,
}: {
    activeMetric: AnalyzerMetric;
    selectedVideos: MockVideo[];
    snapshots: PeriodSnapshot[];
}) {
    return (
        <MetricTable
            title="1時間あたり"
            selectedVideos={selectedVideos}
            activeMetric={activeMetric}
            snapshots={snapshots}
            perHour
        />
    );
}

function AnalyzeField({
    selectedVideos,
    activeMetric,
    activePeriod,
    onChangePeriod,
}: {
    selectedVideos: MockVideo[];
    activeMetric: AnalyzerMetric;
    activePeriod: AnalyzerPeriod;
    onChangePeriod: (period: AnalyzerPeriod) => void;
}) {
    const snapshots = useMemo(
        () => buildPeriodSnapshots(activePeriod),
        [activePeriod],
    );

    return (
        <FieldPanel>
            <div className="grid h-full min-h-0 min-w-0 gap-1.5 overflow-hidden max-sm:landscape:grid-cols-[60px_minmax(0,1fr)]">
                <ThumbnailField videos={selectedVideos} />
                <div className="flex min-h-0 min-w-0 flex-col gap-1.5 overflow-hidden">
                    <PeriodTabsField
                        activePeriod={activePeriod}
                        onChangePeriod={onChangePeriod}
                    />
                    <ChartField
                        activeMetric={activeMetric}
                        selectedVideos={selectedVideos}
                        snapshots={snapshots}
                    />
                    <div className="grid min-h-0 min-w-0 flex-1 gap-1.5 overflow-y-auto overflow-x-hidden md:grid-cols-2">
                        <IncreaseTableField
                            activeMetric={activeMetric}
                            selectedVideos={selectedVideos}
                            snapshots={snapshots}
                        />
                        <IncreasePerHourTableField
                            activeMetric={activeMetric}
                            selectedVideos={selectedVideos}
                            snapshots={snapshots}
                        />
                    </div>
                </div>
            </div>
        </FieldPanel>
    );
}

export default function DanceShortsAnalyzerMock() {
    const [activeField, setActiveField] = useState<AnalyzerField>('search');
    const [activeMetric, setActiveMetric] = useState<AnalyzerMetric>('views');
    const [activePeriod, setActivePeriod] = useState<AnalyzerPeriod>('day');
    const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([
        'jp-studio-mirror',
        'kr-formation-switch',
        'us-rooftop-pair',
    ]);

    const selectedVideos = useMemo(
        () =>
            mockVideos.filter((video) => selectedVideoIds.includes(video.id)),
        [selectedVideoIds],
    );

    const visibleSelectedVideos =
        selectedVideos.length > 0 ? selectedVideos : mockVideos.slice(0, 1);
    const headerAction =
        activeField === 'search'
            ? selectedVideos.length > 0
                ? {
                      label: 'Analyze',
                      nextField: 'analyze' as const,
                      variant: 'analyze' as const,
                  }
                : null
            : {
                  label: '戻る',
                  accessibleLabel: '選択画面へ戻る',
                  nextField: 'search' as const,
                  variant: 'back' as const,
              };

    useEffect(() => {
        if (selectedVideos.length === 0 && activeField === 'analyze') {
            setActiveField('search');
        }
    }, [activeField, selectedVideos.length]);

    const toggleVideo = (videoId: string) => {
        setSelectedVideoIds((currentVideoIds) => {
            if (currentVideoIds.includes(videoId)) {
                return currentVideoIds.filter(
                    (currentVideoId) => currentVideoId !== videoId,
                );
            }

            if (currentVideoIds.length >= maxSelectedVideos) {
                return currentVideoIds;
            }

            return [...currentVideoIds, videoId];
        });
    };

    return (
        <PublicLayout
            effectIntensity="subtle"
            className="overflow-x-hidden bg-slate-950/46 px-3 py-3 sm:px-5"
        >
            <Head title="DanceShortsAnalyzer MOCK" />

            <article className="mx-auto flex h-[calc(100dvh-1.5rem)] min-w-0 max-w-6xl flex-col gap-2 overflow-hidden">
                <header className="min-w-0 rounded-lg border border-white/14 bg-white/10 p-2 backdrop-blur-xl sm:p-3">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/78">
                                MOCK
                            </p>
                            <h1 className="truncate text-lg font-black text-white sm:text-2xl">
                                DanceShortsAnalyzer
                            </h1>
                        </div>
                        <div className="flex min-h-10 shrink-0 items-center gap-2">
                            <Link
                                href={danceShortsAnalyzerReturn.href}
                                aria-label={danceShortsAnalyzerReturn.ariaLabel}
                                title={danceShortsAnalyzerReturn.title}
                                className="inline-flex min-h-10 max-w-[34vw] items-center justify-center rounded-lg border border-blue-100/35 bg-white/10 px-3 text-center text-xs font-bold leading-4 text-blue-50 transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 sm:max-w-none sm:whitespace-nowrap sm:px-4 sm:text-sm"
                            >
                                {danceShortsAnalyzerReturn.label}
                            </Link>
                            {headerAction && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActiveField(headerAction.nextField)
                                    }
                                    aria-label={
                                        headerAction.variant === 'back'
                                            ? headerAction.accessibleLabel
                                            : undefined
                                    }
                                    title={
                                        headerAction.variant === 'back'
                                            ? headerAction.accessibleLabel
                                            : undefined
                                    }
                                    className={[
                                        'min-h-10 max-w-[42vw] whitespace-normal rounded-lg border px-3 text-xs font-bold leading-4 transition focus-visible:outline-none focus-visible:ring-2 sm:max-w-none sm:whitespace-nowrap sm:px-4 sm:text-sm',
                                        headerAction.variant === 'analyze'
                                            ? 'border-yellow-100 bg-yellow-300 text-slate-950 shadow-[0_10px_22px_rgba(234,179,8,0.24)] hover:bg-yellow-200 focus-visible:ring-yellow-100'
                                            : 'border-blue-100/60 bg-white/12 text-blue-50 hover:bg-white/18 focus-visible:ring-blue-100',
                                    ].join(' ')}
                                >
                                    {headerAction.label}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {activeField === 'search' ? (
                    <>
                        <SelectedSummaryField
                            videos={selectedVideos}
                            onToggleVideo={toggleVideo}
                        />
                        <SearchField
                            selectedVideoIds={selectedVideoIds}
                            onToggleVideo={toggleVideo}
                        />
                    </>
                ) : (
                    <>
                        <section className="min-w-0 rounded-lg border border-white/14 bg-slate-950/46 px-3 py-2 backdrop-blur-xl">
                            <MetricTabsField
                                activeMetric={activeMetric}
                                onChangeMetric={setActiveMetric}
                            />
                        </section>
                        <AnalyzeField
                            selectedVideos={visibleSelectedVideos}
                            activeMetric={activeMetric}
                            activePeriod={activePeriod}
                            onChangePeriod={setActivePeriod}
                        />
                    </>
                )}
            </article>
        </PublicLayout>
    );
}
