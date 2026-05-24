import { Head, Link } from '@inertiajs/react';

import PublicLayout from '@/Layouts/PublicLayout';

/*
 * PHP 側の EarthquakeXml*PreviewDTO::toArray() と対応する props 型です。
 * この画面は取得結果を観察する Preview なので、React から再取得 API を叩かず、
 * ページ遷移時に Controller が用意した result をそのまま表示します。
 */
type EarthquakeXmlEntryPreview = {
    id: string;
    title: string;
    updatedAt: string | null;
    publishedAt: string | null;
    xmlUrl: string | null;
    rawCategory: string | null;
    rawAuthor: string | null;
};

type EarthquakeXmlFeedPreview = {
    feedTitle: string | null;
    feedUpdatedAt: string | null;
    entries: {
        items: EarthquakeXmlEntryPreview[];
        count: number;
    };
};

type XmlPreviewResult = {
    endpoint: string;
    method: string;
    success: boolean;
    statusCode: number | null;
    fetchedAt: string | null;
    responseTimeMs: number | null;
    error: {
        status: number | null;
        message: string;
    } | null;
    feed: EarthquakeXmlFeedPreview | null;
};

type XmlPreviewProps = {
    result: XmlPreviewResult;
};

function valueOrDash(value: string | number | null) {
    return value === null || value === '' ? '-' : value;
}

export default function XmlPreview({ result }: XmlPreviewProps) {
    /*
     * 取得失敗時は feed=null になります。
     * UI 側では null を正常な状態として扱い、エラー区画と空一覧を表示します。
     */
    const entries = result.feed?.entries.items ?? [];

    return (
        <PublicLayout className="bg-slate-950/55 px-4 py-6 sm:px-6 lg:px-8">
            <Head title="XML取得プレビュー" />

            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 py-4">
                <header className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                            QuakeWave Preview
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                            XML取得プレビュー
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
                            気象庁の地震火山情報 Atom フィードを取得し、entry 一覧を確認する画面です。
                        </p>
                    </div>

                    <Link
                        href="/quakewave-preview"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                        QuakeWave Preview
                    </Link>
                </header>

                {/*
                    上部カードは通信確認のためのメトリクスだけを表示します。
                    raw XML 全文は表示せず、status / 件数 / 応答時間に絞ります。
                */}
                <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <article className="rounded-lg border border-white/15 bg-slate-950/62 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/70">
                            Status
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white">
                            {result.success ? 'OK' : 'Error'}
                        </p>
                    </article>
                    <article className="rounded-lg border border-white/15 bg-slate-950/62 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/70">
                            HTTP
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white">
                            {valueOrDash(result.statusCode)}
                        </p>
                    </article>
                    <article className="rounded-lg border border-white/15 bg-slate-950/62 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/70">
                            Entries
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white">
                            {result.feed?.entries.count ?? 0}
                        </p>
                    </article>
                    <article className="rounded-lg border border-white/15 bg-slate-950/62 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/70">
                            Response
                        </p>
                        <p className="mt-3 text-2xl font-semibold text-white">
                            {result.responseTimeMs === null ? '-' : `${result.responseTimeMs}ms`}
                        </p>
                    </article>
                </section>

                <section className="rounded-lg border border-cyan-100/25 bg-cyan-100/8 p-5 shadow-[0_18px_40px_rgba(8,145,178,0.12)]">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                                Feed
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-white">
                                {valueOrDash(result.feed?.feedTitle ?? null)}
                            </h2>
                            <dl className="mt-4 space-y-3 text-sm leading-6">
                                <div>
                                    <dt className="font-semibold text-slate-300/70">取得日時</dt>
                                    <dd className="break-all text-slate-100">{valueOrDash(result.fetchedAt)}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-300/70">Feed updated</dt>
                                    <dd className="break-all text-slate-100">{valueOrDash(result.feed?.feedUpdatedAt ?? null)}</dd>
                                </div>
                            </dl>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                                Endpoint
                            </p>
                            <p className="mt-2 break-all rounded-md border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs leading-5 text-cyan-50/90">
                                {result.endpoint}
                            </p>
                        </div>
                    </div>
                </section>

                {/*
                    エラーは status と短い message だけを表示します。
                    例外全文や stack trace は Preview UI に出しすぎない方針です。
                */}
                {result.error && (
                    <section className="rounded-lg border border-rose-200/35 bg-rose-200/10 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-100/80">
                            Error
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-white">
                            取得に失敗しました
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-rose-50/90">
                            status: {valueOrDash(result.error.status)} / {result.error.message}
                        </p>
                    </section>
                )}

                {/*
                    entry 一覧は個別 XML 電文解析の前段確認です。
                    この画面では link 先 XML の取得や地図 pin 変換は行わず、
                    Atom feed から読めた項目を並べるところまでに留めます。
                */}
                <section className="rounded-lg border border-white/15 bg-slate-950/70 shadow-[0_18px_40px_rgba(2,6,23,0.22)]">
                    <div className="border-b border-white/10 px-5 py-4">
                        <h2 className="text-xl font-semibold text-white">entry一覧</h2>
                    </div>

                    <div className="divide-y divide-white/10">
                        {entries.length > 0 ? (
                            entries.map((entry) => (
                                <article key={entry.id} className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                                        <p className="mt-2 break-all font-mono text-xs leading-5 text-cyan-50/80">
                                            {entry.id}
                                        </p>
                                    </div>
                                    <dl className="grid grid-cols-1 gap-3 text-sm leading-6 md:grid-cols-2">
                                        <div>
                                            <dt className="font-semibold text-slate-300/70">updatedAt</dt>
                                            <dd className="break-all text-slate-100">{valueOrDash(entry.updatedAt)}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold text-slate-300/70">publishedAt</dt>
                                            <dd className="break-all text-slate-100">{valueOrDash(entry.publishedAt)}</dd>
                                        </div>
                                        <div className="md:col-span-2">
                                            <dt className="font-semibold text-slate-300/70">xmlUrl</dt>
                                            <dd className="break-all text-slate-100">{valueOrDash(entry.xmlUrl)}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold text-slate-300/70">category</dt>
                                            <dd className="break-all text-slate-100">{valueOrDash(entry.rawCategory)}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold text-slate-300/70">author</dt>
                                            <dd className="break-all text-slate-100">{valueOrDash(entry.rawAuthor)}</dd>
                                        </div>
                                    </dl>
                                </article>
                            ))
                        ) : (
                            <p className="px-5 py-8 text-sm leading-6 text-slate-200/75">
                                表示できる entry はありません。
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
