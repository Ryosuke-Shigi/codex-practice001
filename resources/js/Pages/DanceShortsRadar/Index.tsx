import { Head, Link } from '@inertiajs/react';

import PublicLayout from '@/Layouts/PublicLayout';

/*
 * DanceShortsRadar の通常ランキング本画面です。
 *
 * この画面は、サーバー側 Responder から渡された props を表示する責務に限定します。
 * region / comparisonDays / sortKey の切り替えは、Responder が作った href を Inertia Link で開き、
 * 保存済み snapshot 由来のランキングをサーバー側で再取得します。
 *
 * React 側で行わないこと:
 * - YouTube API 呼び出し
 * - viewCountDelta / viewGrowthRate / viewsPerHour の再計算
 * - ランキング sort
 * - モック専用 candidatesByRegion への本データ接続
 *
 * ここで行う数値処理は、受け取った値を ja-JP で読みやすく表示するための formatting だけです。
 */
type RegionTab = {
    code: string;
    label: string;
    description: string;
    href: string;
    isActive: boolean;
};

type ComparisonDayOption = {
    value: number;
    label: string;
    href: string;
    isActive: boolean;
};

type SortKeyOption = {
    value: string;
    label: string;
    href: string;
    isActive: boolean;
};

type RankingItem = {
    videoId: number;
    youtubeVideoId: string;
    title: string;
    channelTitle: string | null;
    thumbnailUrl: string | null;
    url: string | null;
    publishedAt: string | null;
    region: {
        code: string;
        name: string;
    };
    currentViewCount: number;
    previousViewCount: number;
    viewCountDelta: number;
    viewGrowthRate: number | null;
    viewsPerHour: number | null;
    collectedAt: string;
    currentCollectedAt: string;
    previousCollectedAt: string;
    comparisonDays: number;
};

type DanceShortsRadarIndexProps = {
    filters: {
        region: string | null;
        comparisonDays: number;
        limit: number;
        sortKey: string;
    };
    regionTabs: RegionTab[];
    comparisonDayOptions: ComparisonDayOption[];
    sortKeyOptions: SortKeyOption[];
    ranking: {
        items: RankingItem[];
        total: number;
    };
    emptyMessage: string;
};

const numberFormatter = new Intl.NumberFormat('ja-JP');
const compactNumberFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 1,
    style: 'percent',
});
const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

function formatMetric(value: number | null): string {
    return value === null ? '算出不可' : compactNumberFormatter.format(value);
}

function formatGrowthRate(value: number | null): string {
    return value === null ? '算出不可' : percentFormatter.format(value);
}

function formatDateTime(value: string | null): string {
    if (value === null) {
        return '未設定';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return dateTimeFormatter.format(date);
}

function MetricCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 border-t border-white/10 py-2 first:border-t-0">
            <dt className="text-xs font-semibold text-cyan-50/66">
                {label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-white">
                {value}
            </dd>
        </div>
    );
}

function OptionLinks({
    label,
    options,
}: {
    label: string;
    options: Array<ComparisonDayOption | SortKeyOption>;
}) {
    return (
        <section className="min-w-0">
            <p className="text-xs font-semibold text-cyan-50/70">{label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {options.map((option) => (
                    <Link
                        key={`${label}-${option.value}`}
                        href={option.href}
                        preserveScroll
                        className={[
                            'inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35',
                            option.isActive
                                ? 'border-white bg-white text-slate-950 shadow-[0_10px_20px_rgba(255,255,255,0.18)]'
                                : 'border-white/18 bg-white/8 text-cyan-50 hover:bg-white/14',
                        ].join(' ')}
                    >
                        {option.label}
                    </Link>
                ))}
            </div>
        </section>
    );
}

function RankingCard({ item, index }: { item: RankingItem; index: number }) {
    const thumbnail = item.thumbnailUrl;

    return (
        <article className="grid gap-4 rounded-lg border border-white/18 bg-slate-950/42 p-4 text-white shadow-[0_16px_34px_rgba(4,25,42,0.18)] backdrop-blur-xl md:grid-cols-[minmax(168px,220px)_minmax(0,1fr)]">
            <div className="min-w-0">
                {thumbnail === null ? (
                    <div className="grid aspect-video place-items-center rounded-md border border-white/14 bg-emerald-950/38 text-sm font-semibold text-emerald-50/78">
                        No Thumbnail
                    </div>
                ) : item.url === null ? (
                    <img
                        src={thumbnail}
                        alt=""
                        className="aspect-video w-full rounded-md object-cover"
                        loading="lazy"
                    />
                ) : (
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                    >
                        <img
                            src={thumbnail}
                            alt=""
                            className="aspect-video w-full rounded-md object-cover"
                            loading="lazy"
                        />
                    </a>
                )}
            </div>

            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-emerald-100/28 bg-emerald-100/12 px-2.5 py-1 text-xs font-semibold text-emerald-50">
                        {index + 1}
                    </span>
                    <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                        {item.region.name}
                    </span>
                    <span className="rounded-md border border-amber-100/24 bg-amber-100/12 px-2.5 py-1 text-xs font-semibold text-amber-50">
                        {item.comparisonDays}日比較
                    </span>
                </div>

                <h2 className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">
                    {item.title}
                </h2>
                <p className="mt-1 text-sm font-semibold text-cyan-50/72">
                    {item.channelTitle ?? 'チャンネル名未設定'}
                </p>

                <dl className="mt-4 grid gap-x-5 sm:grid-cols-2 xl:grid-cols-3">
                    <MetricCell
                        label="現在の視聴数"
                        value={`${formatNumber(item.currentViewCount)}回`}
                    />
                    <MetricCell
                        label="比較元の視聴数"
                        value={`${formatNumber(item.previousViewCount)}回`}
                    />
                    <MetricCell
                        label="視聴数の増加数"
                        value={`+${formatNumber(item.viewCountDelta)}回`}
                    />
                    <MetricCell
                        label="伸び率"
                        value={formatGrowthRate(item.viewGrowthRate)}
                    />
                    <MetricCell
                        label="1時間あたり"
                        value={`${formatMetric(item.viewsPerHour)}回/時`}
                    />
                    <MetricCell
                        label="収集日時"
                        value={formatDateTime(item.collectedAt)}
                    />
                </dl>

                <div className="mt-4 grid gap-2 text-xs text-cyan-50/66 sm:grid-cols-2">
                    <p>比較元: {formatDateTime(item.previousCollectedAt)}</p>
                    <p>公開日: {formatDateTime(item.publishedAt)}</p>
                </div>
            </div>
        </article>
    );
}

export default function DanceShortsRadarIndex({
    filters,
    regionTabs,
    comparisonDayOptions,
    sortKeyOptions,
    ranking,
    emptyMessage,
}: DanceShortsRadarIndexProps) {
    return (
        <PublicLayout className="px-4 py-5 sm:px-6 lg:px-8">
            <Head title="Dance Shorts Radar" />

            <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 pb-10">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase text-emerald-50/72">
                            Dance Shorts Radar
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                            通常ランキング
                        </h1>
                    </div>
                    <Link
                        href="/lab"
                        className="inline-flex min-h-10 items-center rounded-md border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35"
                    >
                        Labへ戻る
                    </Link>
                </header>

                <section className="grid gap-4 rounded-lg border border-white/18 bg-slate-950/38 p-4 text-white shadow-[0_16px_36px_rgba(4,25,42,0.16)] backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-cyan-50/78">
                            {filters.region ?? '地域未選択'} /{' '}
                            {filters.comparisonDays}日比較 /{' '}
                            {ranking.total}件
                        </p>
                        <p className="mt-1 text-xs text-cyan-50/60">
                            sort_key: {filters.sortKey} / limit:{' '}
                            {filters.limit}
                        </p>
                    </div>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:min-w-[520px]">
                        <OptionLinks
                            label="比較日数"
                            options={comparisonDayOptions}
                        />
                        <OptionLinks label="並び順" options={sortKeyOptions} />
                    </div>
                </section>

                <nav
                    aria-label="地域"
                    className="grid gap-2 rounded-lg border border-white/18 bg-slate-950/34 p-2 shadow-[0_14px_30px_rgba(4,25,42,0.14)] backdrop-blur-xl sm:grid-cols-3"
                >
                    {regionTabs.map((regionTab) => (
                        <Link
                            key={regionTab.code}
                            href={regionTab.href}
                            preserveScroll
                            aria-current={
                                regionTab.isActive ? 'page' : undefined
                            }
                            className={[
                                'min-h-14 rounded-md border px-3 py-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100/35',
                                regionTab.isActive
                                    ? 'border-white bg-white text-slate-950 shadow-[0_10px_20px_rgba(255,255,255,0.18)]'
                                    : 'border-white/14 bg-white/8 text-cyan-50 hover:bg-white/14',
                            ].join(' ')}
                        >
                            <span className="block text-sm font-semibold">
                                {regionTab.label}
                            </span>
                            <span className="mt-0.5 block text-xs opacity-72">
                                {regionTab.code}
                            </span>
                        </Link>
                    ))}
                </nav>

                {ranking.items.length === 0 ? (
                    <section className="rounded-lg border border-white/18 bg-slate-950/36 p-6 text-white shadow-[0_16px_34px_rgba(4,25,42,0.14)] backdrop-blur-xl">
                        <p className="text-sm font-semibold text-cyan-50/78">
                            {emptyMessage}
                        </p>
                    </section>
                ) : (
                    <section className="grid gap-4">
                        {ranking.items.map((item, index) => (
                            <RankingCard
                                key={`${item.region.code}-${item.youtubeVideoId}`}
                                item={item}
                                index={index}
                            />
                        ))}
                    </section>
                )}
            </main>
        </PublicLayout>
    );
}
