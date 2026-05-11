import { motion } from 'motion/react';

import JapanSimpleMap from '@/Components/JapanQuakeWaveMap/JapanSimpleMap';

export type EarthquakeMapPin = {
    eventId: string;
    title: string;
    latitude: number;
    longitude: number;
    occurredAt: string;
    maxIntensity: string;
    magnitude: number | null;
    depthKm: number | null;
    areaName: string;
    headline: string;
};

export type EarthquakeFeedEntryPreview = {
    id: string;
    title: string;
    updatedAt: string | null;
    publishedAt: string | null;
    xmlUrl: string | null;
    rawCategory: string | null;
    rawAuthor: string | null;
};

export type LatestFeedEntryPreview = {
    success: boolean;
    statusCode: number | null;
    fetchedAt: string;
    responseTimeMs: number;
    error: {
        status: number | null;
        message: string;
    } | null;
    feedTitle: string | null;
    feedUpdatedAt: string | null;
    entryCount: number;
    entry: EarthquakeFeedEntryPreview | null;
};

type JapanQuakeWaveMapMockProps = {
    pins: EarthquakeMapPin[];
    latestFeedEntryPreview: LatestFeedEntryPreview;
};

/*
 * JapanQuakeWaveMapMock は MAP 表示モックの画面構成だけを担当します。
 * タイトル、説明、最新 feed entry パネル、地図表示エリアを束ねます。
 * 地震APIの定期取得、DB保存、個別XML解析、凡例、詳細パネルはまだ持ちません。
 *
 * pins は子コンポーネントへ渡すだけにしておくことで、
 * 「Laravel DTO -> Inertia props -> React map layer」の流れを保ちます。
 * 今はサンプルピンですが、将来の本番 pin DTO も同じ入口で差し替える想定です。
 */
export default function JapanQuakeWaveMapMock({ pins, latestFeedEntryPreview }: JapanQuakeWaveMapMockProps) {
    return (
        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]">
            <motion.div
                className="max-w-2xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
            >
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-950/70">
                    Lab Mock
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight text-white drop-shadow-[0_8px_26px_rgba(3,25,48,0.35)] sm:text-6xl">
                    JapanQuakeWaveMap
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-cyan-50/90 drop-shadow-[0_8px_22px_rgba(2,24,45,0.2)]">
                    水面の上に日本列島を浮かべる、地震波可視化画面の初期モックです。
                </p>

                <LatestFeedEntryPanel latestFeedEntryPreview={latestFeedEntryPreview} />
            </motion.div>

            <motion.div
                className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/30 bg-slate-950/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_26px_70px_rgba(2,24,45,0.25)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.8, ease: 'easeOut' }}
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/18 to-transparent" />
                <div className="relative h-full min-h-[520px] p-4 sm:p-6">
                    <JapanSimpleMap pins={pins} />
                </div>
            </motion.div>
        </section>
    );
}

function LatestFeedEntryPanel({
    latestFeedEntryPreview,
}: {
    latestFeedEntryPreview: LatestFeedEntryPreview;
}) {
    const entry = latestFeedEntryPreview.entry;

    return (
        /*
         * React state を増やさず、ブラウザ標準の details/summary で折りたたみます。
         * 最新情報は補助情報なので、地図を見たいときにユーザーがすぐ畳めるようにします。
         */
        <details
            open
            className="group mt-8 rounded-lg border border-white/25 bg-slate-950/30 p-4 text-cyan-50 shadow-[0_18px_42px_rgba(2,24,45,0.16)] backdrop-blur-md"
        >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 [&::-webkit-details-marker]:hidden">
                <span className="rounded-md border border-cyan-100/30 bg-cyan-50/15 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                    最新情報
                </span>
                <span className="flex items-center gap-2">
                    <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-cyan-50/80">
                        {latestFeedEntryPreview.entryCount} entries
                    </span>
                    <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-cyan-50/80 transition group-open:rotate-180">
                        v
                    </span>
                </span>
            </summary>

            {entry ? (
                <div className="mt-4 border-t border-white/15 pt-4">
                    <h2 className="text-xl font-semibold leading-7 text-white">
                        {entry.title}
                    </h2>

                    <dl className="mt-4 grid gap-3 text-sm text-cyan-50/85">
                        <div>
                            <dt className="text-xs font-semibold text-cyan-100/65">updated</dt>
                            <dd className="mt-1 break-words">{entry.updatedAt ?? '未取得'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold text-cyan-100/65">published</dt>
                            <dd className="mt-1 break-words">{entry.publishedAt ?? '未取得'}</dd>
                        </div>
                        {entry.rawCategory && (
                            <div>
                                <dt className="text-xs font-semibold text-cyan-100/65">category</dt>
                                <dd className="mt-1 break-words">{entry.rawCategory}</dd>
                            </div>
                        )}
                    </dl>

                    {entry.xmlUrl && (
                        <a
                            href={entry.xmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-cyan-100/35 bg-cyan-50/15 px-4 text-sm font-semibold text-white transition hover:bg-cyan-50/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                        >
                            個別XML
                        </a>
                    )}
                </div>
            ) : (
                <div className="mt-4 border-t border-white/15 pt-4">
                    <h2 className="text-xl font-semibold leading-7 text-white">
                        最新情報を取得できませんでした
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-cyan-50/78">
                        {latestFeedEntryPreview.error?.message ?? 'JMA Atom feed entry was not available.'}
                    </p>
                </div>
            )}

            <p className="mt-4 text-xs leading-5 text-cyan-50/62">
                fetched {latestFeedEntryPreview.fetchedAt}
            </p>
        </details>
    );
}
