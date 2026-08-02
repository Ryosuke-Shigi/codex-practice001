import type { ReactNode } from 'react';
import type { EChartsOption } from 'echarts';

import { useMemo, useState } from 'react';
/**
 * DanceShortsAnalyzer の idea-board Page Component です。
 *
 * Product の Search / Analyze 画面とは分け、複数動画比較の構想説明だけを表示します。
 */
import { Head } from '@inertiajs/react';

import EChartsViewer from '@/Components/Common/Visualizations/Charts/EChartsViewer';
import PortfolioLpFeatureGrid from '@/Components/Lab/PortfolioLpFeatureGrid';
import PortfolioLpHero from '@/Components/Lab/PortfolioLpHero';
import PortfolioLpTechSection from '@/Components/Lab/PortfolioLpTechSection';
import PortfolioLpTestSection from '@/Components/Lab/PortfolioLpTestSection';
import { getStageProjectReturnLink } from '@/Components/ProjectHub/projectNavigation';
import PublicLayout from '@/Layouts/PublicLayout';

const danceShortsAnalyzerReturn = getStageProjectReturnLink(
    'dance-shorts-analyzer',
);

type AnalyzerField = 'search' | 'analyze';
type AnalyzerMetric = 'view_count' | 'like_count' | 'comment_count';

type PreviewVideo = {
    id: string;
    youtubeVideoId: string;
    title: string;
    channelTitle: string;
    description: string;
    tags: string[];
    thumbnailUrl: string;
    latestSnapshot: string;
};

const previewVideos: PreviewVideo[] = [
    {
        id: 'jp-studio-step',
        youtubeVideoId: 'mock-jp-studio-step',
        title: '駅前スタジオの8カウント Shorts',
        channelTitle: 'Tokyo Step Notes',
        description:
            '短いサビ振付を複数人で合わせる、比較分析の基準にしたい保存済み動画です。',
        tags: ['JP', '8カウント', 'スタジオ'],
        thumbnailUrl: '/images/dance-shorts-radar/mock-jp.svg',
        latestSnapshot: 'views 1,268,400 / likes 58,300',
    },
    {
        id: 'us-rooftop-pair',
        youtubeVideoId: 'mock-us-rooftop-pair',
        title: 'Rooftop Pair Dance Shorts',
        channelTitle: 'Weekend Motion',
        description:
            '海外側で先に伸びた可能性を比較したい、ペア構成の保存済みShortsです。',
        tags: ['US', 'Pair', 'Challenge'],
        thumbnailUrl: '/images/dance-shorts-radar/mock-us.svg',
        latestSnapshot: 'views 889,000 / likes 31,600',
    },
    {
        id: 'kr-formation-switch',
        youtubeVideoId: 'mock-kr-formation-switch',
        title: 'Formation Switch Practice Shorts',
        channelTitle: 'Seoul Practice Grid',
        description:
            'フォーメーション切り替えの伸び方を、他動画と並べて確認したい保存済み動画です。',
        tags: ['KR', 'Formation', 'K-POP'],
        thumbnailUrl: '/images/dance-shorts-radar/mock-kr.svg',
        latestSnapshot: 'views 1,710,000 / likes 77,000',
    },
];

const featureItems = [
    {
        title: '保存済み動画を検索',
        description:
            'DanceShortsRadar が保存した動画本体を、youtube_video_id / title / description / channel_title / tags から探します。',
        label: 'Search',
    },
    {
        title: '複数動画を選択',
        description:
            '検索結果カードをクリックして、比較したい動画を複数選択します。選択中動画は小サムネイルで常に確認できます。',
        label: 'Select',
    },
    {
        title: 'snapshot 推移を比較',
        description:
            'view_count / like_count / comment_count の各 snapshot 推移を、タブ切り替えで見比べる構想です。',
        label: 'Compare',
    },
    {
        title: '差分表を確認',
        description:
            'snapshot 間の増加量を表で確認し、どの時間帯に伸びたかを後追いできるようにします。',
        label: 'Delta',
    },
    {
        title: '1時間あたり増加量を見る',
        description:
            'collected_at の間隔を使い、動画ごとの伸び方を同じ時間単位で比較する想定です。',
        label: 'Hourly',
    },
    {
        title: '分析の断定を避ける',
        description:
            '流行予測やバズ予測を断定せず、保存済み公開統計から見える比較材料として扱います。',
        label: 'Tone',
    },
];

const responsibilityLayers = [
    {
        name: 'Controller',
        role: 'HTTP入口として検索条件や選択動画IDを受け、Actionへ渡します。',
    },
    {
        name: 'Action',
        role: '検索、選択動画のsnapshot取得、比較用props作成までの手順を制御します。',
    },
    {
        name: 'Service',
        role: '差分、1時間あたり増加量、X軸期間などの業務判断を担当します。',
    },
    {
        name: 'Repository',
        role: 'dance_short_videos と dance_short_video_snapshots の取得境界を担当します。',
    },
    {
        name: 'DTO / Responder',
        role: '比較画面に必要なカード情報、表、EChartsOption、Inertia propsを整えます。',
    },
    {
        name: 'React',
        role: 'props表示、Field切り替え、active表示、metricタブ切り替え、EChartsViewerへのoption受け渡しだけを担当します。',
    },
];

const techItems = [
    {
        title: '既存テーブルを使う',
        description:
            '対象は dance_short_videos と dance_short_video_snapshots。新しい同期処理やYouTube API実行は作りません。',
    },
    {
        title: 'AND 検索案',
        description:
            '入力文字列を空白分割し、すべてのキーワード条件を満たす保存済み動画だけを候補にします。',
    },
    {
        title: '検索対象候補',
        description:
            'youtube_video_id / title / description / channel_title / tags を対象にし、keyword紐づきはMVP外にします。',
    },
    {
        title: 'Laravelで比較データを作る',
        description:
            '差分、1時間あたり増加量、X軸、EChartsOption、YouTube URLはLaravel側で生成します。',
    },
    {
        title: 'Reactは表示に限定',
        description:
            'Reactは選択状態やタブ表示を扱い、snapshot分析計算やEChartsOption生成を本体実装の前提にしません。',
    },
    {
        title: 'IDEA-BOARDだけ追加',
        description:
            '/dance-shorts-analyzer 本体ルート、DB取得、Repository、Action、Service、Job、Schedulerは作りません。',
    },
];

const testItems = [
    {
        title: 'PROJECT選択の開発段階',
        description:
            'DanceShortsAnalyzer の IDEA BOARD が、専用PROJECTの開発段階として表示されることを固定します。',
    },
    {
        title: 'IDEA-BOARD ルート',
        description:
            '/lab/dance-shorts-analyzer-idea-board が 200 を返し、Lab/DanceShortsAnalyzer を表示することを確認します。',
    },
    {
        title: '既存導線維持',
        description:
            '/dance-shorts-radar、RadarのIDEA-BOARD、RadarのMOCKへの既存導線を壊さないことを確認します。',
    },
    {
        title: '本体実装なし',
        description:
            '追加API、DB取得、YouTube API、Job、Scheduler を増やしていないことを差分レビューで確認します。',
    },
];

const searchSpecRows = [
    ['検索方式', '空白分割したキーワードをすべて満たす AND 検索'],
    ['検索対象', 'youtube_video_id / title / description / channel_title / tags'],
    ['MVP外', 'dance_short_search_keywords と動画の紐づき検索'],
    ['取得元', 'DanceShortsRadar が保存済みの動画と snapshot'],
] as const;

const laravelResponsibilities = [
    'DB取得',
    'snapshot取得',
    'snapshot間差分計算',
    '1時間あたり増加量計算',
    'X軸 min / max 算出',
    'X軸ラベル生成',
    'EChartsOption生成',
    '表示用カード情報生成',
    'YouTube URL生成',
    'Inertia props生成',
];

const reactResponsibilities = [
    'props表示',
    'search / analyze Field切り替え',
    '検索結果カードのactive表示',
    '選択中サムネイル表示',
    'view_count / like_count / comment_count タブ切り替え',
    'EChartsViewerへのoption渡し',
];

const reactNonResponsibilities = [
    'DB取得',
    'snapshot差分計算',
    '1時間あたり増加量計算',
    'X軸期間計算',
    'EChartsOption生成',
    '表示用数値の意味づけ',
    'YouTube URL生成',
];

const notDoing = [
    '/dance-shorts-analyzer 本体ルート',
    'DB取得',
    'Repository / Action / Service / Responder / DTO',
    'YouTube API追加実行',
    '新規同期処理',
    '新規Job / Scheduler',
    'AI解析',
    '動画内容解析',
    '音声解析',
    '新規背景Component',
    '新規グラフComponent',
    '流行予測やバズ予測の断定',
];

const metricTabs: {
    key: AnalyzerMetric;
    label: string;
    summary: string;
}[] = [
    {
        key: 'view_count',
        label: 'view_count',
        summary: '視聴数の snapshot 推移',
    },
    {
        key: 'like_count',
        label: 'like_count',
        summary: 'いいね数の snapshot 推移',
    },
    {
        key: 'comment_count',
        label: 'comment_count',
        summary: 'コメント数の snapshot 推移',
    },
];

const metricChartOptions: Record<AnalyzerMetric, EChartsOption> = {
    view_count: {
        backgroundColor: 'transparent',
        color: ['#67e8f9', '#34d399', '#fbbf24'],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            borderColor: 'rgba(103, 232, 249, 0.35)',
            textStyle: {
                color: '#f8fafc',
            },
        },
        legend: {
            top: 0,
            textStyle: {
                color: '#e2e8f0',
            },
        },
        grid: {
            left: 48,
            right: 20,
            top: 42,
            bottom: 32,
        },
        xAxis: {
            type: 'category',
            data: ['06:00', '09:00', '12:00', '15:00'],
            axisLabel: {
                color: '#cbd5e1',
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.24)',
                },
            },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#cbd5e1',
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.12)',
                },
            },
        },
        series: [
            {
                name: 'Tokyo Step Notes',
                type: 'line',
                smooth: true,
                data: [1120000, 1188000, 1226000, 1268400],
            },
            {
                name: 'Weekend Motion',
                type: 'line',
                smooth: true,
                data: [760000, 811000, 851000, 889000],
            },
            {
                name: 'Seoul Practice Grid',
                type: 'line',
                smooth: true,
                data: [1380000, 1515000, 1622000, 1710000],
            },
        ],
    },
    like_count: {
        backgroundColor: 'transparent',
        color: ['#67e8f9', '#34d399', '#fbbf24'],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            borderColor: 'rgba(103, 232, 249, 0.35)',
            textStyle: {
                color: '#f8fafc',
            },
        },
        legend: {
            top: 0,
            textStyle: {
                color: '#e2e8f0',
            },
        },
        grid: {
            left: 48,
            right: 20,
            top: 42,
            bottom: 32,
        },
        xAxis: {
            type: 'category',
            data: ['06:00', '09:00', '12:00', '15:00'],
            axisLabel: {
                color: '#cbd5e1',
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.24)',
                },
            },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#cbd5e1',
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.12)',
                },
            },
        },
        series: [
            {
                name: 'Tokyo Step Notes',
                type: 'line',
                smooth: true,
                data: [49300, 52400, 55700, 58300],
            },
            {
                name: 'Weekend Motion',
                type: 'line',
                smooth: true,
                data: [26200, 28100, 29700, 31600],
            },
            {
                name: 'Seoul Practice Grid',
                type: 'line',
                smooth: true,
                data: [64500, 69400, 73900, 77000],
            },
        ],
    },
    comment_count: {
        backgroundColor: 'transparent',
        color: ['#67e8f9', '#34d399', '#fbbf24'],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.94)',
            borderColor: 'rgba(103, 232, 249, 0.35)',
            textStyle: {
                color: '#f8fafc',
            },
        },
        legend: {
            top: 0,
            textStyle: {
                color: '#e2e8f0',
            },
        },
        grid: {
            left: 48,
            right: 20,
            top: 42,
            bottom: 32,
        },
        xAxis: {
            type: 'category',
            data: ['06:00', '09:00', '12:00', '15:00'],
            axisLabel: {
                color: '#cbd5e1',
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.24)',
                },
            },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#cbd5e1',
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.12)',
                },
            },
        },
        series: [
            {
                name: 'Tokyo Step Notes',
                type: 'line',
                smooth: true,
                data: [1420, 1610, 1780, 1940],
            },
            {
                name: 'Weekend Motion',
                type: 'line',
                smooth: true,
                data: [690, 758, 842, 920],
            },
            {
                name: 'Seoul Practice Grid',
                type: 'line',
                smooth: true,
                data: [2180, 2420, 2660, 2840],
            },
        ],
    },
};

const deltaRows = [
    ['06:00 -> 09:00', 'Tokyo Step Notes', '+68,000', '+3,100', '+190'],
    ['09:00 -> 12:00', 'Weekend Motion', '+40,000', '+1,600', '+84'],
    ['12:00 -> 15:00', 'Seoul Practice Grid', '+88,000', '+3,100', '+180'],
] as const;

const hourlyRows = [
    ['Tokyo Step Notes', '22,800 / h', '1,033 / h', '63 / h'],
    ['Weekend Motion', '12,667 / h', '633 / h', '26 / h'],
    ['Seoul Practice Grid', '29,333 / h', '1,033 / h', '60 / h'],
] as const;

type SectionProps = {
    eyebrow: string;
    title: string;
    children: ReactNode;
};

function Section({ eyebrow, title, children }: SectionProps) {
    return (
        <section className="py-8">
            <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase text-cyan-100/72">
                    {eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {title}
                </h2>
            </div>
            <div className="mt-5 min-w-0">{children}</div>
        </section>
    );
}

function CompactCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <article className="min-w-0 rounded-lg border border-white/14 bg-white/10 p-4 text-white backdrop-blur-xl">
            <h3 className="text-base font-semibold leading-6">{title}</h3>
            <div className="mt-3 min-w-0 text-sm leading-6 text-slate-200/78">
                {children}
            </div>
        </article>
    );
}

function PillList({ items }: { items: string[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <span
                    key={item}
                    className="rounded-md border border-cyan-100/26 bg-cyan-100/10 px-2.5 py-1 text-xs font-semibold text-cyan-50"
                >
                    {item}
                </span>
            ))}
        </div>
    );
}

function TableBlock({
    rows,
}: {
    rows: readonly (readonly string[])[];
}) {
    return (
        <div className="overflow-x-auto rounded-lg border border-white/14 bg-slate-950/42">
            <table className="min-w-full text-left text-sm">
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.join('-')} className="border-b border-white/10">
                            {row.map((cell, index) => (
                                <td
                                    key={cell}
                                    className={[
                                        'px-4 py-3 align-top text-slate-100/84',
                                        index === 0
                                            ? 'whitespace-nowrap font-semibold text-cyan-50'
                                            : 'min-w-[160px]',
                                    ].join(' ')}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SelectedThumbnails({ videos }: { videos: PreviewVideo[] }) {
    return (
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {videos.map((video) => (
                <img
                    key={video.id}
                    src={video.thumbnailUrl}
                    alt=""
                    className="h-12 w-16 rounded-md border border-cyan-100/35 object-cover"
                />
            ))}
        </div>
    );
}

function SearchFieldPreview({
    selectedVideos,
    selectedVideoIds,
    onToggleVideo,
    onAnalyze,
}: {
    selectedVideos: PreviewVideo[];
    selectedVideoIds: string[];
    onToggleVideo: (videoId: string) => void;
    onAnalyze: () => void;
}) {
    return (
        <div className="rounded-lg border border-cyan-100/24 bg-slate-950/52 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase text-cyan-100/72">
                        Search Field
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <input
                            aria-label="検索キーワード"
                            defaultValue="dance challenge studio"
                            className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/16 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300/60 focus:border-cyan-100/70"
                        />
                        <button
                            type="button"
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100/35 bg-cyan-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                        >
                            Search
                        </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300/72">
                        このIDEA-BOARDではDB検索を実行せず、保存済み動画検索のUI構想だけを表示します。
                    </p>
                </div>
                <div className="min-w-[160px] lg:max-w-[260px]">
                    <p className="text-right text-xs font-semibold uppercase text-cyan-100/72">
                        Selected
                    </p>
                    <div className="mt-2">
                        <SelectedThumbnails videos={selectedVideos} />
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
                {previewVideos.map((video) => {
                    const isSelected = selectedVideoIds.includes(video.id);

                    return (
                        <button
                            key={video.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onToggleVideo(video.id)}
                            className={[
                                'min-w-0 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100',
                                isSelected
                                    ? 'border-cyan-100/70 bg-cyan-100/16'
                                    : 'border-white/14 bg-white/8 hover:bg-white/12',
                            ].join(' ')}
                        >
                            <img
                                src={video.thumbnailUrl}
                                alt=""
                                className="aspect-video w-full rounded-md border border-white/14 object-cover"
                            />
                            <span className="mt-3 block break-all text-sm font-semibold leading-6 text-white">
                                {video.title}
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-cyan-100/76">
                                {video.youtubeVideoId}
                            </span>
                            <span className="mt-2 block break-all text-xs leading-5 text-slate-200/72">
                                {video.description}
                            </span>
                            <span className="mt-3 flex flex-wrap gap-1.5">
                                {video.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-md border border-white/12 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-50"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    onClick={onAnalyze}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-100/35 bg-emerald-100 px-5 text-sm font-bold text-slate-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
                >
                    Analyze
                </button>
            </div>
        </div>
    );
}

function AnalyzeFieldPreview({
    selectedVideos,
    activeMetric,
    onChangeMetric,
}: {
    selectedVideos: PreviewVideo[];
    activeMetric: AnalyzerMetric;
    onChangeMetric: (metric: AnalyzerMetric) => void;
}) {
    const activeMetricDefinition =
        metricTabs.find((metric) => metric.key === activeMetric) ??
        metricTabs[0];

    return (
        <div className="rounded-lg border border-emerald-100/24 bg-slate-950/52 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase text-emerald-100/72">
                        Analyze Field
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                        選択動画の snapshot 比較
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-200/78">
                        {activeMetricDefinition.summary}
                    </p>
                </div>
                <SelectedThumbnails videos={selectedVideos} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                {metricTabs.map((metric) => {
                    const isActive = activeMetric === metric.key;

                    return (
                        <button
                            key={metric.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onChangeMetric(metric.key)}
                            className={[
                                'min-h-10 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100',
                                isActive
                                    ? 'border-cyan-100 bg-cyan-100 text-slate-950'
                                    : 'border-white/16 bg-white/8 text-cyan-50 hover:bg-white/14',
                            ].join(' ')}
                        >
                            {metric.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-white/14 bg-slate-950/44 p-3">
                <EChartsViewer
                    option={metricChartOptions[activeMetric]}
                    height={320}
                    renderer="svg"
                />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <CompactCard title="snapshot間差分表">
                    <TableBlock rows={deltaRows} />
                </CompactCard>
                <CompactCard title="1時間あたり増加量表">
                    <TableBlock rows={hourlyRows} />
                </CompactCard>
            </div>
        </div>
    );
}

export default function DanceShortsAnalyzer() {
    const [activeField, setActiveField] = useState<AnalyzerField>('search');
    const [activeMetric, setActiveMetric] =
        useState<AnalyzerMetric>('view_count');
    const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([
        'jp-studio-step',
        'kr-formation-switch',
    ]);

    const selectedVideos = useMemo(
        () =>
            previewVideos.filter((video) =>
                selectedVideoIds.includes(video.id),
            ),
        [selectedVideoIds],
    );

    const toggleVideo = (videoId: string) => {
        setSelectedVideoIds((currentVideoIds) =>
            currentVideoIds.includes(videoId)
                ? currentVideoIds.filter((currentVideoId) => currentVideoId !== videoId)
                : [...currentVideoIds, videoId],
        );
    };

    const visibleSelectedVideos =
        selectedVideos.length > 0 ? selectedVideos : previewVideos.slice(0, 1);

    return (
        <PublicLayout className="bg-slate-950/45 px-4 py-5 sm:px-6 lg:px-8">
            <Head title="Dance Shorts Analyzer" />

            <article className="mx-auto flex min-h-screen min-w-0 w-[calc(100vw-2rem)] max-w-7xl flex-col gap-2 break-words pb-10 [overflow-wrap:anywhere] sm:w-[calc(100vw-3rem)] lg:w-full">
                <PortfolioLpHero
                    backHref={danceShortsAnalyzerReturn.href}
                    backLabel={danceShortsAnalyzerReturn.label}
                    backAriaLabel={danceShortsAnalyzerReturn.ariaLabel}
                    backTitle={danceShortsAnalyzerReturn.title}
                    eyebrow="Idea Board"
                    title="Dance Shorts Analyzer"
                    lead="DanceShortsRadar が保存した動画と snapshot を使い、複数動画を選択して比較分析する画面構想"
                    description="保存済みの動画を検索し、複数選択し、view / like / comment の snapshot 推移を比較するためのIDEA-BOARDです。このページでは本体分析、DB取得、YouTube API実行、Job、Schedulerは実装しません。"
                    status="構想・設計中"
                    keywords={[
                        'YouTube Shorts',
                        'Snapshot',
                        '複数比較',
                        'ECharts',
                        'Inertia',
                    ]}
                    metrics={[
                        {
                            label: 'Source',
                            value: 'Radar Data',
                            description:
                                'DanceShortsRadar が保存した動画本体と snapshot を前提にします。',
                        },
                        {
                            label: 'UI',
                            value: 'Search / Analyze',
                            description:
                                'ページ遷移ではなく、React内の大きなField切り替えで構想を見せます。',
                        },
                        {
                            label: 'Boundary',
                            value: 'Laravel Calc',
                            description:
                                '分析計算とEChartsOption生成はLaravel側の責務として説明します。',
                        },
                    ]}
                />

                <PortfolioLpFeatureGrid
                    eyebrow="Spec Points"
                    title="保存済みShortsを選び、snapshot推移を比較する"
                    description="Dance Shorts Radar の観測結果を再利用して、複数動画の伸び方を並べて見るための後続機能案です。"
                    features={featureItems}
                />

                <Section eyebrow="UI Plan" title="search / analyze Field 切り替え">
                    <div className="mb-4 flex flex-wrap gap-2">
                        {(['search', 'analyze'] as const).map((field) => {
                            const isActive = activeField === field;

                            return (
                                <button
                                    key={field}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => setActiveField(field)}
                                    className={[
                                        'min-h-11 rounded-lg border px-4 text-sm font-bold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100',
                                        isActive
                                            ? 'border-cyan-100 bg-cyan-100 text-slate-950'
                                            : 'border-white/16 bg-white/8 text-cyan-50 hover:bg-white/14',
                                    ].join(' ')}
                                >
                                    {field}
                                </button>
                            );
                        })}
                    </div>

                    {activeField === 'search' ? (
                        <SearchFieldPreview
                            selectedVideos={visibleSelectedVideos}
                            selectedVideoIds={selectedVideoIds}
                            onToggleVideo={toggleVideo}
                            onAnalyze={() => setActiveField('analyze')}
                        />
                    ) : (
                        <AnalyzeFieldPreview
                            selectedVideos={visibleSelectedVideos}
                            activeMetric={activeMetric}
                            onChangeMetric={setActiveMetric}
                        />
                    )}
                </Section>

                <Section eyebrow="Search" title="検索仕様案">
                    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                        <CompactCard title="AND検索の考え方">
                            <TableBlock rows={searchSpecRows} />
                        </CompactCard>
                        <CompactCard title="MVPで検索に入れないもの">
                            <p>
                                dance_short_search_keywords と動画の紐づきは未確定のため、
                                最初のAnalyzer MVPには入れません。まず保存済み動画そのものを探して、
                                複数選択できることを優先します。
                            </p>
                        </CompactCard>
                    </div>
                </Section>

                <PortfolioLpTechSection
                    eyebrow="Responsibility"
                    title="Laravelで計算し、Reactは表示する"
                    description="本体実装時は、検索結果、比較表、グラフoption、YouTube URL、Inertia propsをLaravel側で整えます。Reactは画面操作と表示に限定し、分析計算を持ちません。"
                    items={techItems}
                    layers={responsibilityLayers}
                />

                <Section eyebrow="Boundary" title="本体実装時の責務境界">
                    <div className="grid gap-5 lg:grid-cols-3">
                        <CompactCard title="Laravel側で行う">
                            <PillList items={laravelResponsibilities} />
                        </CompactCard>
                        <CompactCard title="React側で行う">
                            <PillList items={reactResponsibilities} />
                        </CompactCard>
                        <CompactCard title="React側で行わない">
                            <PillList items={reactNonResponsibilities} />
                        </CompactCard>
                    </div>
                </Section>

                <PortfolioLpTestSection
                    eyebrow="Testing"
                    title="IDEA-BOARD追加で守る確認点"
                    description="今回は表示用IDEA-BOARDの追加だけなので、導線とInertia componentを固定し、本体実装が混ざっていないことを差分で確認します。"
                    tests={testItems}
                    note="このページは保存済みsnapshotの比較分析構想を説明するだけです。追加API、AI解析、動画内容解析、音声解析、流行予測の断定は行いません。"
                />

                <Section eyebrow="Out Of Scope" title="今回実装しないこと">
                    <CompactCard title="IDEA-BOARD以外は作らない">
                        <PillList items={notDoing} />
                    </CompactCard>
                </Section>
            </article>
        </PublicLayout>
    );
}
